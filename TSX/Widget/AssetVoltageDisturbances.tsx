//******************************************************************************************************
//  EventSearchAssetVoltageDisturbances.tsx - Gbtc
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
//  04/25/2019 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************
import React from 'react';
import moment from 'moment';
import Table from '@gpa-gemstone/react-table';
import { EventWidget } from '../global';

interface IDisturbanceData {
    EventType: string;
    Phase: string;
    PerUnitMagnitude: number;
    DurationSeconds: number;
    StartTime: string;
    SeverityCode: string;
    IsWorstDisturbance: boolean;
}

const AssetVoltageDisturbances: EventWidget.IWidget<{}> = {
    Name: 'VoltageDisturbances',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IDisturbanceData[]>([]);

        React.useEffect(() => {
            const handle = getDisturbanceData();
            handle.done((data) => {
                setData(data);
            });
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID]);

        function getDisturbanceData() {
            return $.ajax({
                type: "GET",
                url: `${props.HomePath}api/AssetVoltageDisturbances/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });
        }

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Voltage Disturbance in Waveform:</div>
                <div className="card-body">
                    <Table
                        cols={[
                            { key: 'EventType', field: 'EventType', label: 'Disturbance Type' },
                            { key: 'Phase', field: 'Phase', label: 'Phase' },
                            { key: 'PerUnitMagnitude', field: 'PerUnitMagnitude', label: 'Magnitude (%)', content: (r) => (r.PerUnitMagnitude * 100).toFixed(1), },
                            { key: 'DurationSeconds', field: 'DurationSeconds', label: 'Duration (ms)', content: (r) => (r.DurationSeconds * 1000).toFixed(2), },
                            { key: 'StartTime', field: 'StartTime', label: 'Start Time', content: (r) => moment(r.StartTime).format('HH:mm:ss.SSS') },
                            { key: 'SeverityCode', field: 'SeverityCode', label: 'Severity' },
                        ]}
                        data={data}
                        onSort={() => {/*Do Nothing*/ }}
                        sortKey={''}
                        ascending={true}
                        tableClass="table"
                        theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        tbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        selected={(r) => r.IsWorstDisturbance}
                    />
                </div>
            </div>
        );
    }
}

export default AssetVoltageDisturbances;