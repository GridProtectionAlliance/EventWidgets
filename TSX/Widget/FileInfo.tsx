//******************************************************************************************************
//  EventSearchFileInfo.tsx - Gbtc
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
//  02/21/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

interface ISetting {
    SystemCenterUrl: string
}

interface IMappedChannel {
    ID: number,
    Channel: string,
    Mapping: string
}

const EventSearchFileInfo: EventWidget.IWidget<ISetting> = {
    Name: 'FileInfo',
    DefaultSettings: {
        SystemCenterUrl: 'https://systemCenter.demo.gridprotectionalliance.org'
    },
    Settings: (props) => {
        return (
            <div className="row">
                <div className="col" >
                    <Input<ISetting>
                        Record={props.Settings}
                        Field={'SystemCenterUrl'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'SystemCenter URL'}
                    />
                </div>
            </div>
        )
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [fileName, setFileName] = React.useState<string>('');
        const [mappedChannels, setMappedChannels] = React.useState<Array<IMappedChannel>>([]);
        const [meterKey, setMeterKey] = React.useState<string>('');
        const [meterConfigurationID, setMeterConfigurationID] = React.useState<number>(0);
        const [fileNameStatus, setFileNameStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [mappedChannelsStatus, setMappedChannelsStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [meterConfigurationStatus, setMeterConfigurationStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setFileNameStatus('loading');
            const handle = getFileName(props.HomePath, props.EventID);

            handle.done((data) => {
                setFileName(data);
                setFileNameStatus('idle');
            }).fail(() => setFileNameStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath]);

        React.useEffect(() => {
            setMappedChannelsStatus('loading');
            const handle = getMappedChannels(props.HomePath, props.EventID);

            handle.done((data) => {
                setMappedChannels(data);
                setMappedChannelsStatus('idle');
            }).fail(() => setMappedChannelsStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath]);

        React.useEffect(() => {
            setMeterConfigurationStatus('loading');
            const handle = getMeterConfiguration(props.HomePath, props.EventID);

            handle.done((data) => {
                if (data.length > 0) {
                    setMeterKey(data[0]);
                    setMeterConfigurationID(data[1]);
                }
                setMeterConfigurationStatus('idle');
            }).fail(() => setMeterConfigurationStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    File Info:
                </div>

                <div className="card-body">
                    <div className="d-flex justify-content-end">
                        {meterConfigurationStatus === 'loading' ?
                            <ReactIcons.SpiningIcon Size={'1em'} />
                            :
                            <a target="_blank" href={props.Settings.SystemCenterUrl + `?name=ConfigurationHistory&MeterKey=${meterKey}&MeterConfigurationID=${meterConfigurationID}`}>
                                Meter Configuration Via System Center
                            </a>
                        }
                    </div>
                    {fileNameStatus === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching file name data.
                        </Alert>
                    : null}
                    {mappedChannelsStatus === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching mapped channel data.
                        </Alert>
                    : null}
                    {fileNameStatus === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: '1.5em' }}>
                            <ReactIcons.SpiningIcon Size={'1em'} />
                        </div>
                        : fileName.length === 0 ?
                            <Alert Class='alert-info'>
                                No file name data.
                            </Alert>
                            :
                            <p>{fileName}</p>
                    }
                    {mappedChannelsStatus === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : mappedChannels.length === 0 ?
                            <Alert Class='alert-info'>
                                No mapped channel data.
                            </Alert>
                            :
                            <Table<IMappedChannel>
                                Data={mappedChannels}
                                OnClick={() => { /* Do Nothing */ }}
                                OnSort={() => { /* Do Nothing */ }}
                                SortKey={''}
                                KeySelector={(item) => item.ID}
                                Ascending={true}
                                TableClass="table"
                                TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                                TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                                RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            >
                                <Column<IMappedChannel>
                                    Key={'Channel'}
                                    AllowSort={false}
                                    Field={'Channel'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                > Channel
                                </Column>
                                <Column<IMappedChannel>
                                    Key={'Mapping'}
                                    AllowSort={false}
                                    Field={'Mapping'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                > Mapping
                                </Column>
                            </Table>
                    }
                </div>
            </div>
        );
    }
}

const getFileName = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/FileInfo/GetFileName/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

const getMappedChannels = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/FileInfo/GetMappedChannels/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

const getMeterConfiguration = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/FileInfo/GetMeterConfiguration/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

export default EventSearchFileInfo;