//******************************************************************************************************
//  SOE.tsx - Gbtc
//
//  Copyright © 2020, Grid Protection Alliance.  All Rights Reserved.
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
import { Input, MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import Table from '@gpa-gemstone/react-table';
import cloneDeep from 'lodash/cloneDeep';
import { TrashCan } from '@gpa-gemstone/gpa-symbols';
import _ from 'lodash';

interface ISOEFilters { abnormal: boolean, close: boolean, no: boolean, normal: boolean, received: boolean, start: boolean, trip: boolean, yes: boolean }
interface IValue {Value: string }
interface SOEInfo { Time: string, Alarm: string, Status: string }
interface ISetting {
    FilterOut: string[]
}
const SOE: EventWidget.IWidget<ISetting> = {
    Name: 'SOE',
    DefaultSettings: {
        FilterOut: ['abnormal', 'close', 'no', 'normal', 'received', 'start', 'trip', 'yes']
    },
    Settings: (props) => {
        const val = React.useMemo(() => props.Settings.FilterOut.map(t => ({ Value: t })), [props.Settings.FilterOut])
        return <>
            <div className="row">
                {val.map((item,i) => <div className="col-4">
                    <Input<IValue>
                        Record={item}
                        Field={'Value'}
                        Setter={(record) => {
                            const u = _.cloneDeep(props.Settings.FilterOut);
                            u[i] = record.Value;
                            props.SetSettings({ FilterOut: u })
                        }}
                        Valid={() => true}
                        Label={'Filter ' + i} />
                    <button className="btn btn-small btn-danger" onClick={() => {
                        const u = _.cloneDeep(props.Settings.FilterOut);
                        u.splice(i, 1);
                        props.SetSettings({ FilterOut: u })
                    }}>{TrashCan}</button>
                </div>)}
            </div>
            <div className="row">
                <div className="col">
                    <button className="btn btn-primary" onClick={() => {
                        const u = _.cloneDeep(props.Settings.FilterOut);
                        u.push('');
                        props.SetSettings({ FilterOut: u })
                    }}>Add Exclusion Filter</button>
                </div>
            </div>
        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [soeInfo, setSOEInfo] = React.useState<SOEInfo[]>([]);
        const [statusFilter, setStatusFilter] = React.useState<string[]>([])
        const [timeWindow, setTimeWindow] = React.useState<number>(2);
        const [filterOptions, setFilterOptions] = React.useState<{ Value: number, Text: string, Selected: boolean}[]>([])

        React.useEffect(() => {
            setFilterOptions(props.Settings.FilterOut.map((f, i) => ({ Value: i, Text: f.toLowerCase(), Selected: false })))
        }, [props.Settings.FilterOut]);

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
                setSOEInfo(data.filter(si => !statusFilter.includes(si.Status.toLowerCase())));
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
                                Label="Time Window (s)"
                            />
                        </div>
                        <div className='col-8'>
                            <MultiCheckBoxSelect
                                Options={filterOptions}
                                Label={'Filter Out: '}
                                OnChange={(evt, options) => {
                                    const filters = cloneDeep(statusFilter)
                                    const remove = options.filter(o => !o.Selected).map(o => o.Text)
                                    const add = options.filter(o => o.Selected).map(o => o.Text);
                                    setStatusFilter(filters.filter(t => !remove.includes(t)).concat(add))
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
                            data={soeInfo}
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