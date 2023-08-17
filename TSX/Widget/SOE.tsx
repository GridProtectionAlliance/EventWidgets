//******************************************************************************************************
//  SOE.tsx - Gbtc
//
//  Copyright � 2020, Grid Protection Alliance.  All Rights Reserved.
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
//  03/23/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import Table from '@gpa-gemstone/react-table';
import cloneDeep from 'lodash/cloneDeep';
import { Input } from '@gpa-gemstone/react-forms';

interface ISOEFilters { abnormal: boolean, close: boolean, no: boolean, normal: boolean, received: boolean, start: boolean, trip: boolean, yes: boolean }

interface SOEInfo { Time: string, Alarm: string, Status: string }

const SOE: EventWidget.IWidget<EventWidget.ISetting> = {
    Name: 'TVASOE',
        DefaultSettings: { SystemCenterURL: 'http://localhost:8989' },
    Settings: (props) => {
        return <div className="row">
            <div className="col">
                <Input<EventWidget.ISetting>
                    Record={props.Settings}
                    Field={'SystemCenterURL'}
                    Help={'The URL for SystemCenter. This has to be accesable from the Client.'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'System Center URL'} />
            </div>
        </div>
    },
    Widget: (props: EventWidget.IWidgetProps<EventWidget.ISetting>) => {
        const [soeInfo, setSOEInfo] = React.useState<SOEInfo[]>([]);
        const [statusFilter, setStatusFilter] = React.useState<ISOEFilters>({ abnormal: false, close: false, no: false, normal: false, received: false, start: false, trip: false, yes: false })
        const [timeWindow, setTimeWindow] = React.useState<number>(2);

        React.useEffect(() => {
            return GetData();
        }, [props.EventID, timeWindow, statusFilter]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/SOE/${props.EventID}/${timeWindow}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done(data => {
                setSOEInfo(data);
            });

            return function () {
                if (handle.abort != undefined) handle.abort();
            }
        }

        return (
            <div className="card">
                <div className="card-header">SOE:</div>
                <div className="card-body">
                    <div className='row'>
                        <div className='col'>
                            <Select
                                Record={{ timeWindow }}
                                Field='timeWindow'
                                Options={[
                                    { Value: "2", Label: "2" },
                                    { Value: "10", Label: "10" },
                                    { Value: "60", Label: "60" }
                                ]}
                                Setter={(record) => setTimeWindow(record.timeWindow)}
                                Label="Time Window(s)"
                            />
                        </div>
                        <div className='col-8'>
                            <MultiCheckBoxSelect
                                Options={Object.keys(statusFilter).map((k, i) => ({ Value: i, Text: k, Selected: statusFilter[k] }))}
                                Label={'Filter Out: '}
                                OnChange={(evt, options) => {
                                    const filters = cloneDeep(statusFilter)
                                    const filterKeys = Object.keys(filters);

                                    options.forEach((option) => {
                                        const key = filterKeys[option.Value];
                                        filters[key as keyof ISOEFilters] = !filters[key as keyof ISOEFilters];
                                    });

                                    setStatusFilter(filters)
                                }} />
                        </div>

                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        <Table
                            cols={[
                                { key: "Time", label: "Time", field: "Time" },
                                { key: "Alarm", label: "Alarm", field: "Alarm" },
                                { key: "Status", label: "Status", field: "Status" }
                            ]}
                            data={soeInfo.filter(si => !statusFilter[si.Status.toLowerCase()])}
                            onSort={() => { /*Do Nothing*/ }}
                            sortKey={''}
                            ascending={true}
                            tableClass="table"
                            keySelector={data => data.Time}
                            theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            tbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default SOE;