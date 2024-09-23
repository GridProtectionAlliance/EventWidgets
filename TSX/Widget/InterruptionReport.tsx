//******************************************************************************************************
//  InterruptionReport.tsx - Gbtc
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

import { ReactTable } from '@gpa-gemstone/react-table';
import { Select } from '@gpa-gemstone/react-forms';
import moment from 'moment';
import React from 'react';
import { EventWidget } from '../global';
import { error } from 'jquery';

interface IInterruption {
    TimeOut: string,
    TimeIn?: string,
    Class?: string,
    Area: string,
    ReportNumber: number,
    Explanation?: string,
    CircuitInfo: string
}

const InterruptionReport: EventWidget.IWidget<{}> = {
    Name: 'InterruptionReport',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IInterruption[]>([]);
        const [hours, setHours] = React.useState<number>(6);

        React.useEffect(() => {
            const handle = getData();
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [hours])

        function getData() {

            return $.ajax({
                type: "GET",
                url: `${props.HomePath}api/InterruptionReport/GetEvents/${hours}/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            }).fail((e,m) => { throw error(m) }).done((d) => { setData(d); });

        }

        function formatDif(Tout: string, Tin: string) {
            const T1 = moment(Tin);
            const T2 = moment(Tout);

            let r = '';
            if (T1.diff(T2, 'minute') >= 60)
                r = T1.diff(T2, 'hour').toFixed(0) + ' Hrs ';
            r = r + (T1.diff(T2, 'minute') % 60) + ' Min';
            return r;

        }
        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>Interruption Report:
                    <div className='pull-right'>
                        <div className="form-inline">
                            <Select
                                Record={{ hours }}
                                Field='hours'
                                Options={[
                                    { Value: "1", Label: "1" },
                                    { Value: "2", Label: "2" },
                                    { Value: "6", Label: "6" },
                                    { Value: "12", Label: "12" },
                                    { Value: "24", Label: "24" },
                                    { Value: "48", Label: "48" }
                                ]}
                                Setter={(record) => setHours(record.hours)}
                                Label="Time Window (hrs)"
                            />
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <ReactTable.Table<IInterruption>
                        KeySelector={item => item.ReportNumber}
                        Data={data}
                        OnSort={() => {/*Do Nothing*/ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.MaxHeight ?? 500, width: '100%' }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    >
                        <ReactTable.Column<IInterruption>
                            Key={'CircuitInfo'}
                            AllowSort={true}
                            Field={'CircuitInfo'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Substation Ckt
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'TimeOut'}
                            AllowSort={true}
                            Field={'TimeOut'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={row => (row.item.TimeIn == null && row.item.TimeOut != null ? moment(row.item.TimeOut).format("HH:mm") : null)}
                        > Time Out
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'TimeIn'}
                            AllowSort={true}
                            Field={'TimeIn'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={row => (row.item.TimeIn == null ? null : moment(row.item.TimeIn).format("HH:mm"))}
                        > Time In
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'TotalTime'}
                            AllowSort={true}
                            Field={'TimeIn'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={row => (row.item.TimeOut == null || row.item.TimeIn == null ? null : formatDif(row.item.TimeOut, row.item.TimeIn))}
                        > Total Time
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'Class'}
                            AllowSort={true}
                            Field={'Class'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Class Type
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'Area'}
                            AllowSort={true}
                            Field={'Area'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Affected Area/District
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'ReportNumber'}
                            AllowSort={true}
                            Field={'ReportNumber'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Report
                        </ReactTable.Column>
                        <ReactTable.Column<IInterruption>
                            Key={'Explanation'}
                            AllowSort={true}
                            Field={'Explanation'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Explanation
                        </ReactTable.Column>
                    </ReactTable.Table>
                </div>
            </div>
        );
    }
}

export default InterruptionReport;