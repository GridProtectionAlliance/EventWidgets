//******************************************************************************************************
//  EventSearchRelayPerformance.tsx - Gbtc
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
//  08/22/2019 - Christoph Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import moment from 'moment';
import { EventWidget } from '../global';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { CreateGuid } from '@gpa-gemstone/helper-functions';
import { Alert } from '@gpa-gemstone/react-interactive';

interface IRelayPerformanceTrend {
    BreakerID: number,
    EventID: number,
    Imax1: number,
    Imax2: number,
    TripInitiate: number,
    TripTime: number,
    PickupTime: number,
    TripCoilCondition: number,
    TripCoilConditionAlert: number,
    TripTimeAlert: number,
    PickupTimeAlert: number,
    TripCoilChannelID: number,
    Tmax1: number,
    TplungerLatch: number,
    IplungerLatch: number,
    Idrop: number,
    TiDrop: number,
    Tend: number,
    TripTimeCurrent: number,
    PickupTimeCurrent: number,
    TripCoilConditionTime: number,
    ExtinctionTimeA: number,
    ExtinctionTimeB: number,
    ExtinctionTimeC: number,
    I2CA: number,
    I2CB: number,
    I2CC: number,
    EventType: number
}

interface IRelayPerformanceTrendWithID extends IRelayPerformanceTrend {
    ID: string
}

interface ISetting {
    OpenSeeUrl: string
}

const EventSearchRelayPerformance: EventWidget.IWidget<ISetting> = {
    Name: 'RelayPerformance',
    DefaultSettings: { OpenSeeUrl: 'http://opensee.demo.gridprotectionalliance.org' },
    Settings: (props) => {
        return (
            <div className="row">
                <div className="col">
                    <Input<ISetting>
                        Record={props.Settings}
                        Field={'OpenSeeUrl'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'OpenSEE URL'}
                    />
                </div>
            </div>
        )
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<IRelayPerformanceTrend[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const dataWithID = React.useMemo<IRelayPerformanceTrendWithID[]>(() => data.map(item => ({ ...item, ID: CreateGuid() })), [data]);

        React.useEffect(() => {
            setStatus('loading');
            const handle = getRelayPerformanceData(props.HomePath, props.EventID);

            handle.done((data) => {
                setData(data);
                setStatus('idle');
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Breaker Performance:
                </div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching breaker performance data.
                        </Alert>
                    : null}
                    {status === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : data.length === 0 ?
                            <Alert Class='alert-info'>
                                No breaker performance data.
                            </Alert>
                        : 
                        <Table<IRelayPerformanceTrendWithID>
                            Data={dataWithID}
                            OnClick={() => { /* Do Nothing */ }}
                            OnSort={() => { /* Do Nothing */ }}
                            SortKey={''}
                            KeySelector={item => item.ID}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'EventID'}
                                AllowSort={false}
                                Field={'EventID'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => (
                                    <a id="eventLink" target="_blank" href={props.Settings.OpenSeeUrl + '?eventid=' + row.item.EventID}>
                                        <div style={{ width: '100%', height: '100%' }}> {row.item.EventID} </div>
                                    </a>
                                )}
                            >
                                Event ID
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'TripInitiate'}
                                AllowSort={false}
                                Field={'TripInitiate'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => moment(row.item.TripInitiate).format('MM/DD/YY HH:mm:ss.SSSS')}
                            >
                                Trip Initiation Time
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'TripTime'}
                                AllowSort={false}
                                Field={'TripTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.TripTime} micros`}
                            >
                                Trip Time
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'PickupTime'}
                                AllowSort={false}
                                Field={'PickupTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.PickupTime} micros`}
                            >
                                Pickup Time
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'ExtinctionTimeA'}
                                AllowSort={false}
                                Field={'ExtinctionTimeA'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.ExtinctionTimeA} micros`}
                            >
                                Extinction Time
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'TripCoilCondition'}
                                AllowSort={false}
                                Field={'TripCoilCondition'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.TripCoilCondition.toFixed(2)} A/s`}
                            >
                                Trip Coil Condition
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'Imax1'}
                                AllowSort={false}
                                Field={'Imax1'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.Imax1.toFixed(3)} A`}
                            >
                                L1
                            </Column>
                            <Column<IRelayPerformanceTrendWithID>
                                Key={'Imax2'}
                                AllowSort={false}
                                Field={'Imax2'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.Imax2.toFixed(3)} A`}
                            > L2
                            </Column>
                        </Table>
                    }
                </div>
            </div>
        );
    }
}

const getRelayPerformanceData = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/RelayPerformance?eventId=${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

export default EventSearchRelayPerformance;