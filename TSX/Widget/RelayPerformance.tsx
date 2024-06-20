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
import { ReactTable } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';

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

interface ISetting { OpenSeeUrl: string }

const EventSearchRelayPerformance: EventWidget.IWidget<ISetting> = {
    Name: 'RelayPerformance',
   DefaultSettings: { OpenSeeUrl: 'http://opensee.demo.gridprotectionalliance.org' },
   Settings: (props) => {
    return <div className="row">
        <div className="col">
            <Input<ISetting>
                Record={props.Settings}
                Field={'OpenSeeUrl'}
                Setter={(record) => props.SetSettings(record)}
                Valid={() => true}
                Label={'OpenSEE URL'} />
        </div>
    </div>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<IRelayPerformanceTrend[]>([]);

        function getRelayPerformanceData() {
            return $.ajax({
                type: "GET",
                url: `${props.HomePath}api/RelayPerformance?eventId=${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });
        }

        React.useEffect(() => {
            const handle = getRelayPerformanceData();
            handle.done((data) => {
                setData(data);
            });
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID]);


        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Breaker Performance:
                </div>
                <div className="card-body">
                    <ReactTable.Table
                        Data={data}
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        KeySelector={item => item.EventID }
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default EventSearchRelayPerformance;