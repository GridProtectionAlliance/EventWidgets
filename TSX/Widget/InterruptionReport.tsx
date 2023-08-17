//******************************************************************************************************
//  InterruptionReport.tsx - Gbtc
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

import Table from '@gpa-gemstone/react-table';
import { Select } from '@gpa-gemstone/react-forms';
import moment from 'moment';
import React from 'react';
import { EventWidget } from '../global';
import { Input } from '@gpa-gemstone/react-forms';

interface IInterruption {
    TimeOut: string,
    TimeIn?: string,
    Class?: string,
    Area: string,
    ReportNumber: number,
    Explanation?: string,
    CircuitInfo: string
}

const InterruptionReport: EventWidget.IWidget<EventWidget.ISetting> = {
    Name: 'HECCOIR',
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
        const [data, setData] = React.useState<IInterruption[]>([]);
        const [hours, setHours] = React.useState<number>(6);

        React.useEffect(() => {
            const handle = getData();
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [hours])

        function getData() {

            return $.ajax({
                type: "GET",
                url: `${homePath}api/InterruptionReport/GetEvents/${hours}/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            }).done((d) => { setData(d); });

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
                <div className="card-header">Interruption Report:
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
                    <Table<IInterruption>
                        cols={[
                            { key: 'CircuitInfo', field: 'CircuitInfo', label: 'Substation Ckt' },
                            {
                                key: 'TimeOut', field: 'TimeOut', label: 'Time Out',
                                content: (record) => (record.TimeIn == null && record.TimeOut != null ? moment(record.TimeOut).format("HH:mm") : null)
                            },
                            {
                                key: 'TimeIn', field: 'TimeIn', label: 'Time In',
                                content: (record) => (record.TimeIn == null ? null : moment(record.TimeIn).format("HH:mm"))
                            },
                            {
                                key: 'TotalTime', field: 'TimeIn', label: 'Total Time',
                                content: (record) => (record.TimeOut == null || record.TimeIn == null ? null : formatDif(record.TimeOut, record.TimeIn))
                            },
                            { key: 'Class', field: 'Class', label: 'Class Type' },
                            { key: 'Area', field: 'Area', label: 'Affected Area/District' },
                            { key: 'ReportNumber', field: 'ReportNumber', label: 'Report' },
                            { key: 'Explanation', field: 'Explanation', label: 'Explanation' }
                        ]}
                        data={data}
                        onSort={() => {/*Do Nothing*/ }}
                        sortKey={''}
                        ascending={true}
                        tableClass="table"
                        theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        tbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.MaxHeight ?? 500, width: '100%' }}
                        rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default InterruptionReport;