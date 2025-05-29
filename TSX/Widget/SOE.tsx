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
import { Input, MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import { Table, Column }  from '@gpa-gemstone/react-table';
import cloneDeep from 'lodash/cloneDeep';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import _ from 'lodash';

interface IValue {
    Value: string
}
interface SOEInfo {
    Time: string,
    Alarm: string,
    Status: string
}
interface ISetting {
    FilterOut: string[],
    TimeWindow: number[],
}

const SOE: EventWidget.IWidget<ISetting> = {
    Name: 'SOE',
    DefaultSettings: {
        FilterOut: ['abnormal', 'close', 'no', 'normal', 'received', 'start', 'trip', 'yes'],
        TimeWindow: [2, 10, 60]
    },
    Settings: (props) => {
        const [filterVal, setFilterVal] = React.useState<{ Value: string }[]>([]);

        React.useEffect(() => {
            if (props.Settings.FilterOut == undefined)
                return;
            setFilterVal(props.Settings.FilterOut.map(t => ({ Value: t })))
        }, [props.Settings.FilterOut]);
        
        return <>
            
            {filterVal.map((item, i) => 
                <div className="row fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}> 
                <div className="col-6">
                    <Input<IValue>
                        Record={item}
                        Field={'Value'}
                        Setter={(record) => {
                            const u = _.cloneDeep(props.Settings.FilterOut);
                            u[i] = record.Value;
                            props.SetSettings({ FilterOut: u, ...props.Setting })
                        }}
                        Valid={() => true}
                            Label={'Filter ' + i} />
                    </div>
                    <div className="col-6">
                    <button className="btn btn-small btn-danger" onClick={() => {
                        const u = _.cloneDeep(props.Settings.FilterOut);
                        u.splice(i, 1);
                        props.SetSettings({ FilterOut: u, ...props.Setting })
                        }}><ReactIcons.TrashCan /></button>
                </div> </div>)}
            
            <div className="row">
                <div className="col">
                    <button className="btn btn-primary" onClick={() => {
                        const u = _.cloneDeep(props.Settings.FilterOut);
                        u.push('');
                        props.SetSettings({ FilterOut: u, ...props.Setting })
                    }}>Add Exclusion Filter</button>
                </div>
            </div>

            {timeVal.map((item, i) =>
                <div className="row fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    <div className="col-6">
                        <Input<IValue>
                            Record={item}
                            Field={'Value'}
                            Setter={(record) => {
                                const u = _.cloneDeep(props.Settings.TimeWindow);
                                u[i] = record.Value;
                                props.SetSettings({ TimeWindow: u, ...props.Settings })
                            }}
                            Valid={() => true}
                            Type={'number'}
                            Label={'Window ' + i + ' (s)'} />
                    </div>
                    <div className="col-6 m-auto">
                        <button className="btn btn-small btn-danger" onClick={() => {
                            const u = _.cloneDeep(props.Settings.TimeWindow);
                            u.splice(i, 1);
                            props.SetSettings({ TimeWindow: u, ...props.Settings })
                        }}><ReactIcons.TrashCan /></button>
                    </div> </div>)}

            <div className="row">
                <div className="col">
                    <button className="btn btn-primary" onClick={() => {
                        const u = _.cloneDeep(props.Settings.T);
                        u.push('');
                        props.SetSettings({ Time: u, ...props.Settings })
                    }}>Add Time Window</button>
                </div>
            </div>

        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [soeInfo, setSOEInfo] = React.useState<SOEInfo[]>([]);
        const [statusFilter, setStatusFilter] = React.useState<string[]>([])
        const [timeWindow, setTimeWindow] = React.useState<number>(2);
        const [filterOptions, setFilterOptions] = React.useState<{ Value: number, Text: string, Selected: boolean}[]>([])

        const timeWindowOptions = React.useMemo(() => props.Settings.TimeWindow.map((t) => ({ Value: t.toString(), Label: t.toString() }), [props.Settings.TimeWindow]);


        React.useEffect(() => {
            setFilterOptions(props.Settings.FilterOut.map((f, i) => ({ Value: i, Text: f.toLowerCase(), Selected: false })))
        }, [props.Settings.FilterOut]);

        React.useEffect(() => {
            setFilterOptions((d) => d.map(f => ({ ...f, Selected: statusFilter.includes(f.Text) })));
        }, [statusFilter])
        React.useEffect(() => {
            return GetData();
        }, [props.EventID, timeWindow, statusFilter]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/SOE/${props.EventID}/${timeWindow}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: false,
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
                                Options={timeWindowOptions}
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
                                    const remove = options.filter(o => o.Selected).map(o => o.Text)
                                    const add = options.filter(o => !o.Selected).map(o => o.Text);
                                    setStatusFilter(filters.filter(t => !remove.includes(t)).concat(add))
                                }} />
                        </div>

                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        <Table<SOEInfo>
                            Data={soeInfo}
                            OnSort={() => { /*Do Nothing*/ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            KeySelector={data => { return data.Time; /* Todo: Time might not be unique and generate errors, ensure it is or try to use something else */ }}
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <Column<SOEInfo>
                                Key={'Time'}
                                AllowSort={false}
                                Field={'Time'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Time
                            </Column>
                            <Column<SOEInfo>
                                Key={'Alarm'}
                                AllowSort={false}
                                Field={'Alarm'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Alarm
                            </Column>
                            <Column<SOEInfo>
                                Key={'Status'}
                                AllowSort={false}
                                Field={'Status'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Status
                            </Column>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
}

export default SOE;