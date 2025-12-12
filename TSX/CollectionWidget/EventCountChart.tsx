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
import { SpacedColor, GetColor } from '@gpa-gemstone/helper-functions';
import { Select } from '@gpa-gemstone/react-forms';
import { Bar, DataLegend, Legend, Plot } from '@gpa-gemstone/react-graph';
import { LoadingIcon, ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import _ from 'lodash';
import moment from 'moment';
import * as React from 'react';
import { EventWidget } from '../global';

type TimeCount = {
    aggTime: string
} & {
    [key: string]: number
}

interface IData {
    XVal: number,
    Width: number,
    Data: number[],
    GetStyle: (_, index: number) => {}
}

type TGranularity = 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';

interface ISettings {
    Granularity: TGranularity
}

const EventCountChart: EventWidget.ICollectionWidget<ISettings> = {
    Name: 'EventCountChart',
    DefaultSettings: { Granularity: 'Monthly' },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISettings>) => {
        return (
            <Select<ISettings>
                Record={props.Settings}
                Field='Granularity'
                Options={[
                    { Value: "Hourly", Label: "By Hour" },
                    { Value: "Daily", Label: "By Day" },
                    { Value: "Weekly", Label: "By Week" },
                    { Value: "Monthly", Label: "By Month" },
                    { Value: "Yearly", Label: "By Year" },
                ]}
                Setter={props.SetSettings}
                Label="Aggregate Events"
            />
        );
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<ISettings>) => {
        const chartRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
        const colorRef = React.useRef<{ [key: string]: string }>({});
        const [dimensions, setDimensions] = React.useState<{ Width: number, Height: number }>({ Width: 100, Height: 100 });
        const [tDomain, setTDomain] = React.useState<[number, number]>([0,1]);
        const [data, setData] = React.useState<TimeCount[]>([]);
        const [enabled, setEnabled] = React.useState<{[key: string]: boolean}>({});
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        const chartData: IData[] = React.useMemo(() => {
            if (data.length === 0) return [];

            const keyArray = Object
                .keys(data[0])
                .filter(key => key !== "aggTime" && enabled[key]);

            return data
                .map((datum, index) => {
                    const start = moment.utc(datum.aggTime, OpenXDA.Consts.DateTimeFormat);

                    const startTicks = start.valueOf();
                    const endTicks = (data.length > index + 1 ?
                        moment.utc(data[index+1].aggTime, OpenXDA.Consts.DateTimeFormat) :
                        start.clone().add(1, addVerb(props.Settings.Granularity))).valueOf();

                    const fill = startTicks < tDomain[0] || endTicks > tDomain[1] ? "Hatched" : undefined;

                    const yValues = [0];
                    keyArray.forEach((key, index) => {
                        const newValue = yValues[index] + datum[key];
                        yValues.push(newValue);
                    });

                    const styleFunction = (_values, index: number) => ({
                        Color: colorRef.current[keyArray[index]],
                        Fill: fill
                    });

                    return {
                        XVal: startTicks,
                        Width: endTicks - startTicks,
                        Data: yValues,
                        GetStyle: styleFunction
                    }
                }
            );
        }, [data, enabled, tDomain, props.Settings.Granularity]);

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

            const startMoment = moment.utc(props.CurrentFilter.TimeFilter.StartTime, OpenXDA.Consts.DateTimeFormat);
            const endMoment = moment.utc(props.CurrentFilter.TimeFilter.EndTime, OpenXDA.Consts.DateTimeFormat);

            setStatus('loading');
            const handle = $.ajax({
                type: "POST",
                url: `${homePath}api/EventWidgets/Event/EventCountAggregate`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    MeterIDs: props.CurrentFilter?.MeterFilter?.map(meter => meter.ID) ?? [],
                    StartTime: startMoment.format(OpenXDA.Consts.DateTimeFormat),
                    EndTime: endMoment.format(OpenXDA.Consts.DateTimeFormat),
                    Granularity: props.Settings.Granularity
                }),
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done((data: Array<TimeCount>) => {
                const newEnabled: {[key: string]: boolean} = { ...enabled };
                data.forEach(datum => Object
                    .keys(datum)
                    .filter(key => newEnabled?.[key] == null && key !== "aggTime" && datum[key] > 0)
                    .forEach(key => {
                        newEnabled[key] = true;
                        colorRef.current[key] = getColor(key);
                    })
                );
                setEnabled(newEnabled);
                setTDomain([startMoment.valueOf(), endMoment.valueOf()]);
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
                            width={dimensions.Width-20}
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
                                Color={"black"}
                                GetBarStyle={item.GetStyle}
                                key={index}
                            />)
                            )}
                        </Plot>
                    </div>
                    <div className="row" style={{height: 60}}>
                        <Legend
                            LegendElements={Object.keys(enabled).map(key =>
                            (<DataLegend
                                color={colorRef.current[key]}
                                legendSymbol={"square"}
                                setEnabled={(e) =>
                                    setEnabled(v =>
                                        ({ ...v, [key]: e })
                                    )
                                }
                                hasNoData={false}
                                label={key}
                                enabled={enabled[key]}
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

function addVerb(granularity: TGranularity): "hour"|"day"|"week"|"month"|"year" {
    switch (granularity) {
        case 'Hourly':
            return "hour";
        case 'Daily':
            return "day";
        case 'Weekly':
            return "week";
        case 'Monthly':
            return "month";
        case 'Yearly':
            return "year";
        default:
            console.warn("Unrecognized granularity detected, unexpected behavior may occur: " + granularity);
            return "month";
    }
}

function getColor(type: string) {
    switch (type.toLowerCase()) {
        case 'interruption':
            return GetColor(14);
        case 'swell':
            return GetColor(15);
        case 'fault':
            return GetColor(16);
        case 'transient':
            return GetColor(17);
        case 'sag':
            return GetColor(18);
        case 'other':
            return GetColor(21);
        default:
            return SpacedColor(1, 0.75);
    }
}

export default EventCountChart;