//******************************************************************************************************
//  DynamicMagDurChart.tsx - Gbtc
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
//  Code Modification History:
//  ----------------------------------------------------------------------------------------------------
//  07/01/2026 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************

import { Application, Gemstone, OpenXDA } from '@gpa-gemstone/application-typings';
import { useGetContainerPosition } from '@gpa-gemstone/helper-functions';
import { Line, Plot, Circle, AggregatingCircles } from '@gpa-gemstone/react-graph';
import { CheckBox, Input } from '@gpa-gemstone/react-forms';
import { GenericController, LoadingIcon } from '@gpa-gemstone/react-interactive';
import * as React from 'react';
import { EventWidget } from '../../global';
import { DynamicEventSearchRow, FetchFallbackDynamicEventSearchData, IDynamicEventSearchQuery } from '../DynamicEventTable/DynamicEventSearchData';
import { DynamicMagDurEventList } from './DynamicMagDurEventList';

const LocalStorageKey = 'EventWidgets.DynamicMagDurChart.TableCols';

interface ISettings {
    Aggregate: boolean,
    ShowCard: boolean,
    NumberResults: number
}

interface IData {
    data: [number, number];
    radius: number;
    color: string;
    onClick: () => void;
}

const DynamicMagDurChart: EventWidget.ICollectionWidget<ISettings, DynamicEventSearchRow[], IDynamicEventSearchQuery> = {
    Name: 'DynamicMagDurChart',
    DefaultSettings: {
        Aggregate: true,
        ShowCard: false,
        NumberResults: 100
    },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISettings>) => {
        return (
            <div className="row">
                <div className="col">
                    <CheckBox<ISettings>
                        Record={props.Settings}
                        Field={'Aggregate'}
                        Setter={props.SetSettings}
                        Label={'Aggregate Chart Points'}
                    />
                    <CheckBox<ISettings>
                        Record={props.Settings}
                        Field={'ShowCard'}
                        Setter={props.SetSettings}
                        Label={'Show as Card'}
                    />
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'NumberResults'}
                        Setter={props.SetSettings}
                        Valid={() => props.Settings.NumberResults > 0}
                        Type={'integer'}
                        Label={'Number of Results'}
                        Feedback={'Number of Results must be a positive integer'}
                    />
                </div>
            </div>
        );
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<ISettings, DynamicEventSearchRow[], IDynamicEventSearchQuery>) => {
        const bodyRef = React.useRef<HTMLDivElement | null>(null);
        const { width: bodyWidth, height: bodyHeight } = useGetContainerPosition(bodyRef);
        const countDivRef = React.useRef<HTMLDivElement | null>(null);
        const { height: countHeight } = useGetContainerPosition(countDivRef);
        const empty = React.useCallback(() => {/*Do Nothing*/ }, []);

        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [events, setEvents] = React.useState<DynamicEventSearchRow[]>([]);
        const [sortField, setSortField] = React.useState<string>('Time');
        const [ascending, setAscending] = React.useState<boolean>(true);

        const [magDurStatus, setMagDurStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [magDurCurves, setMagDurCurves] = React.useState<OpenXDA.Types.MagDurCurve[]>([]);

        const [selectedMag, setSelectedMag] = React.useState<number>(0);
        const [selectedDur, setSelectedDur] = React.useState<number>(0);

        const magDurController = React.useMemo(() => new GenericController<OpenXDA.Types.MagDurCurve>(
            `${props.HomePath}api/EventWidgets/MagDurCurve`, "Name", true
        ), [props.HomePath]);

        React.useEffect(() => {
            setMagDurStatus('loading');
            const handle = magDurController.Fetch();

            handle.then((curveData) => {
                setMagDurCurves(curveData);
                setMagDurStatus('idle');
            }, () => {
                setMagDurStatus('error');
            });

            return () => {
                if (handle?.abort != null) handle.abort();
            };
        }, [magDurController]);

        React.useEffect(() => {
            setStatus('loading');

            const handle: Gemstone.TSX.Interfaces.AbortablePromise<DynamicEventSearchRow[]> | null = props.GetEventData == null ?
                FetchFallbackDynamicEventSearchData(props.CurrentFilter, props.HomePath, sortField, ascending, props.Settings.NumberResults) :
                props.GetEventData({ SortField: sortField, Ascending: ascending });

            if (handle == null) {
                setEvents([]);
                setStatus('idle');
                return;
            }

            handle.then((data) => {
                setEvents(data);
                setStatus('idle');
            }, () => {
                setStatus('error');
            });

            return () => {
                if (handle?.abort != null)
                    handle.abort();
            };
        }, [props.GetEventData, props.CurrentFilter, props.HomePath, props.Settings.NumberResults, sortField, ascending]);

        const data: IData[] = React.useMemo(() => {
            return events
                .filter(p => p.EventID !== props.EventID)
                .map((p) => ({
                    data: [p.MagDurDuration ?? 0, p.MagDurMagnitude ?? 0],
                    color: 'red',
                    radius: 5,
                    onClick: () => {
                        if (props.Callback != null)
                            props.Callback(p.EventID, p.DisturbanceID, p.FaultID);
                        setSelectedDur(0);
                        setSelectedMag(0);
                    }
                }));
        }, [events, props.EventID, props.Callback]);

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
                setSelectedDur(0);
                setSelectedMag(0);
            };
            if (Math.abs(xmin - xmax) < 11 && Math.abs(ymin - ymax) < 11)
                handler = () => {
                    setSelectedDur(d[0].data[0]);
                    setSelectedMag(d[0].data[1]);
                }
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

        const plotContent = React.useMemo(() => {
            return [
                ...magDurCurves.map((s, i) =>
                    <Line highlightHover={false}
                        autoShowPoints={false}
                        lineStyle={'-'}
                        color={s.Color}
                        data={generateCurve(s)}
                        legend={s.Name}
                        key={i}
                        width={3}
                    />
                ),
                <AggregatingCircles
                    data={data}
                    canAggregate={props.Settings.Aggregate ? CanAggregate : IsSame}
                    onAggregation={AggregateCurves}
                />,
                ...events
                    .filter(e => e.EventID === props.EventID)
                    .map((p) =>
                        <Circle
                            data={[p.MagDurDuration ?? 0, p.MagDurMagnitude ?? 0]}
                            color={'blue'}
                            radius={5} />
                    )
            ];
        }, [magDurCurves, events, props.EventID, data, props.Settings.Aggregate])

        const content = (
            <>
                <LoadingIcon Show={status !== 'idle' || magDurStatus !== 'idle'} />
                <Plot height={(bodyHeight ?? 500) - countHeight} width={bodyWidth ?? 500} showBorder={false} menuLocation={'right'}
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
                    zoom={true} pan={true} useMetricFactors={false} XAxisType={'log'} onSelect={empty}>
                    {plotContent}
                </Plot>
                {status == 'loading' ? null :
                    data.length == props.Settings.NumberResults ?
                        <div style={{ padding: 10, backgroundColor: '#458EFF', color: 'white' }} ref={countDivRef}>
                            Only the first {data.length} chronological results are shown - please narrow your search or increase the number of results in the application settings.
                        </div> :
                        <div style={{ padding: 10, backgroundColor: '#458EFF', color: 'white' }} ref={countDivRef}>
                            {data.length} results
                        </div>}
                <DynamicMagDurEventList
                    Select={(eventID, row) => {
                        if (props.Callback != null)
                            props.Callback(eventID, row?.DisturbanceID, row?.FaultID);
                    }}
                    Magnitude={selectedMag}
                    Duration={selectedDur}
                    Height={bodyHeight ?? 500}
                    Width={bodyWidth ?? 500}
                    Data={events}
                    SortField={sortField}
                    Ascending={ascending}
                    OnSort={(colKey) => {
                        if (colKey == sortField)
                            setAscending(!ascending);
                        else {
                            setSortField(colKey);
                            setAscending(true);
                        }
                    }}
                    LocalStorageKey={LocalStorageKey}
                />
            </>
        );

        if (!props.Settings.ShowCard)
            return (
                <div className="h-100 w-100" style={{ display: 'flex', flexDirection: "column", overflow: 'hidden' }} ref={bodyRef}>
                    {content}
                </div>
            );

        return (
            <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ? "Magnitude Duration Chart" : props.Title}
                </div>
                <div className="card-body p-0" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }} ref={bodyRef}>
                    {content}
                </div>
            </div>
        )
    }
}

export default DynamicMagDurChart;

function generateCurve(curve: OpenXDA.Types.MagDurCurve) {
    const pt = curve.Area.split(',');
    const cu = pt.map(point => { const s = point.trim().split(" "); return [parseFloat(s[0]), parseFloat(s[1])] as [number, number]; })
    return cu;
}

function CanAggregate(d1, d2, { XTransformation, YTransformation }) {
    const dx = XTransformation(d1.data[0]) - XTransformation(d2.data[0]);
    const dy = YTransformation(d1.data[1]) - YTransformation(d2.data[1]);
    const r = d1.radius + d2.radius;
    return (Math.pow(dx, 2) + Math.pow(dy, 2) < Math.pow(r, 2));
}

function IsSame(d1, d2) {
    return Math.abs(d1.data[0] - d2.data[0]) < 0.0001 && Math.abs(d1.data[1] - d2.data[1]) < 1E-10;
}
