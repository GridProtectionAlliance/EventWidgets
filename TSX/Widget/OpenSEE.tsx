//******************************************************************************************************
//  EventSearchOpenSEE.tsx - Gbtc
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
//  03/03/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************
import { Line, Plot } from '@gpa-gemstone/react-graph';
import React from 'react';
import { EventWidget } from '../global';
import { Input } from '@gpa-gemstone/react-forms';
import { useGetContainerPosition } from "@gpa-gemstone/helper-functions";
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';

interface ISeries {
    label: string,
    color: string,
    data: [number, number][]
}

interface IPartialOpenseeSettings {
    Colors: {
        Va: string,
        Vb: string,
        Vc: string,
        Vn: string,
        Vab: string,
        Vbc: string,
        Vca: string,
        Ia: string,
        Ib: string,
        Ic: string,
        Ires: string,
        In: string,
        random: string
    }
}

const defaultSettings: IPartialOpenseeSettings = {
    Colors: {
        Va: "#A30000",
        Vb: "#0029A3",
        Vc: "#007A29",
        Vn: "#d3d3d3",
        Vab: "#A30000",
        Vbc: "#0029A3",
        Vca: "#007A29",
        Ia: "#FF0000",
        Ib: "#0066CC",
        Ic: "#33CC33",
        Ires: "#d3d3d3",
        In: "#d3d3d3",
        random: "#4287f5"
    }
}

interface ISetting {
    OpenSeeUrl: string
}

const plotHeight = 250;
const legendLabelPadding = '\u00A0'.repeat(5);

const EventSearchOpenSEE: EventWidget.IWidget<ISetting> = {
    Name: 'OpenSEE',
    DefaultSettings: { OpenSeeUrl: 'http://opensee.demo.gridprotectionalliance.org' },
    Settings: (props) => {
        return <div className="row">
            <div className="col">
                <Input<ISetting>
                    Record={props.Settings}
                    Field={'OpenSeeUrl'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'openSEE URL'}
                />
            </div>
        </div>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const plotRef = React.useRef<HTMLDivElement | null>(null);
        const { width } = useGetContainerPosition(plotRef);
        const legendWidth = useGetLegendWidth(width);

        const [VData, setVData] = React.useState<ISeries[]>([]);
        const [vDataStatus, setVDataStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [VLim, setVLim] = React.useState<[number, number]>([0, 100]);
        const [IData, setIData] = React.useState<ISeries[]>([]);
        const [iDataStatus, setIDataStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [ILim, setILim] = React.useState<[number, number]>([0, 100]);
        const [TCEData, setTCEData] = React.useState<ISeries[]>([]);
        const [tceDataStatus, setTCEDataStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [TCELim, setTCELim] = React.useState<[number, number]>([0, 100]);

        const [openSeeSettings, setOpenSeeSettings] = React.useState<IPartialOpenseeSettings | null>(null);

        React.useEffect(() => { setOpenSeeSettings(loadSettings()) }, [])

        //Effect to get openSEE data
        React.useEffect(() => {
            setVDataStatus('loading');
            const Vhandle = GetData('Voltage', props.HomePath, props.EventID.toString());

            Vhandle.done((d) => {
                setVData(toSeries(d));
                setVDataStatus('idle');
            }).fail(() => {
                setVDataStatus('error');
            });

            setIDataStatus('loading');
            const Ihandle = GetData('Current', props.HomePath, props.EventID.toString());

            Ihandle.done((d) => {
                setIData(toSeries(d));
                setIDataStatus('idle');
            }).fail(() => {
                setIDataStatus('error');
            });

            setTCEDataStatus('loading');
            const TCEhandle = GetData('TripCoilCurrent', props.HomePath, props.EventID.toString());

            TCEhandle.done((d) => {
                setTCEData(toSeries(d));
                setTCEDataStatus('idle');
            }).fail(() => {
                setTCEDataStatus('error');
            });

            return () => {
                if (Vhandle != null && Vhandle.abort != null)
                    Vhandle.abort();
                if (Ihandle != null && Ihandle.abort != null)
                    Ihandle.abort();
                if (TCEhandle != null && TCEhandle.abort != null)
                    TCEhandle.abort();
            }
        }, [props.EventID, props.HomePath]);

        //These three effects below are deriving lims from data we already own, these per react docs should be turned into memo values
        React.useEffect(() => {
            let min = 0;
            let max = 100;
            if (VData.length > 0) {
                min = Math.min(...VData.map((d) => d.data[0][0]));
                max = Math.max(...VData.map((d) => d.data[d.data.length - 1][0]));
            }
            setVLim([min, max])
        }, [VData]);

        React.useEffect(() => {
            let min = 0;
            let max = 100;
            if (IData.length > 0) {
                min = Math.min(...IData.map((d) => d.data[0][0]));
                max = Math.max(...IData.map((d) => d.data[d.data.length - 1][0]));
            }
            setILim([min, max])
        }, [IData]);

        React.useEffect(() => {
            let min = 0;
            let max = 100;
            if (TCEData.length > 0) {
                min = Math.min(...TCEData.map((d) => d.data[0][0]));
                max = Math.max(...TCEData.map((d) => d.data[d.data.length - 1][0]));
            }
            setTCELim([min, max])
        }, [TCEData])

        const isLoading = vDataStatus === 'loading' || iDataStatus === 'loading' || tceDataStatus === 'loading';

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    <a href={props.Settings.OpenSeeUrl + '?eventid=' + props.EventID} target="_blank">
                        View in openSEE
                    </a>
                </div>
                <div className="card-body p-0">
                    {isLoading ?
                        <div className="d-flex justify-content-center align-items-center" style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div> :
                        <div className="row m-0">
                            <div className="col-12 p-0" ref={plotRef}>
                                {VData.length > 0 ?
                                    <Plot
                                        height={plotHeight}
                                        width={width}
                                        showBorder={false}
                                        yDomain={'AutoValue'}
                                        legendWidth={legendWidth}
                                        defaultTdomain={VLim}
                                        legend={'right'}
                                        Tlabel={'Time'}
                                        Ylabel={'Voltage (V)'}
                                        showMouse={false}
                                        zoom={false}
                                        pan={false}
                                        useMetricFactors={false}
                                    >
                                        {VData.map((s, i) =>
                                            <Line
                                                highlightHover={false}
                                                showPoints={false}
                                                lineStyle={'-'}
                                                color={getColor(s.label, openSeeSettings)}
                                                data={s.data}
                                                legend={s.label + legendLabelPadding}
                                                key={i}
                                            />
                                        )}
                                    </Plot> : null}
                                {IData.length > 0 ?
                                    <Plot
                                        height={plotHeight}
                                        width={width}
                                        showBorder={false}
                                        defaultTdomain={ILim}
                                        yDomain={'AutoValue'}
                                        legendWidth={legendWidth}
                                        legend={'right'}
                                        Tlabel={'Time'}
                                        Ylabel={'Current (A)'}
                                        showMouse={false}
                                        zoom={false}
                                        pan={false}
                                        useMetricFactors={false}
                                    >
                                        {IData.map((s, i) =>
                                            <Line
                                                highlightHover={false}
                                                showPoints={false}
                                                lineStyle={'-'}
                                                color={getColor(s.label, openSeeSettings)}
                                                data={s.data}
                                                legend={s.label + legendLabelPadding}
                                                key={i}
                                            />
                                        )}
                                    </Plot> : null}
                                {TCEData.length > 0 ?
                                    <Plot
                                        height={plotHeight}
                                        width={width}
                                        showBorder={false}
                                        defaultTdomain={TCELim}
                                        legendWidth={legendWidth}
                                        yDomain={'AutoValue'}
                                        legend={'right'}
                                        Tlabel={'Time'}
                                        Ylabel={'Trip Coil Current (A)'}
                                        showMouse={false}
                                        zoom={false}
                                        pan={false}
                                        useMetricFactors={false}
                                    >
                                        {TCEData.map((s, i) =>
                                            <Line
                                                highlightHover={false}
                                                showPoints={false}
                                                lineStyle={'-'}
                                                color={getColor(s.label, openSeeSettings)}
                                                data={s.data}
                                                legend={s.label + legendLabelPadding}
                                                key={i}
                                            />
                                        )}
                                    </Plot> : null}
                            </div>
                        </div>
                    }
                </div>
            </div>
        )
    }
}

const toSeries = (data: Record<string, [number, number][]>): ISeries[] =>
    Object.keys(data).map((label) => ({ label, data: data[label], color: '#ff0000' }));

const getColor = (label: string, openSeeSettings: IPartialOpenseeSettings | null) => {
    const settings = openSeeSettings ?? defaultSettings;

    if (label.indexOf('VA') >= 0) return settings.Colors.Va;
    if (label.indexOf('VB') >= 0) return settings.Colors.Vb;
    if (label.indexOf('VC') >= 0) return settings.Colors.Vc;
    if (label.indexOf('VN') >= 0) return settings.Colors.Vn;
    if (label.indexOf('IA') >= 0) return settings.Colors.Ia;
    if (label.indexOf('IB') >= 0) return settings.Colors.Ib;
    if (label.indexOf('IC') >= 0) return settings.Colors.Ic;
    if (label.indexOf('IR') >= 0) return settings.Colors.Ires;

    return settings.Colors.random;
}

const loadSettings = (): IPartialOpenseeSettings => {
    try {
        const serializedState = localStorage.getItem('openSee.Settings');
        if (serializedState === null)
            return defaultSettings;

        // overwrite options if new options are available
        const state: IPartialOpenseeSettings = JSON.parse(serializedState);

        Object.keys(defaultSettings.Colors).forEach((key) => {
            if (state.Colors[key] == undefined)
                state.Colors[key] = defaultSettings.Colors[key];
        });

        return state;
    } catch (err) {
        return defaultSettings;
    }
}

const useGetLegendWidth = (plotWidth: number, percent = .15) => {
    const legendWidth = React.useMemo(() => {
        const newLegendWidth = plotWidth * (percent ?? .15);
        if (newLegendWidth < 100) return 100

        return Math.ceil(newLegendWidth)
    }, [plotWidth, percent])

    return legendWidth;
}

const GetData = (type: ('Voltage' | 'Current' | 'TripCoilCurrent'), homePath: string, EventID: string) => {
    return $.ajax({
        type: "POST",
        url: `${homePath}api/EventWidgets/OpenSEE/GetData/${type}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
            EventID: EventID,
        }),
        cache: false,
        async: true
    })
}

export default EventSearchOpenSEE;
