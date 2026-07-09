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
import { Table, Column } from '@gpa-gemstone/react-table';
import { EventWidget } from '../global';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

interface IDisturbanceData {
    ID: number;
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
    Settings: () => <></>,
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IDisturbanceData[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setStatus('loading');
            const handle = getDisturbanceData(props.HomePath, props.EventID);
            handle.done((data) => {
                setStatus('idle')
                setData(data);
            }).fail(() => setStatus('error'));
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card">
                {/* the card/collapsible card in EE needs to be moved to gemstone and used across SEbrowser */}
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Voltage Disturbance in Waveform:</div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching voltage disturbance data.
                        </Alert>
                    : null}
                    {status === 'loading' ?

                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : data.length === 0 ?
                            <Alert Class='alert-info'>
                                No voltage disturbance data.
                            </Alert>
                        :
                        <Table<IDisturbanceData>
                            Data={data}
                            KeySelector={(item) => item.ID}
                            OnSort={() => {/*Do Nothing*/ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            Selected={(r) => r.IsWorstDisturbance}
                        >
                            <Column<IDisturbanceData>
                                Key={'EventType'}
                                AllowSort={false}
                                Field={'EventType'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Disturbance Type
                            </Column>
                            <Column<IDisturbanceData>
                                Key={'Phase'}
                                AllowSort={false}
                                Field={'Phase'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Phase
                            </Column>
                            <Column<IDisturbanceData>
                                Key={'PerUnitMagnitude'}
                                AllowSort={false}
                                Field={'PerUnitMagnitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => (row.item.PerUnitMagnitude * 100).toFixed(1)}
                            >
                                Magnitude (%)
                            </Column>
                            <Column<IDisturbanceData>
                                Key={'DurationSeconds'}
                                AllowSort={false}
                                Field={'DurationSeconds'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => (row.item.DurationSeconds * 1000).toFixed(2)}
                            >
                                Duration (ms)
                            </Column>
                            <Column<IDisturbanceData>
                                Key={'StartTime'}
                                AllowSort={false}
                                Field={'StartTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => moment(row.item.StartTime).format('HH:mm:ss.SSS')}
                            >
                                Start Time
                            </Column>
                            <Column<IDisturbanceData>
                                Key={'SeverityCode'}
                                AllowSort={false}
                                Field={'SeverityCode'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Severity
                            </Column>
                        </Table>
                    }
                </div>
            </div>
        );
    }
}

const getDisturbanceData = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/AssetVoltageDisturbances/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        async: true
    });
}

export default AssetVoltageDisturbances;