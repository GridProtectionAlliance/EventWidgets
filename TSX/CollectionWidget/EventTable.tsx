//******************************************************************************************************
//  EventTable.tsx - Gbtc
//
//  Copyright � 2023, Grid Protection Alliance.  All Rights Reserved.
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
//  10/23/2025 - G. Santos
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import moment from 'moment';
import { EventWidget } from '../global';
import { Application, OpenXDA } from '@gpa-gemstone/application-typings';
import { Column, Paging, Table } from '@gpa-gemstone/react-table';
import { GenericController, LoadingIcon, Search } from '@gpa-gemstone/react-interactive';

interface IPageInfo {
    RecordsPerPage: number,
    NumberOfPages: number,
    TotalRecords: number
}

interface ISearchState {
    SortKey: keyof OpenXDA.Types.EventSearch,
    Ascending: boolean,
    Page: number
}

const EventTable: EventWidget.ICollectionWidget<{}> = {
    Name: 'EventTable',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<{}>) => {
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [pageInfo, setPageInfo] = React.useState<IPageInfo>({ RecordsPerPage: 0, NumberOfPages: 0, TotalRecords: 0 });
        const [searchState, setSearchState] = React.useState<ISearchState>({ SortKey: 'StartTime', Ascending: true, Page: 0 });
        const [events, setEvents] = React.useState<OpenXDA.Types.EventSearch[]>([]);

        const EventController = React.useMemo(() => new GenericController<OpenXDA.Types.EventSearch>(
            `${props.HomePath}api/EventWidgets/Event`, "StartTime", true
        ), [props.HomePath]);


        React.useEffect(() => {
            setStatus('loading');
            const handle: JQuery.jqXHR = EventController
                .PagedSearch(TransformFilter(props.CurrentFilter), searchState.SortKey, searchState.Ascending, searchState.Page)
                .done((result) => {
                    setEvents(JSON.parse(result.Data as unknown as string));
                    setPageInfo({
                        RecordsPerPage: result.RecordsPerPage,
                        NumberOfPages: result.NumberOfPages,
                        TotalRecords: result.TotalRecords
                    });
                    setStatus('idle');
                }).fail(() => {
                    setStatus('error');
                });

            return () => {
                if (handle != null && handle?.abort != null)
                    handle.abort();
            }
        }, [searchState, props.CurrentFilter]);

        return (
            <div className="card h-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ?
                        'Displaying Events(s) ' +
                        (pageInfo.TotalRecords > 0 ?
                            (pageInfo.RecordsPerPage * searchState.Page + 1) : 0) +
                        ' - ' +
                        (pageInfo.RecordsPerPage * searchState.Page + events.length) + 
                        ' out of ' + pageInfo.TotalRecords
                        : props.Title
                    }
                    <button className="btn btn-primary" style={{ position: 'absolute', top: 5, right: 5 }} onClick={() => ExportToCsv(events, 'EventSearch.csv')}>Export CSV</button>
                </div>
                <div className="card-body p-0" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <LoadingIcon Show={status !== 'idle'} />
                    <Table<OpenXDA.Types.EventSearch>
                        Data={events}
                        SortKey={searchState.SortKey}
                        Ascending={searchState.Ascending}
                        OnSort={(d) => {
                            if (d.colField == searchState.SortKey) {
                                setSearchState({
                                    ...searchState,
                                    Ascending: !searchState.Ascending
                                });
                            }
                            else {
                                setSearchState({
                                    ...searchState,
                                    SortKey: d.colField,
                                    Ascending: searchState.Ascending
                                });
                            }
                        }}
                        OnClick={data => { if (props.Callback != null) props.Callback(data.row.ID); }}
                        Selected={item => props.EventID === item.ID}
                        KeySelector={item => item.ID}
                    >
                        <Column<OpenXDA.Types.EventSearch>
                            Key="StartTime"
                            Field="StartTime"
                            HeaderStyle={{ width: '25%' }}
                            RowStyle={{ width: '25%' }}
                            Content={row => row.item[row.key] != undefined ? moment.utc(row.item[row.key]).format('YYYY-MM-DD') : ''}
                        >Date</Column>
                        <Column<OpenXDA.Types.EventSearch>
                            Key="MeterName"
                            Field="MeterName"
                        >Meter</Column>
                        <Column<OpenXDA.Types.EventSearch>
                            Key="EventType"
                            Field="EventType"
                            HeaderStyle={{ width: '12%' }}
                            RowStyle={{ width: '12%' }}
                        >Type</Column>
                        <Column<OpenXDA.Types.EventSearch>
                            Key="Phase"
                            Field="Phase"
                            HeaderStyle={{ width: '12%' }}
                            RowStyle={{ width: '12%' }}
                        >Phase</Column>
                        <Column<OpenXDA.Types.EventSearch>
                            Key="PerUnitMagnitude"
                            Field="PerUnitMagnitude"
                            HeaderStyle={{ width: '12%' }}
                            RowStyle={{ width: '12%' }}
                            Content={row => row.item[row.key] != undefined ? (row.item[row.key] as number).toFixed(2) : ''}
                        >Mag (pu)</Column>
                        <Column<OpenXDA.Types.EventSearch>
                            Key="DurationSeconds"
                            Field="DurationSeconds"
                            HeaderStyle={{ width: '12%' }}
                            RowStyle={{ width: '12%' }}
                            Content={row => row.item[row.key] != undefined ? (row.item[row.key] as number).toFixed(2) : ''}
                        >Dur (s)</Column>
                    </Table>
                    <div className="row justify-content-center">
                        <Paging Current={searchState.Page + 1} Total={pageInfo.NumberOfPages} SetPage={(p) => setSearchState({ ...searchState, Page: (p - 1) })} />
                    </div>
                </div>
            </div>
        );
    }
}

// ToDo: Move this to mestone, not possible atm due to jQuery dep.
// Note: This is from PQDigest, ExportCSV.tsx
function ExportToCsv<T>(data: T[], filename: string) {
    if (data.length < 1) return;

    var rows = [Object.keys(data[0])];
    $.each(data, function (index, value) {
        rows.push(Object.keys(value).map(function (key) { return value[key] }));
    });

    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|,|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ',';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator?.['msSaveBlob'] != null) { // IE 10+
        navigator['msSaveBlob'](blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

function TransformFilter(filt: EventWidget.ICollectionFilter): Search.IFilter<OpenXDA.Types.EventSearch>[] {
    const newFilt: Search.IFilter<OpenXDA.Types.EventSearch>[] = [];
    if (filt?.TimeFilter != null)
        newFilt.push({
            FieldName: 'StartTime',
            SearchText: filt.TimeFilter.StartTime,
            Operator: '>=',
            Type: 'datetime',
            IsPivotColumn: false
        }, {
            FieldName: 'StartTime',
            SearchText: filt.TimeFilter.EndTime,
            Operator: '<=',
            Type: 'datetime',
            IsPivotColumn: false
        });

    if (filt?.MeterFilter != null)
        newFilt.push({
            FieldName: 'MeterID',
            SearchText: `(${filt.MeterFilter.map(meter => meter.ID).join(',')})`,
            Operator: 'IN',
            Type: 'number',
            IsPivotColumn: false
        });

    if (filt?.TypeFilter != null)
        newFilt.push({
            FieldName: 'EventTypeID',
            SearchText: `(${filt.TypeFilter.map(type => type.ID).join(',')})`,
            Operator: 'IN',
            Type: 'number',
            IsPivotColumn: false
        });

    return newFilt;
}

export default EventTable;