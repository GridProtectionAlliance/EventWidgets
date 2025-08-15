//******************************************************************************************************
//  ITOA.tsx - Gbtc
//
//  Copyright (c) 2025, Grid Protection Alliance.  All Rights Reserved.
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
//  01/06/2025 - C Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { Input, MultiCheckBoxSelect, Select, TextArea } from '@gpa-gemstone/react-forms';
import { Table, Column }  from '@gpa-gemstone/react-table';
import cloneDeep from 'lodash/cloneDeep';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import _ from 'lodash';

interface IValue {
    Value: string|number
}
interface ItoaInfo {
    StartTime: string,
    Cause: string,
    Voltage: string
    ID: number,
    Station: string
}
interface ISetting {
    Filter: string[],
    SQLCommand: string,
    TimeWindow: number[]
}

const ITOA: EventWidget.IWidget<ISetting> = {
    Name: 'ITOA',
    DefaultSettings: {
        Filter: [],
        TimeWindow: [2,10,60,120],
        SQLCommand: ''
    },
    Settings: (props) => {
        const [filterVal, setFilterVal] = React.useState<{ Value: string }[]>([]);
        const [timeVal, setTimeVal] = React.useState<{ Value: number }[]>([]);

        React.useEffect(() => {
            if (props.Settings.Filter == undefined)
                return;
            setFilterVal(props.Settings.Filter.map(t => ({ Value: t })))
        }, [props.Settings.Filter]);
        
        React.useEffect(() => {
            if (props.Settings.TimeWindow == undefined)
                return;
            setTimeVal(props.Settings.TimeWindow.map(t => ({ Value: t })))
        }, [props.Settings.TimeWindow]);

        return <>

            {filterVal.map((item, i) => 
                <div className="row fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}> 
                <div className="col-6">
                    <Input<IValue>
                        Record={item}
                        Field={'Value'}
                        Setter={(record) => {
                            const u = _.cloneDeep(props.Settings.Filter);
                            u[i] = record.Value.toString();
                            props.SetSettings({ Filter: u, ...props.Settings })
                        }}
                        Valid={() => true}
                            Label={'Cause Code ' + i} />
                    </div>
                    <div className="col-6 m-auto">
                    <button className="btn btn-small btn-danger" onClick={() => {
                        const u = _.cloneDeep(props.Settings.Filter);
                        u.splice(i, 1);
                        props.SetSettings({ Filter: u, ...props.Settings })
                    }}><ReactIcons.TrashCan/></button>
                </div> </div>)}
            
            <div className="row">
                <div className="col">
                    <button className="btn btn-primary" onClick={() => {
                        const u = _.cloneDeep(props.Settings.Filter);
                        u.push('');
                        props.SetSettings({ Filter: u, ...props.Settings })
                    }}>Add Cause Filter</button>
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
                                u[i] = parseFloat(record.Value.toString());
                                props.SetSettings({ TimeWindow: u, ...props.Settings })
                            }}
                            Type={'number'}
                            Valid={() => true}
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
                        const u = _.cloneDeep(props.Settings.TimeWindow);
                        u.push(0);
                        props.SetSettings({ TimeWindow: u, ...props.Settings })
                    }}>Add Time Window</button>
                </div>
            </div>

            <div className="row">
                <div className="col">
                    <TextArea<ISetting>
                        Rows={4}
                        Record={{ SQLCommand: props.Settings.SQLCommand, ...props.Settings }}
                        Field="SQLCommand"
                        Label="SQL Command"
                        Valid={() => true}
                        Setter={(record) => {
                            props.SetSettings(record);
                        }}
                    />
                </div>
            </div>
        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<ItoaInfo[]>([]);
        const [causeFilter, setCauseFilter] = React.useState<string[]>([])
        const [timeWindow, setTimeWindow] = React.useState<number>(2);
        const [filterOptions, setFilterOptions] = React.useState<{ Value: number, Text: string, Selected: boolean}[]>([])

        const timeWindowOptions = React.useMemo(() => props.Settings.TimeWindow.map((t) => ({ Value: t.toString(), Label: t.toString() })), [props.Settings.TimeWindow]);

        React.useEffect(() => {
            setFilterOptions(props.Settings.Filter.map((f, i) => ({ Value: i, Text: f.toLowerCase(), Selected: false })))
            setCauseFilter(props.Settings.Filter.map(f => f.toLowerCase()));
        }, [props.Settings.Filter]);

        React.useEffect(() => {
            setFilterOptions((d) => d.map(f => ({ ...f, Selected: causeFilter.includes(f.Text) })));
        }, [causeFilter])

        React.useEffect(() => {
            return GetData();
        }, [props.EventID, timeWindow, causeFilter]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/ITOA/${props.EventID}/${timeWindow}/${props.WidgetID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: false,
                async: true
            }) as JQuery.jqXHR<ItoaInfo[]>;

            handle.done(d => { 
                if (causeFilter.length == 0)
                    setData(d);
                else
                    setData(d.filter(si => causeFilter.includes(si.Cause.toLowerCase())));
            });

            return function () {
                if (handle.abort != undefined) handle.abort();
            }
        }

        return (
            <div className="card">
                <div className="card-header">ITOA Events:</div>
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
                                Label={'Filter Causes: '}
                                OnChange={(evt, options) => {
                                    const filters = cloneDeep(causeFilter)
                                    const remove = options.filter(o => o.Selected).map(o => o.Text)
                                    const add = options.filter(o => !o.Selected).map(o => o.Text);
                                    setCauseFilter(filters.filter(t => !remove.includes(t)).concat(add))
                                }} />
                        </div>

                    </div>


                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        <Table<ItoaInfo>
                            Data={data}
                            OnSort={() => { /*Do Nothing*/ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            KeySelector={data => data.ID}
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <Column<ItoaInfo>
                                Key={'Time'}
                                AllowSort={false}
                                Field={'StartTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Time
                            </Column>
                            <Column<ItoaInfo>
                                Key={'Cause'}
                                AllowSort={false}
                                Field={'Cause'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Alarm
                            </Column>
                            <Column<ItoaInfo>
                                Key={'Station'}
                                AllowSort={false}
                                Field={'Station'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Description
                            </Column>
                            <Column<ItoaInfo>
                                Key={'Voltage'}
                                AllowSort={false}
                                Field={'Voltage'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Voltages
                            </Column>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
}

export default ITOA;