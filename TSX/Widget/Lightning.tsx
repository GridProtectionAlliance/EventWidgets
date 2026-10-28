//******************************************************************************************************
//  Lightning.tsx - Gbtc
//
//  Copyright � 2020, Grid Protection Alliance.  All Rights Reserved.
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
//  02/27/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import * as React from 'react';
import { scaleLinear, line, extent } from 'd3';
import moment from 'moment';
import { Table, Column } from '@gpa-gemstone/react-table';
import { useGetContainerPosition, GetColor, GetTextWidth } from '@gpa-gemstone/helper-functions';
import { Application } from '@gpa-gemstone/application-typings';
import { Alert } from '@gpa-gemstone/react-interactive';
import { TextArea } from '@gpa-gemstone/react-forms';
import { EventWidget } from '../global';

interface ISetting {
    /** SQL query run against the dbLightning connection. When empty, the built-in default query is used. */
    SQLCommand: string
}

/** One row returned by the lightning query: a Day column plus one strike count column per service. */
type LightningRow = Record<string, string | number | null>;

/** Daily strike counts for one lightning service. */
interface ISeries {
    /** Service name, taken from the query's column name. */
    Name: string,
    /** Color used for the service's line and table swatch. */
    Color: string,
    /** Strike count for each day, aligned with the chart's days. */
    Counts: number[],
    /** Sum of the daily strike counts. */
    Total: number
}

const SVG_HEIGHT = 200;
const MARGIN = { top: 0, right: 0, bottom: 20 };
const PLOT_HEIGHT = SVG_HEIGHT - MARGIN.top - MARGIN.bottom;
const SECONDS_PER_DAY = 86400;
const X_TICK_COUNT = 10;
const X_TICK_SPACING_DAYS = 3;
const Y_TICK_COUNT = 5;
const Y_TICK_SIZE = 6;
const Y_TICK_PADDING = 3;
const Y_LABEL_EDGE_GAP = 4;
const AXIS_FONT_FAMILY = 'sans-serif';
const AXIS_FONT_SIZE = 10;
const DATE_FORMAT = 'MM/DD';

/** Charts and tabulates the daily lightning strike counts for the 30 days leading up to an event. */
const Lightning: EventWidget.IWidget<ISetting> = {
    Name: 'Lightning',
    DefaultSettings: {
        SQLCommand: ''
    },
    Settings: (props) => {
        return (
            <div className="row">
                <div className="col">
                    <TextArea<ISetting>
                        Rows={10}
                        Record={props.Settings}
                        Field="SQLCommand"
                        Label="SQL Command"
                        Valid={() => true}
                        Setter={props.SetSettings}
                        Help={
                            <>
                                Leave blank to use the default query. <code>{'{0}'}</code> is replaced with the event start time (UTC).
                                The query must return one row per day for 30 days, ordered by <code>Day</code>, with the following columns:
                                <ul className="mb-0">
                                    <li><code>Day</code> - the date of the row. The name is case-sensitive.</li>
                                    <li>One numeric column per lightning service containing the strike count for that day. Every column other than <code>Day</code> is treated as a service, and its name is used as the series label in the chart and table.</li>
                                </ul>
                            </>
                        }
                    />
                </div>
            </div>
        );
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const plotRef = React.useRef<HTMLDivElement | null>(null);
        const { width: svgWidth } = useGetContainerPosition(plotRef);

        const [rows, setRows] = React.useState<LightningRow[]>([]);
        const [hiddenSeries, setHiddenSeries] = React.useState<string[]>([]);
        const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
        const [isCursorVisible, setIsCursorVisible] = React.useState<boolean>(false);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        const days = React.useMemo(() => rows.map(row => moment(row.Day).unix()), [rows]);
        const series = React.useMemo(() => toSeries(rows), [rows]);
        const visibleSeries = React.useMemo(() => series.filter(s => !hiddenSeries.includes(s.Name)), [series, hiddenSeries]);
        const yScale = React.useMemo(() => scaleLinear().rangeRound([PLOT_HEIGHT, 0]).domain(getYDomain(visibleSeries)), [visibleSeries]);
        const yTicks = React.useMemo(() => {
            const format = yScale.tickFormat(Y_TICK_COUNT);
            return yScale.ticks(Y_TICK_COUNT).map(value => ({ Value: value, Label: format(value) }));
        }, [yScale]);
        const marginLeft = React.useMemo(() => getYAxisWidth(yTicks.map(tick => tick.Label)), [yTicks]);
        const plotWidth = Math.max(svgWidth - marginLeft - MARGIN.right, 0);
        const xScale = React.useMemo(() => scaleLinear().rangeRound([0, plotWidth]).domain(extent(days) as [number, number]), [days, plotWidth]);
        const xTicks = React.useMemo(() => getXTicks(days), [days]);
        const paths = React.useMemo(() => {
            const lineFunc = line<[number, number]>().x(d => xScale(d[0])).y(d => yScale(d[1]));
            return visibleSeries.map(s => ({ Name: s.Name, Color: s.Color, D: lineFunc(s.Counts.map((count, i) => [days[i], count])) ?? '' }));
        }, [visibleSeries, days, xScale, yScale]);
        const cursorX = isCursorVisible && hoveredIndex != null ? xScale(days[hoveredIndex]) + marginLeft : null;

        // Reload the lightning history and reset the hover and series toggles whenever the event or the widget whose query is used changes.
        React.useEffect(() => {
            setStatus('loading');
            setHiddenSeries([]);
            setHoveredIndex(null);
            const handle = getLightningData(props.HomePath, props.EventID, props.WidgetID);

            handle.done(data => {
                setRows(data);
                setStatus('idle');
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null) handle.abort();
            };
        }, [props.EventID, props.HomePath, props.WidgetID]);

        const handleMouseMove = (evt: React.MouseEvent<SVGSVGElement>) => {
            const bounds = evt.currentTarget.getBoundingClientRect();
            const mouseX = evt.clientX - bounds.left;
            const mouseY = evt.clientY - bounds.top;

            if (days.length === 0 || mouseX < marginLeft || mouseX >= svgWidth - 1 || mouseY > PLOT_HEIGHT || mouseY < MARGIN.top) {
                setIsCursorVisible(false);
                return;
            }

            setHoveredIndex(getNearestIndex(days, xScale.invert(mouseX - marginLeft)));
            setIsCursorVisible(true);
        };

        const handleToggleSeries = (name: string) => {
            setHiddenSeries(current => current.includes(name) ? current.filter(n => n !== name) : [...current, name]);
        };

        return (
            <div className="card" hidden={status === 'uninitiated' || status === 'loading'}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>30 Day Lightning History:</div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching lightning data. Please check System Center for more details.
                        </Alert>
                        : null}
                    <div ref={plotRef}>
                        <svg
                            width={svgWidth}
                            height={SVG_HEIGHT}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setIsCursorVisible(false)}
                        >
                            {cursorX != null ?
                                <path stroke='red' d={`M0,0V0,${PLOT_HEIGHT}`} transform={`translate(${cursorX},0)`} />
                                : null}
                            <g transform={`translate(${marginLeft},0)`}>
                                <path stroke='#000' d={`M0,0V0,${PLOT_HEIGHT}`} />
                                {yTicks.map(tick =>
                                    <g key={tick.Value} transform={`translate(0,${yScale(tick.Value)})`}>
                                        <line stroke='#000' x2={-Y_TICK_SIZE} />
                                        <text
                                            fill='#000'
                                            x={-(Y_TICK_SIZE + Y_TICK_PADDING)}
                                            dy='0.32em'
                                            textAnchor='end'
                                            fontFamily={AXIS_FONT_FAMILY}
                                            fontSize={AXIS_FONT_SIZE}
                                        >
                                            {tick.Label}
                                        </text>
                                    </g>
                                )}
                            </g>
                            <g transform={`translate(${marginLeft},0)`}>
                                {paths.map(p =>
                                    <path key={p.Name} fill='none' strokeLinejoin='round' strokeWidth='1.5' style={{ stroke: p.Color }} d={p.D} />
                                )}
                            </g>
                            <g transform={`translate(${marginLeft},${PLOT_HEIGHT})`}>
                                <path stroke='#000' d={`M 0 0 h 0 ${plotWidth} v -${PLOT_HEIGHT} 0 h 0 -${plotWidth}`} fill='none' />
                                {xTicks.map(tick =>
                                    <g key={tick} className='tick' opacity='1' transform={`translate(${xScale(tick)},0)`}>
                                        <line stroke="#000" y2="6" />
                                        <text fill="#000" y="9" dy="0.71em" fontFamily={AXIS_FONT_FAMILY} fontSize={AXIS_FONT_SIZE}>{moment.unix(tick).format(DATE_FORMAT)}</text>
                                    </g>
                                )}
                            </g>
                        </svg>
                    </div>
                    <Table<ISeries>
                        Data={series}
                        KeySelector={(item) => item.Name}
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'auto', maxHeight: props.MaxHeight ?? 500, width: '100%' }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    >
                        <Column<ISeries>
                            Key={'Name'}
                            AllowSort={false}
                            Field={'Name'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={({ item }) =>
                                <>
                                    <span
                                        onClick={() => handleToggleSeries(item.Name)}
                                        style={{ display: 'inline-block', marginRight: 10, height: 20, width: 20, backgroundColor: hiddenSeries.includes(item.Name) ? 'darkgray' : item.Color }}
                                    />
                                    {item.Name}
                                </>
                            }
                        >
                            Service
                        </Column>
                        <Column<ISeries>
                            Key={'HoveredDay'}
                            AllowSort={false}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={({ item }) => hoveredIndex != null ? item.Counts[hoveredIndex] : null}
                        >
                            {hoveredIndex != null ? moment.unix(days[hoveredIndex]).format(DATE_FORMAT) : ''}
                        </Column>
                        <Column<ISeries>
                            Key={'Total'}
                            AllowSort={false}
                            Field={'Total'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        >
                            Totals
                        </Column>
                    </Table>
                </div>
            </div>
        );
    }
}

/** Splits the query rows into one series per non-Day column, counting a missing value as zero strikes. */
const toSeries = (rows: LightningRow[]): ISeries[] => {
    if (rows.length === 0) return [];

    return Object.keys(rows[0]).filter(key => key !== 'Day').map((name, index) => {
        const counts = rows.map(row => Number(row[name] ?? 0));
        return {
            Name: name,
            Color: GetColor(index),
            Counts: counts,
            Total: counts.reduce((sum, count) => sum + count, 0)
        };
    });
};

/** Returns the y-axis domain for the visible series, padded 10% below the smallest count and above the largest. */
const getYDomain = (series: ISeries[]): [number, number] => {
    const counts = series.flatMap(s => s.Counts);
    if (counts.length === 0) return [0.9, 1.1];
    return [0.9 * Math.min(...counts), 1.1 * Math.max(...counts)];
};

/** Returns the left margin needed to fit the widest y-axis label, its tick mark, and a gap from the SVG edge. */
const getYAxisWidth = (labels: string[]): number => {
    const labelWidth = Math.max(0, ...labels.map(label => GetTextWidth(AXIS_FONT_FAMILY, `${AXIS_FONT_SIZE}px`, label)));
    return labelWidth + Y_TICK_SIZE + Y_TICK_PADDING + Y_LABEL_EDGE_GAP;
};

/** Returns the x-axis tick times, every few days starting from the first day. */
const getXTicks = (days: number[]): number[] => {
    if (days.length === 0) return [];
    const start = Math.min(...days);
    return Array.from({ length: X_TICK_COUNT }, (_, i) => start + i * X_TICK_SPACING_DAYS * SECONDS_PER_DAY);
};

/** Returns the index of the day closest to the given unix time. */
const getNearestIndex = (days: number[], time: number): number =>
    days.reduce((nearest, day, i) => Math.abs(day - time) < Math.abs(days[nearest] - time) ? i : nearest, 0);

/** Fetches the daily lightning strike counts for an event using the widget's configured query. */
const getLightningData = (homePath: string, eventID: number, widgetID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/Lightning/${eventID}/${widgetID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: false,
        async: true
    }) as JQuery.jqXHR<LightningRow[]>;
};

export default Lightning;
