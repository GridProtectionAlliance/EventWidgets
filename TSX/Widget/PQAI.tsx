//******************************************************************************************************
//  PQAI.tsx - Gbtc
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
//  11/10/2025 - G. Santos
//       Generated original version of source code.
//
//******************************************************************************************************

import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { SpacedColor } from '@gpa-gemstone/helper-functions';
import { ColorPicker, Input } from '@gpa-gemstone/react-forms';
import { CircleGroup, Plot } from '@gpa-gemstone/react-graph';
import { Column, Table } from '@gpa-gemstone/react-table';
import _ from 'lodash';
import React from 'react';
import { EventWidget } from '../global';

interface ISetting {
    Groups: IGroup[]
}

interface IGroup {
    Data: IDataPoint[],
    Label?: string,
    Identifier: string,
    Color: string
}

type IDataPoint = [number, number];


const PQAI: EventWidget.IWidget<ISetting> = {
    Name: 'PQAI',
    DefaultSettings: {
        Groups: []
    },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISetting>) => {
        const [selectedIndex, setSelectedIndex] = React.useState<number>(0);
        const [selectedFile, setSelectedFile] = React.useState<string>('');
        const [fileParseError, setFileParseError] = React.useState<boolean>(false);

        React.useEffect(() => {
            const e: string[] = [];
            props.Settings.Groups.forEach((group, index) => {
                if (group.Identifier == null || group.Identifier.length === 0)
                    e.push(`Identifier required for group ${index}`);
            });
            props.SetErrors(e);
        }, [props.Settings.Groups]);

        const isValid = React.useCallback((field: keyof IGroup) => {
            const record = props.Settings.Groups?.[selectedIndex];

            if (field === 'Identifier')
                return record?.Identifier != null && record?.Identifier?.length > 0;

            return true;

        }, [props.Settings.Groups, selectedIndex]);

        const setGroup = React.useCallback((record?: IGroup, index?: number) => {
            const newList = [...props.Settings.Groups];

            if (record == null) {
                if (index == null) {
                    console.error("Bad use of group setter callback, nullish record and index values.");
                    return;
                } else {
                    // Delete element
                    newList.splice(index, 1);
                }
            } else {
                if (index == null) {
                    // Add element
                    newList.push(record);
                } else {
                    // Modifiy element
                    newList.splice(index, 1, record);
                }
            }
            props.SetSettings({ ...props.Settings, Groups: newList });
        }, [props.SetSettings, props.Settings]);

        const setDatum = React.useCallback((datum?: IDataPoint, index?: number) => {
            const newRecord = { ...props.Settings.Groups?.[selectedIndex] };
            const data = [...newRecord.Data];

            if (datum == null) {
                if (index == null) {
                    console.error("Bad use of data setter callback, nullish record and index values.");
                    return;
                } else {
                    // Delete element
                    data.splice(index, 1);
                }
            } else {
                if (index == null) {
                    // Add element
                    data.push(datum);
                } else {
                    // Modifiy element
                    data.splice(index, 1, datum);
                }
            }

            newRecord.Data = data;
            setGroup(newRecord, selectedIndex);
        }, [props.Settings.Groups, selectedIndex, setGroup]);

        const handleFile = React.useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
            console.log("yeet");
            const handler = () => {
                if (evt.target.value == null) return false;
                let fileName = evt.target.value.split("\\").pop();
                if (fileName == "") return false;

                setSelectedFile(fileName);

                //Retrieve the first (and only!) File from the FileList object
                var f = evt.target.files[0];

                if (!f) return false;

                let r = new FileReader();
                let failure = false;
                r.onload = (e) => {
                    const lines = new TextDecoder('utf-8')
                        .decode(e.target.result as ArrayBuffer)
                        .split('\n')
                        .slice(1); // skip header line

                    if (lines.length <= 0)
                        failure = true;
                    else {
                        const points: [number, number][] = lines.map(line => {
                            const data = line.split(',');
                            if (data.length < 2) {
                                failure = true;
                                return [NaN, NaN];
                            }
                            else
                                return [parseInt(data[0]), parseInt(data[1])];
                        });
                        if (!failure) {
                            const newRecord = { ...props.Settings.Groups?.[selectedIndex] };
                            newRecord.Data = points;
                            setGroup(newRecord, selectedIndex)
                        }
                    }
                }
                r.readAsArrayBuffer(f);
                return failure;
            }

            const failure = handler();
            setFileParseError(failure);
        }, [props.Settings.Groups, selectedIndex, setGroup]);

        const displayedGroup = React.useMemo(() => 
            [props.Settings.Groups?.[selectedIndex]]
        , [props.Settings.Groups, selectedIndex])

        return (
            <div className="row">
                <div className="col-4" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div className="row">
                        <button
                            className={"btn btn-block btn-info"}
                            onClick={() => setGroup({ Color: SpacedColor(1, 0.5), Data: [], Label: null, Identifier: null })}
                        >Add New Group</button>
                    </div>
                    <Table<IGroup>
                        Data={props.Settings.Groups}
                        SortKey={''}
                        Ascending={false}
                        OnSort={() => { /* do nothing */ }}
                        KeySelector={(_, i) => i}
                        OnClick={({index}) => setSelectedIndex(index)}
                        Selected={(_, index) => index === selectedIndex}
                    >
                        <Column<IGroup>
                            Key={"Label"}
                            Field={"Label"}
                            Content={row => row.item.Label ?? row.item.Identifier}
                        >Label</Column>
                        <Column<IGroup>
                            Key={"Data"}
                            Field={"Data"}
                            Content={row => row.item.Data.length}
                        ># of Points</Column>
                    </Table>
                </div>
                <div className="col-4" style={{display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {props.Settings.Groups?.[selectedIndex] == null ? null :
                        <>
                            <div className="row">
                                <div className="col-6">
                                    <Input<IGroup>
                                        Valid={isValid}
                                        Record={props.Settings.Groups[selectedIndex]}
                                        Field={"Label"}
                                        Setter={record => setGroup(record, selectedIndex)}
                                    />
                                </div>
                                <div className="col-6">
                                    <Input<IGroup>
                                        Valid={isValid}
                                        Record={props.Settings.Groups[selectedIndex]}
                                        Field={"Identifier"}
                                        Setter={record => setGroup(record, selectedIndex)}
                                    />
                                </div>
                            </div>
                            <div className="row">
                                <div className="col">
                                    <div className="form-group" style={{ width: '100%' }}>
                                        <div className="custom-file">
                                            <input
                                                type="file"
                                                className="custom-file-input"
                                                onChange={handleFile}
                                            />
                                            <label className={"custom-file-label" + (selectedFile.length > 0 ? " selected" : "")} > {selectedFile.length > 0 ? selectedFile : `Upload CSV`}</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Table<IDataPoint>
                                Data={props.Settings.Groups[selectedIndex].Data}
                                SortKey={''}
                                Ascending={false}
                                OnSort={() => { /* do nothing */ }}
                                KeySelector={(_, i) => i}>
                                <Column<IDataPoint>
                                    Key={"PCA1"}
                                    Content={row => (
                                        <Input<IDataPoint>
                                            Valid={() => true}
                                            Label={null}
                                            Type={"number"}
                                            Record={row.item}
                                            Field={0}
                                            Setter={point => setDatum(point, row.index)}
                                        />
                                    )}
                                >PCA 1</Column>
                                <Column<IDataPoint>
                                    Key={"PCA2"}
                                    Content={row => (
                                        <Input<IDataPoint>
                                            Valid={() => true}
                                            Label={null}
                                            Type={"number"}
                                            Record={row.item}
                                            Field={1}
                                            Setter={point => setDatum(point, row.index)}
                                        />
                                    )}
                                >PCA 2</Column>
                                <Column<IDataPoint>
                                    Key={"delete"}
                                    Content={row => (
                                        <button
                                            className={"btn btn-sm"}
                                            onClick={() => setDatum(null, row.index)}
                                        >
                                            <span>
                                                <ReactIcons.TrashCan Color="var(--danger)" Size={20} />
                                            </span>
                                        </button>
                                    )}
                                ><></></Column>
                            </Table>
                            <div className="row">
                                <button
                                    className={"btn btn-block btn-info"}
                                    onClick={() => setDatum([0,0])}
                                >Add Data Point</button>
                            </div>
                        </>
                    }
                </div>
                <div className="col-4" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    {props.Settings.Groups?.[selectedIndex] == null ? null :
                        <>
                            <div className="row">
                                <div className="col-6">
                                    <ColorPicker
                                        Record={props.Settings.Groups[selectedIndex]}
                                        Field={"Color"}
                                        Setter={record => setGroup(record, selectedIndex)}
                                        Label={"Color"}
                                    />
                                </div>
                                <div className="col-6 mt-auto mb-auto">
                                    <button
                                        className={"btn btn-block btn-danger"}
                                        onClick={() => setGroup(null, selectedIndex)}
                                    >Remove Group</button>
                                </div>
                            </div>
                            <div className="row w-100">
                                <PlotComponent ShowLegend={false} Groups={displayedGroup}/>
                            </div>
                        </>
                    }
                </div>
            </div>
        );
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        return null;
    }
}

const legendWidth = 150;
interface IPlotProps {
    ShowLegend: boolean
    Groups: IGroup[]
}
interface IEnabled {
    [key: string]: boolean
}

function PlotComponent(props: IPlotProps) {
    const containerRef = React.useRef<HTMLTableSectionElement | undefined>(undefined);
    const [width, setWidth] = React.useState<number>(250);
    const [enabled, setEnabled] = React.useState<IEnabled>({});

    const defaultTDomain: [number, number] = React.useMemo(() => {
        const xValues = props.Groups
            .filter(group => enabled?.[group.Identifier] ?? false)
            .flatMap(group => group.Data)
            .map(point => point[0]);
        const min = Math.min(...xValues);
        const max = Math.max(...xValues);
        const margin = 0.1*(max-min)
        return [min - margin, max + margin];
    }, [enabled]);

    const defaultYDomain: [number, number] = React.useMemo(() => {
        const yValues = props.Groups
            .filter(group => enabled?.[group.Identifier] ?? false)
            .flatMap(group => group.Data)
            .map(point => point[1]);
        const min = Math.min(...yValues);
        const max = Math.max(...yValues);
        const margin = 0.1 * (max - min)
        return [min - margin, max + margin];
    }, [enabled]);

    React.useEffect(() => {
        let resizeObserver: ResizeObserver;
        const intervalHandle = setInterval(() => {
            if (containerRef?.current == null) return;
            resizeObserver = new ResizeObserver(
                _.debounce(() => {
                    if (containerRef.current == null) return;

                    // gets dims of div without rounding
                    const dims = containerRef.current?.getBoundingClientRect();
                    setWidth(dims.width ?? 250);
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
        const enabled: IEnabled = {};
        props.Groups.forEach(group =>
            enabled[group.Identifier] = enabled?.[group.Identifier] ?? true
        );
        setEnabled(enabled);
    }, [props.Groups]);

    return (
        <div className="card w-100">
            <div className="card-header fixed-top" style={{ position: "sticky", background: "#f7f7f7" }}>
                PQAI Analytic
            </div>
            <div className="card-body p-0" ref={containerRef}>
                <Plot
                    height={width + (props.ShowLegend ? legendWidth : 0)}
                    width={width}
                    showBorder={false}
                    showGrid={true}
                    yDomain={"Manual"}
                    XAxisType={"value"}
                    defaultTdomain={defaultTDomain}
                    defaultYdomain={defaultYDomain}
                    legend={props.ShowLegend ? "right" : "hidden"}
                    Tlabel={"PCA Component 1"}
                    Ylabel={"PCA Component 2"}
                    showMouse={false}
                    zoom={false}
                    pan={false}
                    useMetricFactors={false}
                >
                    {props.Groups
                        .filter(group => enabled?.[group.Identifier] ?? false)
                        .map((group, index) =>
                            <CircleGroup key={index} Data={group.Data} Color={group.Color} Legend={group.Label ?? group.Identifier} Opacity={0.25} />
                    )}
                </Plot>
            </div>
        </div>
    );
}

export default PQAI;