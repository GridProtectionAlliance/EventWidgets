//******************************************************************************************************
//  EventSearchPreviewD3Chart.tsx - Gbtc
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
//  02/20/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import { Application, HIDS, OpenXDA } from '@gpa-gemstone/application-typings';
import { SpacedColor } from '@gpa-gemstone/helper-functions';
import { Input } from '@gpa-gemstone/react-forms';
import { Line, Plot, VerticalMarker } from '@gpa-gemstone/react-graph';
import { LoadingIcon } from '@gpa-gemstone/react-interactive';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { EventWidget } from '../global';

const sendToServerFormat = "YYYY-MM-DD[T]HH:mm:ss.SSS";

interface ISetting {
    MeasurementType: 'Current' | 'Voltage' | 'TripCoilCurrent',
    StartHoursBefore: number,
    EndHoursAfter: number,
}

interface IDataStructure {
    Voltage: IInnerDataStructure,
    Current: IInnerDataStructure,
    TripCoilCurrent: IInnerDataStructure,
    EventTime: number,
    TimeLimits: [number, number]
}

interface IInnerDataStructure {
    [key: string]: [number, number][]
}

function getColor(label) {
    if (label.indexOf('VA') >= 0) return '#A30000';
    if (label.indexOf('VB') >= 0) return '#0029A3';
    if (label.indexOf('VC') >= 0) return '#007A29';
    if (label.indexOf('VN') >= 0) return '#c3c3c3';
    if (label.indexOf('IA') >= 0) return '#FF0000';
    if (label.indexOf('IB') >= 0) return '#0066CC';
    if (label.indexOf('IC') >= 0) return '#33CC33';
    if (label.indexOf('IR') >= 0) return '#c3c3c3';

    return SpacedColor(1, 0.5);
}

const TrendGraph: EventWidget.IWidget<ISetting> = {
    Name: 'TrendGraph',
    DefaultSettings: {
        MeasurementType: 'Voltage',
        StartHoursBefore: 3,
        EndHoursAfter: 6
    },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISetting>) => {
        const validFunction = React.useMemo(() =>
            (field: keyof ISetting) => {
                if (field === 'StartHoursBefore' || field === 'EndHoursAfter')
                    return props.Settings[field] > 0;
                return true;
            }
            , [props.Settings]);

        return (
            <div className="row">
                <div className="col">
                    <Input<ISetting>
                        Valid={validFunction}
                        Record={props.Settings}
                        Field={'StartHoursBefore'}
                        Label={"Hours (-)"}
                        Setter={props.SetSettings}
                    />
                </div>
                <div className="col">
                    <Input<ISetting>
                        Valid={validFunction}
                        Record={props.Settings}
                        Field={'EndHoursAfter'}
                        Label={"Hours (+)"}
                        Setter={props.SetSettings}
                    />
                </div>
            </div>);
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const containerRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
        const [data, setData] = React.useState<IDataStructure | undefined>(undefined);
        const [dimensions, setDimensions] = React.useState<{ Width: number }>(null);
        const [status, setStatus] = React.useState<Application.Types.Status>('unintiated');

        React.useEffect(() => {
            let resizeObserver: ResizeObserver;
            const intervalHandle = setInterval(() => {
                if (containerRef?.current == null) return;
                resizeObserver = new ResizeObserver(
                    _.debounce(() => {
                        if (containerRef.current == null) return;

                        // gets dims of div without rounding
                        const dims = containerRef.current?.getBoundingClientRect();
                        setDimensions({ Width: dims.width ?? 100 });
                    }, 100)
                );
                resizeObserver.observe(containerRef.current);
                clearInterval(intervalHandle);
            }, 10);

            return () => {
                clearInterval(intervalHandle);
                if (resizeObserver != null && resizeObserver.disconnect != null) resizeObserver.disconnect();
            };
        }, []);

        React.useEffect(() => {
            setStatus('loading');
            let channels: OpenXDA.Types.Channel[];
            const data: IDataStructure = {
                Voltage: {},
                Current: {},
                TripCoilCurrent: {},
                EventTime: moment.utc(props.StartTime).valueOf(),
                TimeLimits: [
                    moment.utc(props.StartTime).subtract(props.Settings.StartHoursBefore, 'hours').valueOf(),
                    moment.utc(props.StartTime).add(props.Settings.EndHoursAfter, 'hours').valueOf()
                ]
            };
            const dataHandle: JQuery.jqXHR = $.ajax({
                type: "GET",
                url: `${homePath}api/EventWidgets/Channel/TrendChannels/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: false,
                async: true
            });
            
            dataHandle.then((chan: OpenXDA.Types.Channel[]) => {
                channels = chan;
                if (channels.length == 0) {
                    setData(data);
                    setStatus('idle');
                    return;
                }

                const startTime = moment.utc(props.StartTime).subtract(props.Settings.StartHoursBefore, 'hours').format(sendToServerFormat);
                const endTime = moment.utc(props.StartTime).add(props.Settings.EndHoursAfter, 'hours').format(sendToServerFormat);

                return $.ajax({
                    type: "POST",
                    url: `${homePath}api/EventWidgets/HIDS/QueryPoints`,
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({
                        Channels: channels.map(channel => channel.ID),
                        StartTime: startTime,
                        StopTime: endTime
                    }),
                    dataType: 'text',
                    cache: false,
                    async: true
                });
            }, (err) => {
                console.error(err);
                throw new Error(`Unable to retrieve trending data for event with id ${props.EventID}`);
            }).then(rawData => {
                const newPoints: string[] = rawData.split("\n");
                const organizedData = {};

                newPoints.forEach(jsonPoint => {
                    let point: HIDS.Types.IPQData | undefined = undefined;
                    try {
                        if (jsonPoint !== "") point = JSON.parse(jsonPoint);
                    }
                    catch {
                        console.error("Failed to parse point: " + jsonPoint);
                    }
                    if (point !== undefined) {
                        const timeStamp = moment.utc(point.Timestamp, HIDS.Consts.DateTimeFormat).valueOf();
                        // Todo: Handle alternate Series Types
                        if (organizedData.hasOwnProperty(point.Tag)) {
                            organizedData[point.Tag].push([timeStamp, point.Average]);
                        } else {
                            organizedData[point.Tag] = [[timeStamp, point.Average]];
                        }
                    }
                });

                ['Voltage', 'Current', 'TripCoilCurrent'].forEach(measurementType => {
                    const relevantChannels = channels.filter(channel => channel.MeasurementType === measurementType);
                    const prefix = measurementType === "Voltage" ? "V" : "I";
                    Object.keys(organizedData).forEach(tag => {
                        const index = relevantChannels.findIndex(chan => chan.ID === Number("0x" + tag));
                        if (index >= 0) {
                            data[measurementType][prefix + relevantChannels[index].Phase] = organizedData[tag];
                        }
                    });
                });
                setData(data);
                setStatus('idle');
            }, (err) => {
                console.error(err);
                throw new Error(`Unable to retrieve trending data for event with id ${props.EventID}`);
            });

            return () => {
                if (dataHandle?.abort != null) dataHandle.abort();
            }
        }, [props.EventID, props.Settings, props.StartTime]);

        return (
            <div className="card" ref={containerRef}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Trending Data
                </div>
                {status === 'idle' ?
                    <div className="card-body p-0">
                        {Object.keys(data.Voltage).length > 0 ?
                            <Plot height={250} width={dimensions.Width} showBorder={false}
                                yDomain={'AutoValue'}
                                legendWidth={150}
                                defaultTdomain={data.TimeLimits}
                                legend={'bottom'}
                                Tlabel={'Time'}
                                Ylabel={'Voltage (V)'} showMouse={false} zoom={false} pan={false} useMetricFactors={false}>
                                <VerticalMarker Value={data.EventTime} color={'000000'} lineStyle={':'} width={3} />
                                {Object.keys(data.Voltage).map((s) =>
                                    <Line highlightHover={false} showPoints={false} lineStyle={'-'} color={getColor(s)} data={data.Voltage[s]} legend={s} key={s} />
                                )}
                            </Plot> : null}
                        {Object.keys(data.Current).length > 0 ?
                            <Plot height={250} width={dimensions.Width} showBorder={false}
                                yDomain={'AutoValue'}
                                legendWidth={150}
                                defaultTdomain={data.TimeLimits}
                                legend={'bottom'}
                                Tlabel={'Time'}
                                Ylabel={'Current (I)'} showMouse={false} zoom={false} pan={false} useMetricFactors={false}>
                                <VerticalMarker Value={data.EventTime} color={'000000'} lineStyle={':'} width={3} />
                                {Object.keys(data.Current).map((s) =>
                                    <Line highlightHover={false} showPoints={false} lineStyle={'-'} color={getColor(s)} data={data.Current[s]} legend={s} key={s} />
                                )}
                            </Plot> : null}
                        {Object.keys(data.TripCoilCurrent).length > 0 ?
                            <Plot height={250} width={dimensions.Width} showBorder={false}
                                yDomain={'AutoValue'}
                                legendWidth={150}
                                defaultTdomain={data.TimeLimits}
                                legend={'bottom'}
                                Tlabel={'Time'}
                                Ylabel={'Current (I)'} showMouse={false} zoom={false} pan={false} useMetricFactors={false}>
                                <VerticalMarker Value={data.EventTime} color={'000000'} lineStyle={':'} width={3} />
                                {Object.keys(data.Voltage).map((s) =>
                                    <Line highlightHover={false} showPoints={false} lineStyle={'-'} color={getColor(s)} data={data.TripCoilCurrent[s]} legend={s} key={s} />
                                )}
                            </Plot> : null}
                    </div> : <LoadingIcon Show={true} />
                }
            </div>
        );
    }
}

export default TrendGraph;