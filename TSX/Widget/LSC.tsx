//******************************************************************************************************
//  LSC.tsx - Gbtc
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
//  03/24/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import Table from '@gpa-gemstone/react-table';
import { EventWidget } from '../global';
import { Input } from '@gpa-gemstone/react-forms';

interface ILSC {
    Facility: string,
    Area: string,
    SectionTitle: string,
    ComponentModel: string,
    ManufacturerName: string,
    SeriesName: string,
    ComponentTypeName: string,
    Magnitude: number,
    Duration: number,
    EventID: number
}

const LSC: EventWidget.IWidget<EventWidget.ISetting> = {
    Name: 'TVASLC', //This is whats getting returned from api should be TVALSC once api gets fix
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
        const [lscInfo, setLSCInfo] = React.useState<ILSC[]>([]);
        React.useEffect(() => {
            return GetData();
        }, [props.EventID]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/LSC/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done(data => {
                setLSCInfo(data);
            });

            return function () {
                if (handle.abort != undefined) handle.abort();
            }
        }

        return (
            <div className="card">
                <div className="card-header">Impacted LSCs:</div>
                <div className="card-body">
                    <Table
                        cols={[
                            { key: 'Facility', field: 'Facility', label: 'Facility', content: (d: ILSC) => <a target="_blank" href={openSEEInstance + '?eventid=' + d.EventID}>{d.Facility}</a> },
                            { key: 'Area', field: 'Area', label: 'Area' },
                            { key: 'SectionTitle', field: 'SectionTitle', label: 'Section' },
                            { key: 'ComponentModel', field: 'ComponentModel', label: 'Component' },
                            { key: 'Magnitude', field: 'Magnitude', label: 'Magnitude' },
                            { key: 'Duration', field: 'Duration', label: 'Duration' }
                        ]}
                        data={lscInfo}
                        onClick={() => { /* Do Nothing */ }}
                        onSort={() => { /* Do Nothing */ }}
                        sortKey={''}
                        ascending={true}
                        tableClass="table"
                        theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        tbodyStyle={{ display: 'table', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default LSC;