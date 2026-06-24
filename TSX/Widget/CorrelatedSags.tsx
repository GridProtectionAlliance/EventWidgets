//******************************************************************************************************
//  EventSearchCorrelatedSags.tsx - Gbtc
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
import { EventWidget } from '../global';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';

interface ITimeCorrelatedSags {
    EventID: number;
    EventType: string;
    SagMagnitudePercent: number;
    SagDurationMilliseconds: number;
    SagDurationCycles: number;
    StartTime: string;
    MeterName: string;
    AssetName: string;
}

interface ISetting {
    OpenSeeUrl: string,
    OverlappingWindow: number
}

const EventSearchCorrelatedSags: EventWidget.IWidget<ISetting> = {
    Name: 'CorrelatedSags',
    DefaultSettings: {
        OpenSeeUrl: 'http://opensee.demo.gridprotectionalliance.org',
        OverlappingWindow: 2
    },
    Settings: (props) => {
        return <>
            <div className="row">
                <div className="col">
                    <Input<ISetting>
                        Record={props.Settings}
                        Field={'OpenSeeUrl'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'OpenSEE URL'}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <Input<ISetting>
                        Record={props.Settings}
                        Field={'OverlappingWindow'}
                        Type={'number'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'Window (s)'}
                    />
                </div>
            </div>
        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<ITimeCorrelatedSags[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setStatus('loading');
            const handle = getTimeCorrelatedSags(props.HomePath, props.EventID, props.Settings.OverlappingWindow);

            handle.done((data) => {
                setData(data);
                setStatus('idle');
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath, props.Settings.OverlappingWindow]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Correlated Sags (within {props.Settings.OverlappingWindow} seconds):
                </div>
                <div className="card-body" >
                    {status === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: props.MaxHeight ?? 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        :
                        <Table<ITimeCorrelatedSags>
                            Data={data}
                            KeySelector={item => item.EventID}
                            OnClick={() => { /* Do Nothing */ }}
                            OnSort={() => { /* Do Nothing */ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                            TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            Selected={(d: ITimeCorrelatedSags) => d.EventID === props.EventID}
                        >
                            <Column<ITimeCorrelatedSags>
                                Key={'EventID'}
                                AllowSort={false}
                                Field={'EventID'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row =>
                                    <a id="eventLink" href={props.Settings.OpenSeeUrl + '?eventID=' + row.item.EventID} target='_blank'>
                                        <div style={{ width: '100%', height: '100%' }}>
                                            {row.item.EventID}
                                        </div>
                                    </a>
                                }
                            >
                                Event ID
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'EventType'}
                                AllowSort={false}
                                Field={'EventType'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Event Type
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'SagMagnitudePercent'}
                                AllowSort={false}
                                Field={'SagMagnitudePercent'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Magnitude
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'SagDurationMilliseconds'}
                                AllowSort={false}
                                Field={'SagDurationMilliseconds'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => `${row.item.SagDurationMilliseconds} ms (${row.item.SagDurationCycles} cycles)`}
                            >
                                Duration
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'StartTime'}
                                AllowSort={false}
                                Field={'StartTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                                Content={row => moment(row.item.StartTime).format('HH:mm:ss.SSS')}
                            >
                                Start Time
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'MeterName'}
                                AllowSort={false}
                                Field={'MeterName'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Meter Name
                            </Column>
                            <Column<ITimeCorrelatedSags>
                                Key={'AssetName'}
                                AllowSort={false}
                                Field={'AssetName'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Asset Name
                            </Column>
                        </Table>
                    }
                </div>
            </div>
        );
    }
};

const getTimeCorrelatedSags = (homePath: string, eventID: number, timeTolerance: number) => {
    return $.ajax({
        type: 'GET',
        url: `${homePath}api/EventWidgets/CorrelatedSags?eventId=${eventID}&timeTolerance=${timeTolerance}`,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: true,
        async: true
    });
};

export default EventSearchCorrelatedSags;
