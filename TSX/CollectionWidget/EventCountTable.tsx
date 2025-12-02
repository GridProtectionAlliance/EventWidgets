//******************************************************************************************************
//  EventCountTable.tsx - Gbtc
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
//  11/16/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

import { Application } from '@gpa-gemstone/application-typings';
import { LoadingIcon, ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import { Column, Table } from '@gpa-gemstone/react-table';
import _ from 'lodash';
import * as React from 'react';
import { EventWidget } from '../global';

type MeterCount = {
    ID: number,
    Name: string
} & {
    [key: string]: number
}

const EventCountTable: EventWidget.ICollectionWidget<{}> = {
    Name: 'EventCountTable',
    DefaultSettings: {},
    Settings: (_props: EventWidget.IWidgetSettingsProps<{}>) => {
        return (<></>);
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<{}>) => {
        const [data, setData] = React.useState<MeterCount[]>([]);
        const [colKeys, setColKeys] = React.useState<string[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [ascending, setAscending] = React.useState<boolean>(true);
        const [sortField, setSortField] = React.useState<string>("Name");

        React.useEffect(() => {
            if (props.CurrentFilter.TimeFilter == null)
                return;

            setStatus('loading');
            const handle = $.ajax({
                type: "POST",
                url: `${homePath}api/EventWidgets/Event/EventCount`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    MeterIDs: props.CurrentFilter?.MeterFilter?.map(meter => meter.ID) ?? [],
                    StartTime: props.CurrentFilter.TimeFilter.StartTime,
                    EndTime: props.CurrentFilter.TimeFilter.EndTime
                }),
                dataType: 'json',
                cache: true,
                async: true
            });
            
            handle.done((data: Array<MeterCount>) => {
                setData(data);
                // We are only going to display keys with data for some meter
                setColKeys(
                    Object.keys(data?.[0] ?? {})
                        .filter(key => key !== "ID" && key !== "Name")
                        .filter(key => data.reduce((sum, val) => sum + val[key], 0) > 0)
                );
                setStatus('idle');
            }).fail(() => {
                setStatus('error');
            });

            return () => {
                if (handle != null && handle?.abort != null)
                    handle.abort();
            }
        }, []);

        if (status == 'error')
            return (
                <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                    <div className="card-header">
                        Meter Activity - Error
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }}>
                        <ServerErrorIcon
                            Show={true}
                            Label={"Unable to complete search. Please contact your system administrator."}
                            Size={150}
                        />
                    </div>
                </div>
            );


        return (
            <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ? "Meter Activity" : props.Title}
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }}>
                    <LoadingIcon Show={status !== 'idle'} />
                    <Table<MeterCount>
                        Data={data}
                        SortKey={sortField}
                        Ascending={ascending}
                        OnSort={(d) => {
                            if (d.colKey == sortField) {
                                const ordered = _.orderBy(data, [sortField], [(!ascending ? 'asc' : 'desc')]);
                                setData(ordered);
                                setAscending(!ascending);
                            }
                            else {
                                const ordered = _.orderBy(data, [d.colKey], [(ascending ? 'asc' : 'desc')]);
                                setData(ordered);
                                setAscending(ascending);
                                setSortField(d.colKey);
                            }
                        }}
                        KeySelector={item => item.ID}
                    >
                        <Column<MeterCount>
                            Key="Name"
                            Field="Name"
                            HeaderStyle={{ width: "20%" }}
                            RowStyle={{ width: "20%" }}
                        >Meter</Column>
                        <Column<MeterCount>
                            Key="Total"
                            Field="Total"
                            AllowSort={false}
                            Content={row => colKeys
                                .map(key => row.item[key])
                                .reduce((sum,value) => sum+value, 0)
                            }
                        >Total</Column>
                        {colKeys.map(key =>
                            <Column<MeterCount>
                                Key={key}
                                key={key}
                                Field={key}
                            >
                                {key.length > 5 ? key.slice(0, 5) + '.' : key}
                            </Column>
                        )}
                    </Table>
                </div>
            </div>
        )
    }
}

export default EventCountTable;