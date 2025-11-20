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
import { LoadingIcon, Alert } from '@gpa-gemstone/react-interactive';
import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { EventWidget } from '../global';

interface ISetting {
    MeasurementType: 'Current' | 'Voltage' | 'TripCoilCurrent',
    StartHoursBefore: number,
    EndHoursAfter: number,
}

interface IDataStructure {
    Voltage: IInnerDataStructure,
    Current: IInnerDataStructure,
    TripCoilCurrent: IInnerDataStructure,
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
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

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
            const data: IDataStructure = {
                Voltage: {},
                Current: {},
                TripCoilCurrent: {},
                TimeLimits: [0, 1]
            };

            const channelHandle: JQuery.jqXHR = $.ajax({
                type: "GET",
                url: `${homePath}api/EventWidgets/HIDS/TrendChannels/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: false,
                async: true
            });

            const trendDataHandle: JQuery.jqXHR = $.ajax({
                type: "POST",
                url: `${homePath}api/EventWidgets/HIDS/QueryPoints`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    EventID: props.EventID,
                    HoursBefore: props.Settings.StartHoursBefore,
                    HoursAfter: props.Settings.EndHoursAfter
                }),
                dataType: 'text',
                cache: false,
                async: true
            });

            Promise.all([channelHandle, trendDataHandle]).then(allData => {
                const newPoints: string[] = allData[1].split("\n");
                const channels: OpenXDA.Types.Channel[] = allData[0];
                const organizedData: { [key: string]: [number, number][] } = {};

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

                let lowerTemporalBound = Number.MAX_SAFE_INTEGER;
                let upperTemporalBound = Number.MIN_SAFE_INTEGER;

                ['Voltage', 'Current', 'TripCoilCurrent'].forEach(measurementType => {
                    const relevantChannels = channels.filter(channel => channel.MeasurementType === measurementType);
                    const prefix = measurementType === "Voltage" ? "V" : "I";
                    Object.keys(organizedData).forEach(tag => {
                        const index = relevantChannels.findIndex(chan => chan.ID === Number("0x" + tag));
                        if (index >= 0) {
                            const firstTimeStamp = organizedData[tag][0][0];
                            const lastTimeStamp = organizedData[tag][organizedData[tag].length - 1][0];
                            if (firstTimeStamp < lowerTemporalBound)
                                lowerTemporalBound = firstTimeStamp;
                            if (lastTimeStamp > upperTemporalBound)
                                upperTemporalBound = lastTimeStamp;
                            data[measurementType][prefix + relevantChannels[index].Phase] = organizedData[tag];
                        }
                    });
                });
                // No data
                if (lowerTemporalBound === Number.MAX_SAFE_INTEGER || upperTemporalBound === Number.MIN_SAFE_INTEGER)
                    data.TimeLimits = [0, 1];
                else
                    data.TimeLimits = [lowerTemporalBound, upperTemporalBound];
                setData(data);
                setStatus('idle');
            }, (err) => {
                console.error(err);
                setStatus('error');
            });

            return () => {
                if (channelHandle?.abort != null) channelHandle.abort();
                if (trendDataHandle?.abort != null) trendDataHandle.abort();
            }
        }, [props.EventID, props.Settings]);

        return (
            <div className="card" ref={containerRef}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Trending Data
                </div>
                <LoadingIcon Show={status === 'loading' || status === 'uninitiated'} />
                {status === 'error' ?
                    <div className="card-body p-0">
                        <Alert Class='alert-danger'>Error retrieving trending data.</Alert>
                    </div> : <></>
                }
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
                                {Object.keys(data.Voltage).map((s) =>
                                    <Line highlightHover={false} showPoints={false} lineStyle={'-'} color={getColor(s)} data={data.TripCoilCurrent[s]} legend={s} key={s} />
                                )}
                            </Plot> : null}
                    </div> : <></>
                }
            </div>
        );
    }
}

export default TrendGraph;