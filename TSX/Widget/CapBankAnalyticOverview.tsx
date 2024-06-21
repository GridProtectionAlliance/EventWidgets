//******************************************************************************************************
//  EventSearchCapBankAnalyticOverview.tsx - Gbtc
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
//  08/22/2019 - Christoph Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { ReactTable } from '@gpa-gemstone/react-table';

interface ICapBankAnalytic {
    ID: number,
    Phase: string,
    Status: string,
    Operation: string,
    Resonance: boolean,
    CapBankHealth: string,
    PreInsertionSwitch: string,
    Restrike: string
}

const EventSearchCapBankAnalyticOverview: EventWidget.IWidget<{}> = {
    Name: 'CapBankAnalyticOverview',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<ICapBankAnalytic[]>([]);

        let capBankAnalyticHandle;
        function getCapBankAnalytics() {
            if (capBankAnalyticHandle !== undefined) {
                capBankAnalyticHandle.abort();
            }

                capBankAnalyticHandle = $.ajax({
                    type: "GET",
                    url: `${props.HomePath}api/OpenXDA/getCapBankAnalytic?eventId=${props.EventID}`,
                    contentType: "application/json; charset=utf-8",
                    dataType: 'json',
                    cache: true,
                    async: true
                })
            return capBankAnalyticHandle;
        }

        React.useEffect(() => {
            const handle = getCapBankAnalytics();
            handle.done((data) => {
                setData(data);
            });
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID]);


        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    EPRI Capacitor Bank Analytic:
                </div>
                <div className="card-body">
                    <ReactTable.Table
                        Data={data}
                        KeySelector={item => item.ID}
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default EventSearchCapBankAnalyticOverview;