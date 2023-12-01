﻿//******************************************************************************************************
//  EventSearchAssetFaultSegments.tsx - Gbtc
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
import Table from '@gpa-gemstone/react-table';

interface IFaultSegment {
    SegmentType: string;
    StartTime: string;
    EndTime: string;
}

const EventSearchAssetFaultSegments: EventWidget.IWidget<{}> = {
    Name: 'EventSearchFaultSegments',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IFaultSegment[]>([]);
        const [count, setCount] = React.useState<number>(0);
        const [handle, setHandle] = React.useState<JQuery.jqXHR>();

        let assetFaultHandle;

        function getAssetFaultData() {
            if (assetFaultHandle !== undefined)
                assetFaultHandle.abort()

            assetFaultHandle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/AssetFaultSegment?EventID=${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            })
            return assetFaultHandle;
        }


        React.useEffect(() => {
            if (props.EventID >= 0) {
                const handle = getAssetFaultData()
                handle.done((data) => {
                    setData(data);
                    setCount(data.length);
                })
                setHandle(handle);
            }
            return () => {
                if (handle?.abort != undefined) {
                    handle.abort();
                }
            };
        }, [props.EventID]);


        return (
            <div className="card" style={{ display: count > 0 ? 'block' : 'none' }}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>Fault Evolution Summary:</div>
                <div className="card-body">
                    <Table<IFaultSegment>
                        cols={[
                            { key: 'SegmentType', field: 'SegmentType', label: 'Evolution' },
                            { key: 'StartTime', field: 'StartTime', label: 'Inception', content: (record) => moment(record.StartTime).format('HH:mm:ss.SSS') },
                            { key: 'EndTime', field: 'EndTime', label: 'End', content: (record) => moment(record.EndTime).format('HH:mm:ss.SSS') },
                            { key: 'Duration', field: 'StartTime', label: 'Duration (c)', content: (record) => ((moment(record.EndTime).diff(moment(record.StartTime)) / 16.66667).toFixed(1)) }
                        ]}
                        data={data}
                        onClick={() => { /* Do Nothing */ }}
                        onSort={() => { /* Do Nothing */ }}
                        sortKey={''}
                        ascending={true}
                        tableClass="table"
                        theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        tbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    />
                </div>
            </div>
        );
    }
}

export default EventSearchAssetFaultSegments;