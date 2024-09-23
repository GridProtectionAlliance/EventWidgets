//******************************************************************************************************
//  EventSearchNoteWindow.tsx - Gbtc
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
import { EventWidget } from '../global';
import { ReactTable } from '@gpa-gemstone/react-table';


interface IMatlabAnalytics {
    TagName: string,
    TagDescription: string,
    EventID: number,
    TagData: string,
    EventTagID: number,
    ShowInFilter: number
}

const MatlabAnalyticResults: EventWidget.IWidget<{}> = {
    Name: 'MatlabAnalyticResults',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IMatlabAnalytics[]>([]);

        React.useEffect(() => {
            const handle = getMatlabAnalytcis();
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID])


        function getMatlabAnalytcis(): JQuery.jqXHR<IMatlabAnalytics[]> {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/MatlabAnalytics/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });
            handle.done((data: IMatlabAnalytics[]) => {
                setData(data);
            });
            return handle;
        }

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>Matlab Analytic Results</div>
                <div className="card-body">
                    <ReactTable.Table<IMatlabAnalytics>
                        Data={data}
                        KeySelector={item => item.EventTagID}
                        OnSort={() => {/*Do Nothing*/ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    >
                        <ReactTable.Column<IMatlabAnalytics>
                            Key={'TagName'}
                            AllowSort={false}
                            Field={'TagName'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Tag Name
                        </ReactTable.Column>
                    </ReactTable.Table>
                </div>
            </div>
        );
    }
}

export default MatlabAnalyticResults;