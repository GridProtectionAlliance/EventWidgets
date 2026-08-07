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
import { Input, Select, TextArea } from '@gpa-gemstone/react-forms';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Application } from '@gpa-gemstone/application-typings';
import { Alert } from '@gpa-gemstone/react-interactive';
import DynamicSQLResultsTable, { DynamicSQLRow } from './DynamicSQLResultsTable';

interface IValue {
    Value: string | number
}
interface ISetting {
    SQLCommand: string,
    TimeWindow: number[]
}

const ITOA: EventWidget.IWidget<ISetting> = {
    Name: 'ITOA',
    DefaultSettings: {
        TimeWindow: [2, 10, 60, 120],
        SQLCommand: ''
    },
    Settings: (props) => {
        return (
            <div className="row" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="col h-100" style={{ overflow: 'scroll' }}>
                    {props.Settings.TimeWindow?.map((item, i) =>
                        <div className="row fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }} key={`time_${i}`}>
                            <div className="col-6">
                                <Input<IValue>
                                    Record={{ Value: item }}
                                    Field={'Value'}
                                    Setter={(record) => {
                                        const timeWindow = [...props.Settings.TimeWindow];
                                        timeWindow[i] = record.Value as number;
                                        props.SetSettings({ ...props.Settings, TimeWindow: timeWindow })
                                    }}
                                    Type={'number'}
                                    Valid={() => true}
                                    Label={'Window ' + i + ' (s)'} />
                            </div>
                            <div className="col-6 m-auto">
                                <button className="btn btn-small btn-danger" onClick={() => {
                                    const timeWindow = [...props.Settings.TimeWindow];
                                    timeWindow.splice(i, 1);
                                    props.SetSettings({ ...props.Settings, TimeWindow: timeWindow })
                                }}>
                                    <ReactIcons.TrashCan />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="row">
                        <div className="col">
                            <button className="btn btn-primary" onClick={() => {
                                const newSettings = { ...props.Settings };
                                newSettings.TimeWindow = [...newSettings.TimeWindow, 0];
                                props.SetSettings(newSettings);
                            }}>
                                Add Time Window
                            </button>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col">
                            <TextArea<ISetting>
                                Rows={4}
                                Record={props.Settings}
                                Field="SQLCommand"
                                Label="SQL Command"
                                Valid={() => true}
                                Setter={props.SetSettings}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<DynamicSQLRow[]>([]);
        const [timeWindow, setTimeWindow] = React.useState<number>(2);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        const timeWindowOptions = React.useMemo(() => props.Settings.TimeWindow.map((t) => ({ Value: t.toString(), Label: t.toString() })), [props.Settings.TimeWindow]);
        const resultsMaxHeight = Math.min(props.MaxHeight, 200);

        //Effect to get ITOA data
        React.useEffect(() => {
            setStatus('loading');
            const handle = getITOAData(props.HomePath, props.EventID, timeWindow, props.WidgetID);

            handle.done((data) => {
                setData(data);
                setStatus('idle');
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath, props.WidgetID, timeWindow]);

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
                    </div>
                    <div style={{ maxHeight: resultsMaxHeight, overflowY: 'hidden'  }}>
                        {status === 'error' ?
                            <Alert Class='alert-danger'>
                                An error occurred while fetching ITOA data. Please check System Center for more details.
                            </Alert>
                            : null}
                        {status === 'loading' ?
                            <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                                <ReactIcons.SpiningIcon Size={'50%'} />
                            </div>
                            :
                            <DynamicSQLResultsTable
                                Data={data}
                                MaxHeight={resultsMaxHeight}
                            />
                        }
                    </div>
                </div>
            </div>
        );
    }
}

const getITOAData = (homePath: string, eventID: number, timeWindow: number, widgetID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/ITOA/${eventID}/${timeWindow}/${widgetID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        async: true
    }) as JQuery.jqXHR<DynamicSQLRow[]>;
};

export default ITOA;
