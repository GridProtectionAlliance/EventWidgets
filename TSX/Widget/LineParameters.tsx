﻿//******************************************************************************************************
//  LineParameters.tsx - Gbtc
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
//  03/18/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import Table from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';
import { EventWidget } from '../global';

interface ILineParameters {
    ID?: number,
    Length?: number,
    X0?: number,
    X1?: number,
    R1?: number,
    R0?: number
}

interface ILoopImpedance {
    Length: number,
    ZS: string,
    Ang: string,
    RS: string,
    XS: string,
    PerMileZS: string,
    PerMileRS: string,
    PerMileXS: string
}

const LineParameters: EventWidget.IWidget<EventWidget.ISetting> = {

    Name: 'LineParameters',
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
        const [hidden, setHidden] = React.useState<boolean>(true);
        const [lineParameters, setLineParameters] = React.useState<ILineParameters>(null);
        const [loopParameters, setLoopParemeters] = React.useState<ILoopImpedance>(null);


        React.useEffect(() => {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}/LineParameter/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done(data => {
                if (data.length > 0) {
                    setHidden(false);
                }
                setLineParameters(data[0]);
            });

            return () => { if (handle.abort != undefined) handle.abort(); }

        }, [props.EventID]);

        React.useEffect(() => {
            if (lineParameters == null)
                return;

            const rs = (lineParameters.R1 * 2 + lineParameters.R0) / 3;
            const rsm = rs / lineParameters.Length;
            const xs = (lineParameters.X1 * 2 + lineParameters.X0) / 3;
            const xsm = xs / lineParameters.Length;
            const zs = Math.sqrt(rs ^ 2 + xs ^ 2);
            const zsm = zs / lineParameters.Length;
            const angS = Math.atan(xs / rs) * 180 / Math.PI;

            setLoopParemeters({
                Length: lineParameters.Length,
                ZS: zs.toFixed(3),
                Ang: angS.toFixed(3),
                RS: rs.toFixed(4),
                XS: xs.toFixed(4),
                PerMileZS: zsm.toFixed(3),
                PerMileRS: rsm.toFixed(4),
                PerMileXS: xsm.toFixed(4)
            })    

        }, [lineParameters])

        if (lineParameters == null || hidden) return null;

        return (
            <div className="card">
                <div className="card-header">Line Parameters:
                    <a className="pull-right" target="_blank"
                        href={`${props.Settings.SystemCenterURL}?name=Asset&AssetID=${lineParameters.ID}`}
                    >Line Configuration Via System Center</a>
                </div>
                <div className="card-body">
                    <Table<ILoopImpedance>
                        cols={[
                            { key: 'Length', field: 'Length', label: 'Length (mi)' },
                            { key: 'ZS', field: 'ZS', label: 'ZS (Ohm)' },
                            { key: 'Ang', field: 'Ang', label: 'Ang (Deg)' },
                            { key: 'RS', field: 'RS', label: 'RS (Ohm)' },
                            { key: 'XS', field: 'XS', label: 'XS (Ohm)' },
                            { key: 'PerMileZS', field: 'PerMileZS', label: 'Per Mile ZS' },
                            { key: 'PerMileRS', field: 'PerMileRS', label: 'Per Mile RS' },
                            { key: 'PerMileXS', field: 'PerMileXS', label: 'Per Mile XS' }
                        ]}
                        data={[loopParameters]}
                        onClick={() => { /* Do Nothing */ }}
                        onSort={() => { /* Do Nothing */ }}
                        sortKey={''}
                        ascending={true}
                        tableClass="table"
                        theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        tbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.MaxHeight - 60, width: '100%' }}
                        rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default LineParameters;