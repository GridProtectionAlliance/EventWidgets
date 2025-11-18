//******************************************************************************************************
//  EventSearchMagDurChart.tsx - Gbtc
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
//  06/23/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import * as React from 'react';
import { Line, Plot, Circle, AggregatingCircles } from '@gpa-gemstone/react-graph';
import { Application, OpenXDA } from '@gpa-gemstone/application-typings'
import { EventWidget } from '../global';
import { CheckBox, Input } from '@gpa-gemstone/react-forms';
import { GenericController, LoadingIcon } from '@gpa-gemstone/react-interactive';
import _ from 'lodash';

interface ISettings {
    Aggregate: boolean,
    ChartLimit: number
}

interface ICurveData {
    [key: string]: {
        Color: string,
        Data: [number,number][]
    }
}

interface ICircleProps {
    data: [number, number],
    color: string,
    radius: number,
    onClick: () => void
}

const MagDurChart: EventWidget.ICollectionWidget<ISettings> = {
    Name: 'MagDurChart',
    DataType: 'XDA-Search',
    DefaultSettings: { Aggregate: true, ChartLimit: 100 },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISettings>) => {
        return (
            <div className="row">
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'ChartLimit'}
                        Valid={() => props.Settings.ChartLimit > 0}
                        Feedback={"Must be greater than zero."}
                        Setter={props.SetSettings}
                        Label={'Limit on the number of events to display'}
                    />
                    <CheckBox<ISettings>
                        Record={props.Settings}
                        Field={'Aggregate'}
                        Setter={props.SetSettings}
                        Label={'Aggregate Chart Points'}
                    />
                </div>
            </div>);
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<ISettings>) => {
        const chart = React.useRef<HTMLDivElement | undefined>(undefined);
        const empty = React.useCallback(() => {/*Do Nothing*/ }, []);
        const [dims, setDims] = React.useState<{ Width: number, Height: number }>({Width: 100, Height: 100});
        const [curves, setCurves] = React.useState<ICurveData>({});
        const [curveStatus, setCurveStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [data, setData] = React.useState<ICircleProps[]>([]);

        const magDurController = React.useMemo(() => new GenericController<OpenXDA.Types.MagDurCurve>(
            `${props.HomePath}api/EventWidgets/MagDurCurve`, "Name", true
        ), [props.HomePath]);

        // Resize ref for graph dims
        React.useEffect(() => {
            let resizeObserver: ResizeObserver;
            const intervalHandle = setInterval(() => {
                if (chart?.current == null) return;
                resizeObserver = new ResizeObserver(
                    _.debounce(() => {
                        if (chart.current == null) return;

                        // gets dims of div without rounding
                        const d = chart.current?.getBoundingClientRect();
                        setDims({
                            Width: d.width ?? 100,
                            Height: d.height ?? 100
                        });
                    }, 100)
                );
                resizeObserver.observe(chart.current);
                clearInterval(intervalHandle);
            }, 10);

            return () => {
                clearInterval(intervalHandle);
                if (resizeObserver != null && resizeObserver.disconnect != null) resizeObserver.disconnect();
            };
        }, []);

        React.useEffect(() => {
            setCurveStatus('loading');
            const handle = magDurController.Fetch();

            handle.then((curveData) => {
                const curveDict: ICurveData = {}; 
                setCurveStatus('idle');
                curveData.forEach(curveDatum => {
                    curveDict[curveDatum.Name] = {
                        Color: curveDatum.Color,
                        Data: generateCurve(curveDatum)
                    }
                });
                setCurves(curveDict);
            }, () => {
                setCurveStatus('error');
            });

            return () => {
                if (handle?.abort != null) handle.abort();
            }
        }, []);

        React.useEffect(() => {
            const events = props.SelectedEvents == null ?
                props.Events :
                props.Events.filter(e => !props.SelectedEvents.has(e.ID));

            setData(events.slice(0, props.Settings.ChartLimit).map((e) => ({
                data: [e.DurationSeconds, e.PerUnitMagnitude],
                color: 'red',
                radius: 5,
                onClick: () => {
                    if (props.EventCallBack != null)
                        props.EventCallBack([e]);
                }
            })));
        }, [props.Events, props.Settings.ChartLimit])

        return (
            <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ? "Magnitude Duration Chart" : props.Title}
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }}>
                    <LoadingIcon Show={curveStatus !== 'idle' || props.SearchInformation.Status !== 'idle'} />
                    <div className="row" style={{ flex: 1, overflow: 'hidden' }} ref={chart}>
                        <Plot
                            height={dims.Height}
                            width={dims.Width}
                            showBorder={false}
                            menuLocation={'right'}
                            legendWidth={250}
                            defaultTdomain={[0.00001, 1000]}
                            defaultYdomain={[0, 5]}
                            Tmax={1000}
                            Tmin={0.00001}
                            Ymax={9999}
                            Ymin={0}
                            legend={'right'}
                            Tlabel={'Duration (s)'}
                            Ylabel={'Magnitude (pu)'}
                            showMouse={false}
                            showGrid={true}
                            yDomain={'Manual'}
                            zoom={true}
                            pan={true}
                            useMetricFactors={false}
                            XAxisType={'log'}
                            onSelect={empty}>
                            {Object.keys(curves).map(key => (
                                <Line
                                    key={key}
                                    highlightHover={false}
                                    autoShowPoints={false}
                                    lineStyle={'-'}
                                    color={curves[key].Color}
                                    data={curves[key].Data}
                                    legend={key}
                                    width={3}
                                />
                            ))}
                            <AggregatingCircles data={data}
                                canAggregate={props.Settings.Aggregate ? CanAggregate : IsSame}
                                onAggregation={AggregateCurves}
                            />
                            {props.SelectedEvents != null ?
                                props.Events.filter(e => props.SelectedEvents.has(e.ID)).map((p) => (
                                    <Circle
                                        data={[p.DurationSeconds, p.PerUnitMagnitude]}
                                        color={'blue'}
                                        radius={5}
                                        key={p.ID}
                                    />
                                )) : null
                            }
                        </Plot>
                    </div>
                    <div className="alert alert-primary">
                        {data?.length === props.Settings.ChartLimit ?
                            `Only the first ${props.Settings.ChartLimit}  chronological results are shown - please narrow your search or increase the number of results in the application settings.` :
                            `{${data?.length ?? 0} results`
                        }
                    </div> 
                </div>
            </div>
        )
    }
}

export default MagDurChart;

function CanAggregate(d1, d2, { XTransformation, YTransformation }) {
    const dx = XTransformation(d1.data[0]) - XTransformation(d2.data[0]);
    const dy = YTransformation(d1.data[1]) - YTransformation(d2.data[1]);
    const r = d1.radius + d2.radius;
    return (Math.pow(dx, 2) + Math.pow(dy, 2) < Math.pow(r, 2));
}
function generateCurve(curve: OpenXDA.Types.MagDurCurve) {
    const pt = curve.Area.split(',');
    const cu = pt.map(point => { const s = point.trim().split(" "); return [parseFloat(s[0]), parseFloat(s[1])] as [number, number]; })
    return cu;
}

function IsSame(d1, d2) {
    return Math.abs(d1.data[0] - d2.data[0]) < 0.0001 && Math.abs(d1.data[1] - d2.data[1]) < 1E-10;
}

function AggregateCurves(d, { XTransformation, YTransformation, YInverseTransformation, XInverseTransformation }) {
    const xmax = Math.max(...d.map(c => XTransformation(c.data[0]))) + 5;
    const ymax = Math.max(...d.map(c => YTransformation(c.data[1]))) + 5;
    const xmin = Math.min(...d.map(c => XTransformation(c.data[0]))) - 5;
    const ymin = Math.min(...d.map(c => YTransformation(c.data[1]))) - 5;
    const xcenter = 0.5 * (xmax + xmin);
    const ycenter = 0.5 * (ymax + ymin);
    const r = Math.max(Math.abs(xmax - xcenter), Math.abs(xmin - xcenter), Math.abs(ymax - ycenter), Math.abs(ymin - ycenter))
    let handler = ({ setTDomain, setYDomain }) => {
        setTDomain([XInverseTransformation(xmin), XInverseTransformation(xmax)]);
        setYDomain([YInverseTransformation(ymax), YInverseTransformation(ymin)]);
    };
    return {
        data: [XInverseTransformation(xcenter), YInverseTransformation(ycenter)] as [number, number],
        color: 'rgb(108, 117, 125)',
        borderColor: 'black',
        borderThickness: 2,
        text: d.length.toString(),
        radius: r,
        opacity: 0.5,
        onClick: handler
    };
}