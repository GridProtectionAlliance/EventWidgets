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

import { Application, OpenXDA } from '@gpa-gemstone/application-typings';
import { LoadingIcon, ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import moment from 'moment';
import _ from 'lodash';
import * as React from 'react';
import { EventWidget } from '../global';
import { SpacedColor } from '@gpa-gemstone/helper-functions';
import { Bar, Legend, DataLegend, Plot } from '@gpa-gemstone/react-graph';

type TimeCount = {
    Year: string,
    Month: string
} & {
    [key: string]: number
}

interface IData {
    XVal: number,
    Width: number,
    Data: number[]
    Color: string
}

interface IEnabled {
    [key: string]: {
        enabled: boolean
        color: string
    }
}

const EventCountChart: EventWidget.ICollectionWidget<{}> = {
    Name: 'EventCountChart',
    DefaultSettings: {},
    Settings: (_props: EventWidget.IWidgetSettingsProps<{}>) => {
        return (<></>);
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<{}>) => {
        const chartRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
        const [dimensions, setDimensions] = React.useState<{ Width: number, Height: number }>({ Width: 100, Height: 100 });
        const [data, setData] = React.useState<TimeCount[]>([]);
        const [enabled, setEnabled] = React.useState<IEnabled>({});
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        const chartData: IData[] = React.useMemo(() => {
            let endVal;
            let xVal;
            return data
                .flatMap(datum => {
                    const date = moment.utc(`${datum.Year} ${datum.Month}`, "YYYY MMM");
                    if (endVal == null)
                        xVal = date.clone().subtract(15, 'days').valueOf();
                    else
                        xVal = endVal;
                    endVal = date.clone().add(15, 'days').valueOf();
                    const width = endVal - xVal;
                    let topYVal = 0;
                    return Object
                        .keys(datum)
                        .filter(key => key !== "Year" && key !== "Month" && datum[key] > 0 && enabled[key].enabled)
                        .map(key => {
                            const bottomYVal = topYVal;
                            topYVal += datum[key];
                            return {
                                XVal: xVal,
                                Width: width,
                                Data: [bottomYVal, topYVal],
                                Color: enabled[key].color
                            }
                        }
                    );
                }
            );
        }, [data, enabled]);

        const tDomain: [number, number] = React.useMemo(() => {
            if (chartData.length === 0)
                return [0, 1];
            return [chartData[0].XVal, chartData[chartData.length - 1].XVal + chartData[chartData.length - 1].Width];
        }, [chartData])

        // Resize ref for graph dims
        React.useEffect(() => {
            let resizeObserver: ResizeObserver;
            const intervalHandle = setInterval(() => {
                if (chartRef?.current == null) return;
                resizeObserver = new ResizeObserver(
                    _.debounce(() => {
                        if (chartRef.current == null) return;

                        // gets dims of div without rounding
                        const dims = chartRef.current?.getBoundingClientRect();
                        setDimensions({
                            Width: dims.width ?? 100,
                            Height: dims.height ?? 100
                        });
                    }, 100)
                );
                resizeObserver.observe(chartRef.current);
                clearInterval(intervalHandle);
            }, 10);

            return () => {
                clearInterval(intervalHandle);
                if (resizeObserver != null && resizeObserver.disconnect != null) resizeObserver.disconnect();
            };
        }, []);

        React.useEffect(() => {
            if (props.CurrentFilter.TimeFilter == null)
                return;

            const floorStartTime = moment
                .utc(props.CurrentFilter.TimeFilter.StartTime, OpenXDA.Consts.DateTimeFormat)
                .startOf("month")
                .format(OpenXDA.Consts.DateTimeFormat);

            const ceilEndTime = moment
                .utc(props.CurrentFilter.TimeFilter.EndTime, OpenXDA.Consts.DateTimeFormat)
                .add(1, "month")
                .startOf("month")
                .format(OpenXDA.Consts.DateTimeFormat);

            setStatus('loading');
            const handle = $.ajax({
                type: "POST",
                url: `${homePath}api/EventWidgets/Event/EventCountByMonth`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    MeterIDs: props.CurrentFilter?.MeterFilter?.map(meter => meter.ID) ?? [],
                    StartTime: floorStartTime,
                    EndTime: ceilEndTime
                }),
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done((data: Array<TimeCount>) => {
                const newEnabled: IEnabled = { ...enabled };
                data.forEach(datum => Object
                    .keys(datum)
                    .filter(key => newEnabled?.[key] == null && key !== "Year" && key !== "Month" && datum[key] > 0)
                    .forEach(key => {
                        newEnabled[key] = {
                            color: getColor(key),
                            enabled: true
                        }
                    })
                );
                setEnabled(newEnabled);
                setData(data);
                setStatus('idle');
            }).fail(() => {
                setStatus('error');
            });

            return () => {
                if (handle != null && handle?.abort != null)
                    handle.abort();
            }
        }, [props.CurrentFilter.TimeFilter]);

        if (status == 'error')
            return (
                <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                    <div className="card-header">
                        Historical Event Counts - Error
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
                    {props.Title == null ? "Historical Event Counts" : props.Title}
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }}>
                    <LoadingIcon Show={status !== 'idle'} />
                    <div className="row" style={{ flex: 1, overflow: 'hidden' }} ref={chartRef}>
                        <Plot
                            height={dimensions.Height}
                            width={dimensions.Width}
                            showBorder={false}
                            yDomain={'HalfAutoValue'}
                            XAxisType={"time"}
                            defaultTdomain={tDomain}
                            legend={'hidden'}
                            showMouse={false}
                            zoom={false}
                            pan={false}
                            showGrid={true}
                            hideYAxis={false}
                            hideXAxis={false}
                            defaultMouseMode={"select"}
                            menuLocation={"hide"}
                            useMetricFactors={false}>
                            {chartData.map((item, index) =>
                                (<Bar
                                Data={item.Data}
                                BarOrigin={item.XVal}
                                BarWidth={item.Width}
                                XBarOrigin={'left'}
                                Color={item.Color}
                                StrokeColor={"black"}
                                key={index}
                            />)
                            )}
                        </Plot>
                    </div>
                    <div className="row" style={{height: 60}}>
                        <Legend
                            LegendElements={Object.keys(enabled).map(key =>
                            (<DataLegend
                                color={enabled[key].color}
                                legendSymbol={"square"}
                                setEnabled={(e) =>
                                    setEnabled(v =>
                                        ({ ...v, [key]: { enabled: e, color: v[key].color } })
                                    )
                                }
                                hasNoData={false}
                                label={key}
                                enabled={enabled[key].enabled}
                                id={key}
                            />)
                            )}
                            height={75}
                            width={dimensions.Width - 20}
                            orientation={'horizontal'}
                        />
                    </div>
                </div>
            </div>
        )
    }
}

function getColor(type: string) {
    if (type.toLowerCase() == "sag") return 'purple';
    if (type.toLowerCase() == "swell") return 'green';
    if (type.toLowerCase() == "transient") return 'orange';
    if (type.toLowerCase() == "interruption") return 'red';
    if (type.toLowerCase() == "fault") return 'blue';
    else return SpacedColor(1, 0.75);
}

export default EventCountChart;