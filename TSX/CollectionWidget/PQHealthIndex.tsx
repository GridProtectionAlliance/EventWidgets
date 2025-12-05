//******************************************************************************************************
//  PQHealthIndex.tsx - Gbtc
//
//  Copyright � 2023, Grid Protection Alliance.  All Rights Reserved.
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
//  10/23/2025 - G. Santos
//       Generated original version of source code.
//
//******************************************************************************************************

import { Input, MultiSearchableSelect, Select } from '@gpa-gemstone/react-forms';
import { Infobox, Line, Plot, BarAggregate, Legend, DataLegend, HorizontalMarker } from '@gpa-gemstone/react-graph';
import _ from 'lodash';
import queryString from 'querystring';
import React from 'react';
import { EventWidget } from '../global';
import { Application, Gemstone, OpenXDA, PQI } from '@gpa-gemstone/application-typings';
import { GetColor } from '@gpa-gemstone/helper-functions';
import moment from 'moment';
import { Alert, LoadingIcon, Modal } from '@gpa-gemstone/react-interactive';

const spiderDictionary = { cp95_val: "CP95", avg_val: "Avg", cp05_val: "CP05" }
const barDictionary = { max_val: "Max", cp95_val: "CP95", avg_val: "Avg", cp05_val: "CP05", min_val: "Min" }
const legendColorKeys = { Max: 21, CP95: 17, Avg: 15, CP05: 16, Min: 9, Threshold: 4 }
const radialLineColor = 3;

interface IPQHealthIndexData {
    eventtypedesc: string,
    min_val: number,
    avg_val: number,
    max_val: number
}

interface ISiteSearch {
    IDs: string[],
    Labels: string[]
}

interface IProcessedData {
    DataLines: {
        [key: string]: [number, number][]
    }
    BarData: {
        [key: string]: number[]
    }
    ScalarLines: {
        [key: number]: [number, number][]
    }
    RadialLines: {
        [key: string]: [number, number][],
    }
    Max: number
}

interface ISettings {
    PQHealthURL: string,
    AF_PQSiteField: string
}

interface IDimensions {
    Spider: { Height: number, Width: number }
    Bar: { Height: number, Width: number }
}

const PQHealthIndex: EventWidget.ICollectionWidget<ISettings> = {
    Name: 'PQHealthIndex',
    DefaultSettings: { PQHealthURL: 'http://pqihealth.demo.gridprotectionalliance.org', AF_PQSiteField: "PQIHealthSite" },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISettings>) => {

        return (
            <>
                <div className="row">
                    <div className='col'>
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'PQHealthURL'}
                        Setter={props.SetSettings}
                        Valid={() => true}
                        Label={'PQHealth API URL'} />
                        </div>
                </div>
                {/* ToDo: Change this to a select, grab additional field options that are searchable and belong to meter parent table as options.*/}
                <div className="row">
                    <div className='col'>
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'AF_PQSiteField'}
                            Setter={props.SetSettings}
                            Valid={() => true}
                            Label={'PQ Site Additional Field'}
                        />
                    </div>
                </div>
            </>
        );
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<ISettings>) => {
        const spiderRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
        const barRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
        const [data, setData] = React.useState<IProcessedData | undefined>(
            { Max: 1, RadialLines: {}, ScalarLines: {}, DataLines: {}, BarData: {} }
        );
        const [visible, setVisible] = React.useState<{ [key: string]: boolean }>(() => {
            const obj = {};
            Object.keys(legendColorKeys).forEach(key => obj[key] = true);
            return obj;
        });
        const [sites, setSites] = React.useState<ISiteSearch>({ IDs: [], Labels: [] });
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [showModal, setShowModal] = React.useState<boolean>(false);
        const [dimensions, setDimensions] = React.useState<IDimensions>({ Spider: { Width: 100, Height: 100 }, Bar: { Width: 100, Height: 100 } });

        const searchMeters = React.useCallback((search: string): Gemstone.TSX.Interfaces.AbortablePromise<Gemstone.TSX.Interfaces.ILabelValue<string>[]> => {
            return $.ajax({
                type: 'POST',
                url: `${props.HomePath}api/EventWidgets/Meter/PagedList/${0}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify({
                    Searches: [{
                        FieldName: 'Name',
                        SearchText: `*${search}*`,
                        Operator: 'LIKE',
                        Type: 'string',
                        IsPivotColumn: false
                    },
                    {
                        FieldName: props.Settings.AF_PQSiteField,
                        SearchText: '***',
                        Operator: 'LIKE',
                        Type: 'string',
                        IsPivotColumn: true
                    }],
                    OrderBy: "Name",
                    Ascending: true,
                    ReturnPivotCols: true
                }),
                cache: false,
                async: true
            }).then(result => {
                return JSON
                    .parse(result.Data as unknown as string)
                    .filter(meter => sites.IDs.findIndex(id => id === meter['AFV_' + props.Settings.AF_PQSiteField]) === -1)
                    .map((meter) => ({ Label: `${meter.Name} (${meter.AssetKey})`, Value: meter['AFV_' + props.Settings.AF_PQSiteField] }));
            });
        }, [props.HomePath, props.Settings.AF_PQSiteField, sites]);

        // Resize ref for graph dims
        React.useEffect(() => {
            let resizeObserver: ResizeObserver;
            const intervalHandle = setInterval(() => {
                if (spiderRef?.current == null) return;
                resizeObserver = new ResizeObserver(
                    _.debounce(() => {
                        if (spiderRef.current == null) return;
                        if (barRef.current == null) return;

                        // gets dims of div without rounding
                        const spiderDims = spiderRef.current?.getBoundingClientRect();
                        const barDims = barRef.current?.getBoundingClientRect();
                        const dim = (spiderDims.width ?? 0) < (spiderDims.height ?? 0) ? spiderDims.width : spiderDims.height;
                        setDimensions({
                            Spider: { Width: dim ?? 100, Height: dim ?? 100 },
                            Bar: { Width: barDims.width ?? 100, Height: barDims.height ?? 100 }
                        });
                    }, 100)
                );
                resizeObserver.observe(spiderRef.current);
                clearInterval(intervalHandle);
            }, 10);

            return () => {
                clearInterval(intervalHandle);
                if (resizeObserver != null && resizeObserver.disconnect != null) resizeObserver.disconnect();
            };
        }, []);

        React.useEffect(() => {
            const processedData: IProcessedData = {
                RadialLines: {}, Max: 0, ScalarLines: {}, DataLines: {}, BarData: {}
            };

            if (sites.IDs.length == 0) {
                setData(processedData);
                return;
            };

            const siteIds = sites.IDs.join(',');

            const q = queryString.stringify({
                startdate: moment.utc(props.CurrentFilter.TimeFilter.StartTime, OpenXDA.Consts.DateTimeFormat).format(PQI.Consts.DateTimeFormat),
                enddate: moment.utc(props.CurrentFilter.TimeFilter.EndTime, OpenXDA.Consts.DateTimeFormat).format(PQI.Consts.DateTimeFormat),
                siteids: siteIds
            }, "&", "=", { encodeURIComponent: queryString.escape });

            setStatus('loading');

            // ToDo: This does not respect setting currently, change it do to do post security update
            const handle = $.ajax({
                type: "POST",
                url: `${props.HomePath}api/EventWidgets/PQIHealth/reportsummary?${q}`,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify({
                    Site: props.Settings.PQHealthURL,
                }),
                dataType: 'json',
                cache: false,
                async: true
            });

            handle.then((rawData: string) => {
                const parsedData: IPQHealthIndexData[] = JSON.parse(rawData);

                /* HANDLING SPIDER PLOT */
                const unitVectors: { [key: string]: [number, number] } = {};
                // Create line around spider plot per level
                parsedData.forEach((datum, index) => {
                    const radialAngle = 2 * Math.PI * (index) / parsedData.length;
                    // This is backwards by design, we want to start with a verticle straight line up
                    unitVectors[datum.eventtypedesc] = [Math.sin(radialAngle), Math.cos(radialAngle)];
                    Object.keys(spiderDictionary).forEach(dataField => {
                        const dataKey = spiderDictionary[dataField];
                        const point = datum[dataField];
                        if (point != null)  {
                            if (processedData.DataLines[dataKey] == null) processedData.DataLines[dataKey] = [];
                            processedData.DataLines[dataKey].push([unitVectors[datum.eventtypedesc][0] * point, unitVectors[datum.eventtypedesc][1] * point]);
                        }
                    });
                    if (Math.ceil(datum.max_val) > processedData.Max)
                        processedData.Max = Math.ceil(datum.max_val);

                });
                // close the loop
                Object.keys(processedData.DataLines).forEach(key =>
                    processedData.DataLines[key].push(processedData.DataLines[key][0])
                );

                // Create guide lines (circular)
                const keys = Object.keys(unitVectors);
                for (let index = 1; index <= processedData.Max; index++) {
                    // Create line around spider plot per scalar visible
                    processedData.ScalarLines[index] = keys.map(key =>
                        [
                            unitVectors[key][0] * index,
                            unitVectors[key][1] * index
                        ]);
                    // Close guide line loop
                    processedData.ScalarLines[index].push(
                        [
                            unitVectors[keys[0]][0] * index,
                            unitVectors[keys[0]][1] * index
                        ]);
                }
                // Create radial lines
                keys.forEach(key => {
                    processedData.RadialLines[key] = [[0, 0], [
                        unitVectors[key][0] * processedData.Max,
                        unitVectors[key][1] * processedData.Max
                    ]];
                });

                /* HANDLING BAR CHART */
                parsedData.forEach((datum) => {
                    Object.keys(barDictionary).forEach(dataField => {
                        const dataKey = barDictionary[dataField];
                        if (datum[dataField] != null) {
                            if (processedData.BarData[dataKey] == null) processedData.BarData[dataKey] = [];
                            processedData.BarData[dataKey].push(datum[dataField]);
                        }
                    });
                    if (Math.ceil(datum.max_val) > processedData.Max)
                        processedData.Max = Math.ceil(datum.max_val);

                });
                setData(processedData);
                setStatus('idle')
            }, () => setStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); }
        }, [sites, props.CurrentFilter.TimeFilter]);

        return (
            <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ? "EPRI PQ Health Index" : props.Title}
                </div>
                <div className="card-body" style={{ flex: 1, overflow: 'hidden' }}>
                    <div className="row h-100" style={{ display: 'flex', overflow: 'hidden', flexDirection: "row" }}>
                        <div className="col-6 m-0 h-100" style={{ display: 'flex', overflow: 'hidden', flexDirection: "column" }}>
                            <div className="row m-0">
                                <button className="btn btn-sm btn-info" onClick={() =>setShowModal(true)}>
                                    {`Search Sites (${sites.IDs.length} selected)`}
                                </button>
                            </div>
                            {status === 'error' ?
                                <div className="row" style={{ padding: "5px 0 0 0" }}>
                                    <Alert Class='alert-danger'>Error retrieving index data.</Alert>
                                </div> :
                                <></>
                            }
                            {sites.IDs.length === 0 ?
                                <div className="row" style={{ padding: "5px 0 0 0" }}>
                                    <Alert Class='alert-info'>Select sites to get started.</Alert>
                                </div> :
                                <></>
                            }
                            <div className="row m-0" style={{ flex: 1, overflow: 'hidden' }} ref={spiderRef}>
                                <LoadingIcon Show={status === 'loading'} />
                                <Plot height={dimensions.Spider.Height} width={dimensions.Spider.Width} showBorder={false}
                                    yDomain={'Manual'}
                                    XAxisType={"value"}
                                    defaultTdomain={[-data.Max - 1, data.Max + 1]}
                                    defaultYdomain={[-data.Max - 1, data.Max + 1]}
                                    legend={'hidden'}
                                    showMouse={false}
                                    zoom={false}
                                    pan={false}
                                    hideYAxis={true}
                                    hideXAxis={true}
                                    defaultMouseMode={"select"}
                                    menuLocation={"hide"}
                                    useMetricFactors={false}>
                                    {Object.keys(data.ScalarLines).map(key =>
                                    (
                                        Number(key) === data.Max ? null :
                                            <Infobox key={`sinfo_${key}`} origin="lower-right" x={0} y={Number(key)} opacity={0} childId={`sinfoc_${key}`}>
                                                <div id={`sinfoc_${key}`} style={{
                                                    display: 'inline-block', background: `rgba(255, 255, 255, ${0})`, color: GetColor(radialLineColor),
                                                    overflow: 'visible', whiteSpace: 'pre-wrap', fontSize: `1em`
                                                }}>
                                                    {key}
                                                </div>
                                            </Infobox>
                                    )
                                    )}
                                    {Object.keys(data.ScalarLines).map(key =>
                                        (<Line data={data.ScalarLines[key]} color={(key === "1" && visible.Threshold) ? GetColor(legendColorKeys.Threshold) : GetColor(radialLineColor)} lineStyle={':'} showPoints={false} autoShowPoints={false} width={2} key={`scalar_${key}`} />)
                                    )}
                                    {Object.keys(data.RadialLines).map(key =>
                                    (
                                        <Infobox key={`rinfo_${key}`} origin={data.RadialLines[key][1][1] > 0 ? "lower-center" : "upper-center"}
                                            x={data.RadialLines[key][1][0]} y={data.RadialLines[key][1][1]} opacity={0} childId={`rinfoc_${key}`}>
                                            <div id={`rinfoc_${key}`} style={{
                                                display: 'inline-block', background: `rgba(255, 255, 255, ${0})`, color: "black",
                                                overflow: 'visible', whiteSpace: 'pre-wrap', fontSize: `1em`
                                            }}>
                                                {formatKey(key)}
                                            </div>
                                        </Infobox>
                                    )
                                    )}
                                    {Object.keys(data.RadialLines).map(key =>
                                        (<Line data={data.RadialLines[key]} color={GetColor(radialLineColor)} lineStyle={':'} showPoints={false} autoShowPoints={false} width={2} key={`radial_${key}`} />)
                                    )}
                                    {Object.keys(data.DataLines).map(key =>
                                        visible[key] ?
                                            <Line data={data.DataLines[key]} color={GetColor(legendColorKeys[key])} lineStyle={'-'} showPoints={true} highlightHover={true} key={`spider_${key}`} /> :
                                            null
                                    )}
                                </Plot>
                            </div>
                        </div>
                        <Legend
                            LegendElements={Object.keys(legendColorKeys).map(key =>
                            (<DataLegend color={GetColor(legendColorKeys[key])} legendSymbol={key === "Threshold" ? ":" : "-"} setEnabled={(e) => { setVisible(v => ({ ...v, [key]: e })) }}
                                hasNoData={false} label={key} enabled={visible[key]} id={key} />)
                            )}
                            height={dimensions.Bar.Height-20}
                            width={115}
                            orientation={'vertical'}
                        />
                        <div className="col h-100" style={{ flex: 1, overflow: 'hidden' }} ref={barRef}>
                            <Plot height={dimensions.Bar.Height-20} width={dimensions.Bar.Width-20} showBorder={false}
                                yDomain={'HalfAutoValue'}
                                XAxisType={"value"}
                                defaultTdomain={[0, Object.keys(data.BarData).filter(key => visible[key]).length]}
                                legend={'hidden'}
                                showMouse={false}
                                zoom={false}
                                pan={false}
                                showGrid={true}
                                hideYAxis={false}
                                hideXAxis={true}
                                defaultMouseMode={"select"}
                                menuLocation={"hide"}
                                useMetricFactors={false}
                            >
                                {visible?.Threshold != null && visible.Threshold ? 
                                    <HorizontalMarker Value={1} color={GetColor(legendColorKeys?.Threshold)} lineStyle={':'} width={5} /> :
                                    <></>
                                }
                                {Object.keys(data.BarData).filter(key => visible[key]).map((key, index) =>
                                    (<BarAggregate
                                        AggregationType={"min_max_avg"}
                                        Data={data.BarData[key]}
                                        BarOrigin={index}
                                        BarWidth={1}
                                        XBarOrigin={'left'}
                                        Color={GetColor(legendColorKeys[key])}
                                        StrokeColor={"black"}
                                        key={`bar_${key}`}
                                    />)
                                )}
                            </Plot>
                        </div>
                    </div>
                </div>
                <Modal Title={'Select PQ Sites'} CallBack={() => setShowModal(false)} Show={showModal} Size='lg' ShowCancel={false} ShowConfirm={false} ShowX={true}>
                    <MultiSearchableSelect<ISiteSearch> Label="Meters" AllowCustom={false} Search={searchMeters} Record={sites} Field={"Labels"}
                        Setter={(_obj, i, opt) => {
                            const newIds = [...sites.IDs];
                            const newLabels = [...sites.Labels];
                            if (opt == null) {
                                newIds.splice(i, 1);
                                newLabels.splice(i, 1);
                            } else if (i === newIds.length) {
                                newIds.push(opt.Value as string);
                                newLabels.push(opt.Label);
                            } else {
                                newIds.splice(i, 1, opt.Value as string);
                                newLabels.splice(i, 1, opt.Label);
                            }
                            setSites({ ...sites, IDs: newIds, Labels: newLabels });

                        }} DefaultValue={''} />
                </Modal>
            </div>
        );
    }
}

const formatKey = (key: string) => {
    let displayKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
    if (displayKey.length > 5) return displayKey.slice(0, 5) + ".";
    return displayKey
};

export default PQHealthIndex;