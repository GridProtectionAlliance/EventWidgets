//******************************************************************************************************
//  DynamicEventSearchTable.tsx - Gbtc
//
//  Copyright (c) 2026, Grid Protection Alliance.  All Rights Reserved.
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
//******************************************************************************************************

import * as React from 'react';
import { LoadingIcon } from '@gpa-gemstone/react-interactive';
import { Column, ConfigurableTable, ConfigurableColumn } from '@gpa-gemstone/react-table';
import { useGetContainerPosition } from '@gpa-gemstone/helper-functions';
import { Application } from '@gpa-gemstone/application-typings';
import { DynamicEventSearchRow } from './DynamicEventSearchData';

interface IColumn {
    key: string,
    label: string,
    field: keyof any,
}

export interface IDynamicEventSearchListProps {
    Eventid: number,
    SelectEvent: (id: number, row?: DynamicEventSearchRow) => void,
    Height: number,
    Data: DynamicEventSearchRow[],
    Status: Application.Types.Status,
    SortField: string,
    Ascending: boolean,
    NumberResults: number,
    OnSort: (colKey: string) => void,
    LocalStorageKey?: string,
    SettingsPortal?: string,
    OnSettingsChange?: (open: boolean) => void
}

export function DynamicEventSearchList(props: IDynamicEventSearchListProps) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const countRef = React.useRef<HTMLDivElement | null>(null);
    const { offsetHeight: countHeight } = useGetContainerPosition(countRef);
    const [cols, setCols] = React.useState<IColumn[]>([]);

    const data = props.Data;
    const status = props.Status;

    React.useEffect(() => {
        if (data.length == 0)
            return;

        const flds = Object.keys(data[0]).filter(item => item != "Time" && item != "DisturbanceID" && item != "EventID" && item != "EventID1" && item != 'MagDurDuration' && item != 'MagDurMagnitude').sort();

        if (flds.length != cols.length)
            setCols(flds.map(item => ({
                field: item, key: item, label: item
            })))

    }, [data])

    const setScrollBar = React.useCallback(() => {
        if (containerRef.current == null) return;

        const rowHeight = $(containerRef.current).find('tbody').children()[0].clientHeight;
        const index = data.map(a => a.EventID.toString()).indexOf(props.Eventid.toString());
        const tableHeight = data.length * rowHeight;
        const windowHeight = window.innerHeight - 314;
        const tableSectionCount = Math.ceil(tableHeight / windowHeight);
        const tableSectionHeight = Math.ceil(tableHeight / tableSectionCount);
        const rowsPerSection = tableSectionHeight / rowHeight;
        const sectionIndex = Math.floor(index / rowsPerSection);
        const scrollTop = $(containerRef.current).find('tbody').scrollTop();

        if (scrollTop == null)
            return;

        if (scrollTop <= sectionIndex * tableSectionHeight || scrollTop >= (sectionIndex + 1) * tableSectionHeight - tableSectionHeight / 2)
            $(containerRef.current).find('tbody').scrollTop(sectionIndex * tableSectionHeight);
    }, [data, props.Eventid])

    const handleKeyPress = React.useCallback((event: KeyboardEvent) => {
        if (data.length == 0) return;

        const index = data.map(a => a.EventID.toString()).indexOf(props.Eventid.toString());

        if (event.keyCode == 40) // arrow down key
        {
            event.preventDefault();

            if (props.Eventid == -1 || index < 0)
                props.SelectEvent(data[0].EventID, data[0]);
            else if (index == data.length - 1)
                props.SelectEvent(data[0].EventID, data[0]);
            else
                props.SelectEvent(data[index + 1].EventID, data[index + 1]);

        }
        else if (event.keyCode == 38)  // arrow up key
        {
            event.preventDefault();

            if (props.Eventid == -1 || index < 0)
                props.SelectEvent(data[data.length - 1].EventID, data[data.length - 1]);
            else if (index == 0)
                props.SelectEvent(data[data.length - 1].EventID, data[data.length - 1]);
            else
                props.SelectEvent(data[index - 1].EventID, data[index - 1]);
        }

        setScrollBar();
    }, [data, props.Eventid, setScrollBar, props.SelectEvent])

    //Effect to handle key press events
    React.useEffect(() => {
        document.addEventListener("keydown", handleKeyPress, false);
        return () => {
            document.removeEventListener("keydown", handleKeyPress, false);
        }
    }, [handleKeyPress])

    function ProcessWhitespace(txt: string | number): React.ReactNode {
        if (txt == null)
            return <>N/A</>

        const lines = txt.toString().split("<br>");
        return lines.map((item, index) => {
            if (index == 0)
                return <> {item} </>

            return <> <br /> {item} </>
        })
    }
    return (
        <>
            <div ref={containerRef} style={{
                width: '100%', maxHeight: props.Height, overflowY: "hidden", overflowX: "hidden", opacity: (status == 'loading' ? 0.5 : undefined),
                backgroundColor: (status == 'loading' ? '#00000' : undefined)
            }}>
                {status == 'loading' ? <div style={{ height: '40px', width: '40px', margin: 'auto' }}>
                    <LoadingIcon Show={true} Size={40} />
                </div> : null}
                {cols.length > 0 ?
                    <ConfigurableTable<any>
                        LocalStorageKey={props.LocalStorageKey ?? "SEbrowser.EventSearch.TableCols"}
                        TableClass="table table-hover"
                        Data={data}
                        SortKey={props.SortField}
                        Ascending={props.Ascending}
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 60 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.Height - countHeight - 60 }}
                        RowStyle={{ display: 'table', tableLayout: 'fixed', width: 'calc(100%)' }}
                        TableStyle={{ marginBottom: 0 }}
                        Selected={(item) => {
                            if (item.EventID == props.Eventid) return true;
                            else return false;
                        }}
                        KeySelector={(item) => (item.EventID.toString() + '-' + item.DisturbanceID)}
                        OnSort={(d) => {
                            props.OnSort(d.colKey);
                        }}
                        OnClick={(item) => props.SelectEvent(item.row.EventID, item.row)}
                        SettingsPortal={props.SettingsPortal}
                        OnSettingsChange={props.OnSettingsChange}
                    >
                        <Column<any>
                            Key={'Time'}
                            AllowSort={true}
                            Content={({ item, field }) => ProcessWhitespace(item[field as string])}
                            Field={'Time'}
                        >
                            Time
                        </Column>
                        {...cols.map(c => (
                            <ConfigurableColumn Key={c.label} Label={c.label} Default={c.key === 'Event Type'}>
                                <Column<any>
                                    Key={c.key}
                                    AllowSort={true}
                                    Field={c.label}
                                    Content={({ item, field }) => ProcessWhitespace(item[field as string])}
                                >
                                    {c.label}
                                </Column>
                            </ConfigurableColumn>
                        ))}
                    </ConfigurableTable> : null}
                {status == 'loading' ? null :
                    data.length == props.NumberResults ?
                        <div style={{ padding: 10, backgroundColor: '#458EFF', color: 'white' }} ref={countRef}>
                            Only the first {data.length} results are shown (sorted {(props.Ascending ? 'ascending' : 'descending')} by {props.SortField}) - please narrow your search or increase the number of results in the application settings.
                        </div> :
                        <div style={{ padding: 10, backgroundColor: '#458EFF', color: 'white' }} ref={countRef}>
                            {data.length} results
                        </div>}
            </div>
        </>
    );
}
