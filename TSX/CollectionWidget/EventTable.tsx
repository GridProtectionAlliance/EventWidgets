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
import { OpenXDA } from '@gpa-gemstone/application-typings';
import { Column, Paging, Table } from '@gpa-gemstone/react-table';

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

const EventTable: EventWidget.ICollectionWidget<{}> = {
    Name: 'EventTable', 
    IsPaged: true,
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<{}>) => {
        return (
            <div className="card h-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {'Displaying Events(s) ' +
                        (props.SearchInformation.TotalRecords > 0 ?
                            (props.SearchInformation.RecordsPerPage * props.SearchState.Page + 1) : 0) +
                        ' - ' +
                        (props.SearchInformation.RecordsPerPage * props.SearchState.Page + props.Events.length) + 
                        ' out of ' + props.SearchInformation.TotalRecords}
                    <button className="btn btn-primary" style={{ position: 'absolute', top: 5, right: 5 }} onClick={() => ExportToCsv(props.Events, 'EventSearch.csv')}>Export CSV</button>
                </div>
                <div className="card-body p-0" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Table<OpenXDA.Types.EventSearch>
                        Data={props.Events}
                        SortKey={props.SearchState.SortKey}
                        Ascending={props.SearchState.Ascending}
                        OnSort={(d) => {
                            if (d.colField == props.SearchState.SortKey) {
                                props.SetSearchState({
                                    ...props.SearchState,
                                    Ascending: !props.SearchState.Ascending
                                });
                            }
                            else {
                                props.SetSearchState({
                                    ...props.SearchState,
                                    SortKey: d.colField,
                                    Ascending: props.SearchState.Ascending
                                });
                            }
                        }}
                        OnClick={data => props.EventCallBack([data.row])}
                        Selected={item => props.SelectedEvents.has(item.ID)}
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
                        <Paging Current={props.SearchState.Page + 1} Total={props.SearchInformation.NumberOfPages} SetPage={(p) => props.SetSearchState({ ...props.SearchState, Page: (p - 1) })} />
                    </div>
                </div>
            </div>
        );
    }
}

export default EventTable;