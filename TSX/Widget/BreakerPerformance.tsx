//******************************************************************************************************
//  EventSearchPreviewPane.tsx - Gbtc
//
//  Copyright � 2019, Grid Protection Alliance.  All Rights Reserved.
//
//  Licensed to the Grid Protection Alliance (GPA) under one or more contributor license agreements. See
//  the NOTICE file distributed with this work for additional information regarding copyright ownership.
//  The GPA licenses this file to you under the MIT License (MIT), the "License"; you may not use this
//  file except in compliance with the License. You may obtain a copy of the License at:
//
//      http://opensource.org/licenses/MIT
//
//  Unless agreed to in writing, the subject software distributed under the License is distributed on an
//  "AS-IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. Refer to the
//  License for the specific language governing permissions and limitations.
//
//  Code Modification History:
//  ----------------------------------------------------------------------------------------------------
//  09/21/2019 - Christoph Lackner
//       Generated original version of source code.
//
//******************************************************************************************************
import * as React from 'react';
import moment from 'moment';
import { LineWithThreshold, Plot } from '@gpa-gemstone/react-graph';
import { ReactTable } from '@gpa-gemstone/react-table';
import { RandomColor } from '@gpa-gemstone/helper-functions';
import { EventWidget } from '../global';

interface IRelayPerformance {
    EventID: number,
    Tmax1: number,
    TplungerLatch: number,
    IplungerLatch: number,
    Idrop: number,
    TiDrop: number,
    Tend: number,
    TripTimeCurrent: number,
    PickupTimeCurrent: number,
    TripInitiate: string,
    TripTime: number,
    PickupTime: number,
    TripCoilCondition: number,
    Imax1: number,
    Imax2: number,
    TripTimeAlert: number,
    TripcoilConditionAlert: number,
    PickupTimeAlert: number,
    EventType: string,
    TripCoilConditionTime: number,
    ExtinctionTimeA?: number,
    ExtinctionTimeB?: number,
    ExtinctionTimeC?: number,
    I2CA?: number,
    I2CB?: number,
    I2CC?: number,
}

const EventSearchBreakerPerformance: EventWidget.IWidget<{}> = {
    Name: 'BreakerPerformance',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const divref = React.useRef(null);
        const [relayPeformance, setRelayPerformance] = React.useState<IRelayPerformance[]>([]);
        const [Tstart, setTstart] = React.useState<number>(0);
        const [Tend, setTend] = React.useState<number>(0);
        const [data, setData] = React.useState<IRelayPerformance[]>([]);
        const [Width, SetWidth] = React.useState<number>(0);

        React.useEffect(() => {

            const handle = getRelayPerformance()
            handle.done((data) => {
                setData(data);
            });
            return () => { if (handle != null && handle.abort != null) handle.abort(); };

        }, [props.EventID]);

        React.useLayoutEffect(() => { SetWidth(divref?.current?.offsetWidth ?? 0) });

        React.useEffect(() => {
            if (data.length == 0) return;
            setTstart(moment.utc(data[0].TripInitiate).valueOf());
            setTend(moment.utc(data[data.length - 1].TripInitiate).valueOf())
        }, [data])

        function getRelayPerformance(): JQuery.jqXHR<IRelayPerformance[]> {
          
            const h = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/BreakerPerformance?eventID=${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: false,
                async: true
            });

            h.done((d: IRelayPerformance[]) => { if (d != null) setRelayPerformance(d); })
            return h;
        }

        return (
            <>
                <div className="card">
                    <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                        Historic Breaker Performance:
                    </div>
                    <div className="card-body" ref={divref}>
                        {relayPeformance.length > 0 ? <div>
                            <Plot height={400} width={Width - 100} showBorder={false} defaultTdomain={[Tstart, Tend]} legend={'bottom'} Tlabel={'Time'}
                                Ylabel={'Trip (micros)'} showMouse={true} zoom={false} pan={false} useMetricFactors={false}>
                                <LineWithThreshold highlightHover={true} showPoints={true} lineStyle={'-'} color={RandomColor()} data={relayPeformance.map(ev => [moment.utc(ev.TripInitiate).valueOf(), ev.TripTime * 0.1] as [number, number]).reverse()}
                                    threshHolds={relayPeformance.length > 0 && relayPeformance[0].TripTimeAlert != 0 && relayPeformance[0].TripTimeAlert != undefined ? [{ Value: relayPeformance[0].TripTimeAlert, Color: '#ff0000' }] : []} legend={'Trip Time'}
                                />
                            </Plot>
                            <Plot height={400} width={Width - 100} showBorder={false} defaultTdomain={[Tstart, Tend]} legend={'bottom'} Tlabel={'Time'}
                                Ylabel={'Pickup (micros)'} showMouse={true} zoom={false} pan={false} useMetricFactors={false}>
                                <LineWithThreshold highlightHover={true} showPoints={true} lineStyle={'-'} color={RandomColor()} data={relayPeformance.map(ev => [moment.utc(ev.TripInitiate).valueOf(), ev.PickupTime * 0.1] as [number, number]).reverse()}
                                    threshHolds={relayPeformance.length > 0 && relayPeformance[0].PickupTimeAlert != 0 && relayPeformance[0].PickupTimeAlert != undefined ? [{ Value: relayPeformance[0].PickupTimeAlert, Color: '#ff0000' }] : []} legend={'Pickup Time'}
                                />
                            </Plot>
                            <Plot height={400} width={Width - 100} showBorder={false} defaultTdomain={[Tstart, Tend]} legend={'bottom'} Tlabel={'Time'}
                                Ylabel={'TCC (A/s)'} showMouse={true} zoom={false} pan={false} useMetricFactors={false}>
                                <LineWithThreshold highlightHover={true} showPoints={true} lineStyle={'-'} color={RandomColor()} data={relayPeformance.map(ev => [moment.utc(ev.TripInitiate).valueOf(), ev.TripCoilCondition] as [number, number]).reverse()}
                                    threshHolds={relayPeformance.length > 0 && relayPeformance[0].TripcoilConditionAlert != 0 && relayPeformance[0].TripcoilConditionAlert != undefined ? [{ Value: relayPeformance[0].TripcoilConditionAlert, Color: '#ff0000' }] : []} legend={'Trip Coil condition'}
                                />
                            </Plot>
                        </div> : null}
                        <ReactTable.Table<IRelayPerformance>
                            Data={data}
                            KeySelector={item => item.EventID}
                            OnClick={() => { /* Do Nothing */ }}
                            OnSort={() => { /* Do Nothing */ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <ReactTable.Column<IRelayPerformance>
                                Key={'EventID'}
                                AllowSort={true}
                                Field={'EventID'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Event ID
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'EventType'}
                                AllowSort={true}
                                Field={'EventType'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Type
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'TripInitiate'}
                                AllowSort={true}
                                Field={'TripInitiate'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => moment(row.item.TripInitiate).format('MM/DD/YY HH:mm:ss.SSSS')}
                            > Trip Initiation
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'TripCoilCondition'}
                                AllowSort={true}
                                Field={'TripCoilCondition'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.TripCoilCondition.toFixed(2)} A/s`}
                            > Trip Coil Condition
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'TripCoilConditionTime'}
                                AllowSort={true}
                                Field={'TripCoilConditionTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${(row.item.TripCoilConditionTime / 10).toFixed(0)}`}
                            > Tril Coil Condition Time
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'Tend'}
                                AllowSort={true}
                                Field={'Tend'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${(row.item.Tend / 10).toFixed(0)}`}
                            > TCE Curr. Extinction
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'ExtinctionTimeA'}
                                AllowSort={true}
                                Field={'ExtinctionTimeA'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${(row.item.ExtinctionTimeA / 10).toFixed(0)}`}
                            > Arc Time A
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'ExtinctionTimeB'}
                                AllowSort={true}
                                Field={'ExtinctionTimeB'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${(row.item.ExtinctionTimeB / 10).toFixed(0)}`}
                            > Arc Time B
                            </ReactTable.Column>
                            <ReactTable.Column<IRelayPerformance>
                                Key={'ExtinctionTimeC'}
                                AllowSort={true}
                                Field={'ExtinctionTimeC'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${(row.item.ExtinctionTimeC / 10).toFixed(0)}`}
                            > Arc Time C
                            </ReactTable.Column>
                        </ReactTable.Table>
                    </div>
                </div>
            </>
        )
    }
}

export default EventSearchBreakerPerformance;

