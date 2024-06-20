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
import { ReactTable } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';

interface ISetting { SystemCenterUrl: string }

const EventSearchFileInfo: EventWidget.IWidget<ISetting> = {
    Name: 'FileInfo',
    DefaultSettings: { SystemCenterUrl: 'https://systemCenter.demo.gridprotectionalliance.org' },
    Settings: (props) => {
        return <div className="row">
            < div className="col" >
                <Input<ISetting>
                    Record={props.Settings}
                    Field={'SystemCenterUrl'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'SystemCenter URL'} />
            </div >
        </div >
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [fileName, setFileName] = React.useState<string>('');
        const [mappedChannels, setMappedChannels] = React.useState<Array<{ Channel: string, Mapping: string }>>([]);
        const [meterKey, setMeterKey] = React.useState<string>('');
        const [meterConfigurationID, setMeterConfigurationID] = React.useState<number>(0);

        React.useEffect(() => {
            return GetData();
        }, [props.EventID]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FileInfo/GetFileName/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            })

            handle.done(data => setFileName(data));

            const handle2 = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FileInfo/GetMappedChannels/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            })

            handle2.done(data => setMappedChannels(data));

            const handle3 = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FileInfo/GetMeterConfiguration/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            })

            handle3.done(data => {
                setMeterKey(data[0])
                setMeterConfigurationID(data[1]);
            });


            return function () {
                if (handle.abort != undefined) handle.abort();
                if (handle2.abort != undefined) handle2.abort();
                if (handle3.abort != undefined) handle3.abort();

            }
        }

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    File Info:
                    <a className="pull-right" target="_blank" href={props.Settings.SystemCenterUrl + `?name=ConfigurationHistory&MeterKey=${meterKey}&MeterConfigurationID=${meterConfigurationID}`}>Meter Configuration Via System Center</a>
                </div>

                <div className="card-body">
                    <p>{fileName}</p>
                    <ReactTable.Table
                        Data={mappedChannels}
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        KeySelector={() => { return 1 } }
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default EventSearchFileInfo;

