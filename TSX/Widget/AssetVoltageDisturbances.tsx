//******************************************************************************************************
//  EventSearchAssetVoltageDisturbances.tsx - Gbtc
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
import * as React from 'react';
import moment from 'moment';
import { Table, Column } from '@gpa-gemstone/react-table';
import { EventWidget } from '../global';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

interface IDisturbanceData {
    ID: number;
    EventType: string;
    Phase: string;
    PerUnitMagnitude: number;
    DurationSeconds: number;
    StartTime: string;
    SeverityCode: string;
    IsWorstDisturbance: boolean;
    GroupNumber?: number;
    GroupColor?: string;
    IsFirstGroupRow?: boolean;
    IsLastGroupRow?: boolean;
}

const GROUP_COLORS = ['var(--blue)', 'var(--orange)', 'var(--green)', 'var(--purple)', 'var(--red)', 'var(--teal)', 'var(--pink)', 'var(--indigo)'];

/** Displays voltage disturbances for the selected event. */
const AssetVoltageDisturbances: EventWidget.IWidget<{}> = {
    Name: 'VoltageDisturbances',
    DefaultSettings: {},
    Settings: () => <></>,
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<IDisturbanceData[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const groupedData = React.useMemo(() => groupDisturbances(data), [data]);

        // Load voltage disturbances whenever the selected event or application path changes.
        React.useEffect(() => {
            setStatus('loading');
            const handle = getDisturbanceData(props.HomePath, props.EventID);
            handle.done((data) => {
                setStatus('idle')
                setData(data);
            }).fail(() => setStatus('error'));
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card">
                {/* the card/collapsible card in EE needs to be moved to gemstone and used across SEbrowser */}
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Voltage Disturbance in Waveform:</div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching voltage disturbance data.
                        </Alert>
                        : null}
                    {status === 'loading' ?

                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : data.length === 0 ?
                            <Alert Class='alert-info'>
                                No voltage disturbance data.
                            </Alert>
                            :
                            <Table<IDisturbanceData>
                                Data={groupedData}
                                KeySelector={(item) => item.ID}
                                OnSort={() => {/*Do Nothing*/ }}
                                SortKey={''}
                                Ascending={true}
                                TableClass='table'
                                TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                                TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                                RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            >
                                <Column<IDisturbanceData>
                                    Key='GroupStatus'
                                    AllowSort={false}
                                    HeaderStyle={{ width: 180 }}
                                    RowStyle={{ width: 180 }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style, 'left');
                                        return <>
                                            {item.GroupNumber != null ?
                                                <span
                                                    className='badge mr-1'
                                                    style={{ backgroundColor: item.GroupColor, color: 'white' }}
                                                >
                                                    {item.EventType} Group {item.GroupNumber}
                                                </span>
                                                : null}
                                            {item.IsWorstDisturbance ?
                                                <span className='badge badge-warning'>Worst</span>
                                                : null}
                                        </>;
                                    }}
                                >
                                    Group / Status
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='EventType'
                                    AllowSort={false}
                                    Field='EventType'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style);
                                        return item.EventType;
                                    }}
                                >
                                    Disturbance Type
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='Phase'
                                    AllowSort={false}
                                    Field='Phase'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style);
                                        return item.Phase;
                                    }}
                                >
                                    Phase
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='PerUnitMagnitude'
                                    AllowSort={false}
                                    Field='PerUnitMagnitude'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style);
                                        return (item.PerUnitMagnitude * 100).toFixed(1);
                                    }}
                                >
                                    Magnitude (%)
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='DurationSeconds'
                                    AllowSort={false}
                                    Field='DurationSeconds'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style);
                                        return (item.DurationSeconds * 1000).toFixed(2);
                                    }}
                                >
                                    Duration (ms)
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='StartTime'
                                    AllowSort={false}
                                    Field='StartTime'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style);
                                        return moment(item.StartTime).format('HH:mm:ss.SSS');
                                    }}
                                >
                                    Start Time
                                </Column>
                                <Column<IDisturbanceData>
                                    Key='SeverityCode'
                                    AllowSort={false}
                                    Field='SeverityCode'
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                    Content={({ item, style }) => {
                                        applyGroupCellStyle(item, style, 'right');
                                        return item.SeverityCode;
                                    }}
                                >
                                    Severity
                                </Column>
                            </Table>
                    }
                </div>
            </div>
        );
    }
}

interface IDisturbanceBucket {
    Rows: IDisturbanceData[];
    StartTime: number;
    EndTime: number;
}

/** Groups disturbances of the same event type into contiguous display blocks, including singleton groups. */
export const groupDisturbances = (data: IDisturbanceData[]): IDisturbanceData[] => {
    const rowsByType = new Map<string, IDisturbanceData[]>();

    data.forEach(row => {
        const rows = rowsByType.get(row.EventType) ?? [];
        rows.push(row);
        rowsByType.set(row.EventType, rows);
    });

    const blocks: IDisturbanceBucket[] = [];
    rowsByType.forEach(rows => {
        const sortedRows = [...rows].sort(compareDisturbances);
        let currentBlock: IDisturbanceBucket | undefined;

        sortedRows.forEach(row => {
            const startTime = getStartTime(row);
            const endTime = startTime + row.DurationSeconds * 1000;

            if (currentBlock == null || startTime > currentBlock.EndTime) {
                currentBlock = { Rows: [row], StartTime: startTime, EndTime: endTime };
                blocks.push(currentBlock);
            }
            else {
                currentBlock.Rows.push(row);
                currentBlock.EndTime = Math.max(currentBlock.EndTime, endTime);
            }
        });
    });

    blocks.sort((left, right) => left.StartTime - right.StartTime);

    const groupNumbersByType = new Map<string, number>();
    let groupColorIndex = 0;
    return blocks.reduce<IDisturbanceData[]>((result, block) => {
        const eventType = block.Rows[0].EventType;
        const groupNumber = (groupNumbersByType.get(eventType) ?? 0) + 1;
        groupNumbersByType.set(eventType, groupNumber);

        const groupColor = GROUP_COLORS[groupColorIndex % GROUP_COLORS.length];
        groupColorIndex++;
        block.Rows.forEach((row, index) => result.push({
            ...row,
            GroupNumber: groupNumber,
            GroupColor: groupColor,
            IsFirstGroupRow: index === 0,
            IsLastGroupRow: index === block.Rows.length - 1
        }));
        return result;
    }, []);
}

/** Sorts disturbances by start time while preserving input order for equal starts. */
const compareDisturbances = (left: IDisturbanceData, right: IDisturbanceData): number => {
    return getStartTime(left) - getStartTime(right);
}

/** Converts a disturbance start time to milliseconds. */
const getStartTime = (row: IDisturbanceData): number => moment.utc(row.StartTime).valueOf();

/** Applies grouped-row borders to the style object Gemstone passes from Column.Content to its td. */
const applyGroupCellStyle = (row: IDisturbanceData, style?: React.CSSProperties, columnEdge?: 'left' | 'right'): void => {
    if (row.GroupColor == null || style == null) return;

    if (row.IsFirstGroupRow)
        style.borderTop = `2px solid ${row.GroupColor}`;

    if (row.IsLastGroupRow)
        style.borderBottom = `2px solid ${row.GroupColor}`;

    if (columnEdge === 'left')
        style.borderLeft = `2px solid ${row.GroupColor}`;

    if (columnEdge === 'right')
        style.borderRight = `2px solid ${row.GroupColor}`;
}

/** Requests voltage disturbances for an event. */
const getDisturbanceData = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/AssetVoltageDisturbances/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        async: true
    });
}

export default AssetVoltageDisturbances;
