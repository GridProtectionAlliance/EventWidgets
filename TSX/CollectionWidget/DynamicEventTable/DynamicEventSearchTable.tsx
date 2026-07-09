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
    OnSort: (colKey: string) => void,
    LocalStorageKey?: string,
    SettingsPortal?: string,
    OnSettingsChange?: (open: boolean) => void
}

export function DynamicEventSearchList(props: IDynamicEventSearchListProps) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const cols = React.useMemo<IColumn[]>(() => {
        if (props.Data.length == 0)
            return [];

        return Object.keys(props.Data[0])
            .filter(item => item != "Time" && item != "DisturbanceID" && item != "EventID" && item != "EventID1" && item != 'MagDurDuration' && item != 'MagDurMagnitude')
            .sort()
            .map(item => ({ field: item, key: item, label: item }));
    }, [props.Data]);

    const setScrollBar = React.useCallback(() => {
        if (containerRef.current == null) return;

        const rowHeight = $(containerRef.current).find('tbody').children()[0].clientHeight;
        const index = props.Data.map(a => a.EventID.toString()).indexOf(props.Eventid.toString());
        const tableHeight = props.Data.length * rowHeight;
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
    }, [props.Data, props.Eventid])

    const handleKeyPress = React.useCallback((event: KeyboardEvent) => {
        if (props.Data.length == 0) return;

        const index = props.Data.map(a => a.EventID.toString()).indexOf(props.Eventid.toString());

        if (event.keyCode == 40) // arrow down key
        {
            event.preventDefault();

            if (props.Eventid == -1 || index < 0)
                props.SelectEvent(props.Data[0].EventID, props.Data[0]);
            else if (index == props.Data.length - 1)
                props.SelectEvent(props.Data[0].EventID, props.Data[0]);
            else
                props.SelectEvent(props.Data[index + 1].EventID, props.Data[index + 1]);

        }
        else if (event.keyCode == 38)  // arrow up key
        {
            event.preventDefault();

            if (props.Eventid == -1 || index < 0)
                props.SelectEvent(props.Data[props.Data.length - 1].EventID, props.Data[props.Data.length - 1]);
            else if (index == 0)
                props.SelectEvent(props.Data[props.Data.length - 1].EventID, props.Data[props.Data.length - 1]);
            else
                props.SelectEvent(props.Data[index - 1].EventID, props.Data[index - 1]);
        }

        setScrollBar();
    }, [props.Data, props.Eventid, setScrollBar, props.SelectEvent])

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
                width: '100%', maxHeight: props.Height, overflowY: "hidden", overflowX: "hidden", opacity: (props.Status == 'loading' ? 0.5 : undefined),
                backgroundColor: (props.Status == 'loading' ? '#00000' : undefined)
            }}>
                {props.Status == 'loading' ? <div style={{ height: '40px', width: '40px', margin: 'auto' }}>
                    <LoadingIcon Show={true} Size={40} />
                </div> : null}
                {cols.length > 0 ?
                    <ConfigurableTable<any>
                        LocalStorageKey={props.LocalStorageKey ?? "SEbrowser.EventSearch.TableCols"}
                        TableClass="table table-hover"
                        Data={props.Data}
                        SortKey={props.SortField}
                        Ascending={props.Ascending}
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 60 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.Height - 60 }}
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
            </div>
        </>
    );
}
