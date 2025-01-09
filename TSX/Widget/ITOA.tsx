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
import { Input, MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import { ReactTable }  from '@gpa-gemstone/react-table';
import cloneDeep from 'lodash/cloneDeep';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import _ from 'lodash';

interface IValue {
    Value: string
}
interface ItoaInfo {
    StartTime: string,
    Cause: string,
    Voltage: string
    ID: number,
    Station: string
}
interface ISetting {
    Filter: string[]
}

const ITOA: EventWidget.IWidget<ISetting> = {
    Name: 'ITOA',
    DefaultSettings: {
        Filter: []
    },
    Settings: (props) => {
        const [val, setVal] = React.useState<{ Value: string }[]>([]);

        React.useEffect(() => {
            if (props.Settings.Filter == undefined)
                return;
            setVal(props.Settings.Filter.map(t => ({ Value: t })))
        }, [props.Settings.Filter]);
        
        return <>
            
            {val.map((item, i) => 
                <div className="row fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}> 
                <div className="col-6">
                    <Input<IValue>
                        Record={item}
                        Field={'Value'}
                        Setter={(record) => {
                            const u = _.cloneDeep(props.Settings.Filter);
                            u[i] = record.Value;
                            props.SetSettings({ Filter: u })
                        }}
                        Valid={() => true}
                            Label={'Cause Code ' + i} />
                    </div>
                    <div className="col-6 m-auto">
                    <button className="btn btn-small btn-danger" onClick={() => {
                        const u = _.cloneDeep(props.Settings.Filter);
                        u.splice(i, 1);
                        props.SetSettings({ Filter: u })
                    }}><ReactIcons.TrashCan/></button>
                </div> </div>)}
            
            <div className="row">
                <div className="col">
                    <button className="btn btn-primary" onClick={() => {
                        const u = _.cloneDeep(props.Settings.Filter);
                        u.push('');
                        props.SetSettings({ Filter: u })
                    }}>Add Cause Filter</button>
                </div>
            </div>
        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<ItoaInfo[]>([]);
        const [causeFilter, setCauseFilter] = React.useState<string[]>([])
        const [timeWindow, setTimeWindow] = React.useState<number>(2);
        const [filterOptions, setFilterOptions] = React.useState<{ Value: number, Text: string, Selected: boolean}[]>([])

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
                url: `${props.HomePath}api/ITOA/${props.EventID}/${timeWindow}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
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
                                Options={[
                                    { Value: "2", Label: "2" },
                                    { Value: "10", Label: "10" },
                                    { Value: "60", Label: "60" },
                                    { Value: "120", Label: "120" }
                                ]}
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
                        <ReactTable.Table<ItoaInfo>
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
                            <ReactTable.Column<ItoaInfo>
                                Key={'Time'}
                                AllowSort={false}
                                Field={'StartTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Time
                            </ReactTable.Column>
                            <ReactTable.Column<ItoaInfo>
                                Key={'Cause'}
                                AllowSort={false}
                                Field={'Cause'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Alarm
                            </ReactTable.Column>
                            <ReactTable.Column<ItoaInfo>
                                Key={'Station'}
                                AllowSort={false}
                                Field={'Station'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Description
                            </ReactTable.Column>
                            <ReactTable.Column<ItoaInfo>
                                Key={'Voltage'}
                                AllowSort={false}
                                Field={'Voltage'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Voltages
                            </ReactTable.Column>
                        </ReactTable.Table>
                    </div>
                </div>
            </div>
        );
    }
}

export default ITOA;