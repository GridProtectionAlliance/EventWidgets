//******************************************************************************************************
//  PQICurves.tsx - Gbtc
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
//  08/31/2023 - PQI Curves
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { Plot, Line } from '@gpa-gemstone/react-graph';
import { useGetContainerPosition } from "@gpa-gemstone/helper-functions";
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

interface ICurve {
    Name: string,
    Data: number[][]
}

const baseColors = ["#A30000", "#0029A3", "#007A29", "#d3d3d3", "#edc240",
    "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed", "#BD9B33", "#EE2E2F",
    "#008C48", "#185AA9", "#F47D23", "#662C91", "#A21D21", "#B43894",
    "#737373"]

const PQICurves: EventWidget.IWidget<{}> = {
    Name: 'PQICurves',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const containerRef = React.useRef<HTMLDivElement | null>(null);
        const { width, height } = useGetContainerPosition(containerRef);

        const [curves, setCurves] = React.useState<ICurve[]>([]);
        const [maxV, setMaxV] = React.useState<number>(1);
        const [hasPQIData, setHasPQIData] = React.useState<boolean | undefined>(undefined);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setStatus('loading');
            setCurves([]);
            setHasPQIData(undefined);

            let curveHandle: JQuery.jqXHR<any[]> | undefined;
            const availabilityHandle = getHasPQIData(props.HomePath, props.EventID);

            availabilityHandle.done((available) => {
                setHasPQIData(available);

                if (!available) {
                    setStatus('idle');
                    return;
                }

                curveHandle = getCurves(props.HomePath, props.EventID);
                curveHandle.done(data => {
                    setCurves(data.map((c: any) => ({ Name: c['m_Item1']['Name'] as string, Data: c['m_Item2'].map(p => [p['X'] as number, p['Y'] / (c['m_Item1']['NominalVoltage'] ?? 1) as number]) })));
                    setStatus('idle');
                }).fail(() => setStatus('error'));
            }).fail(() => setStatus('error'));

            return function () {
                if (availabilityHandle?.abort != null)
                    availabilityHandle.abort();
                if (curveHandle?.abort != null)
                    curveHandle.abort();
            }
        }, [props.EventID, props.HomePath]);

        React.useEffect(() => {
            if (curves.length > 0)
                setMaxV(1.1 * Math.max(...curves.map(c => Math.max(...c.Data.map(p => p[1])))))
        }, [curves]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    PQI Impacted Curves:
                </div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching PQI data. Please check System Center for more details.
                        </Alert>
                    : null}
                    {status === 'loading' || status === 'uninitiated' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : status === 'error' ? null
                            : hasPQIData === false ?
                                <Alert Class='alert-info'>
                                    PQI does not have data for this event.
                                </Alert>
                                : curves.length === 0 ?
                                    <Alert Class='alert-info'>
                                        No PQI curve data.
                                    </Alert>
                                    :
                                    <div className="row m-0">
                                        <div className="col-12 p-0" ref={containerRef} style={{ height: props.MaxHeight - 100 }}>
                                            <Plot
                                                height={props.MaxHeight - 100}
                                                width={width}
                                                showBorder={false}
                                                defaultTdomain={[0.00001, 1000]}
                                                defaultYdomain={[0, maxV]}
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
                                                zoom={true} pan={true}
                                                useMetricFactors={false}
                                                XAxisType={'log'}
                                                onSelect={() => { }}
                                            >
                                                {curves.map((c, i) =>
                                                    <Line
                                                        highlightHover={false}
                                                        showPoints={false}
                                                        lineStyle={'-'}
                                                        color={baseColors[i % baseColors.length]}
                                                        data={c.Data as [number, number][]}
                                                        legend={c.Name}
                                                        key={i}
                                                        width={3}
                                                    />
                                                )}
                                            </Plot>
                                        </div>
                                    </div>
                    }
                </div>
            </div>
        );
    }
}

const getHasPQIData = (homePath: string, eventID: number) => {
    return $.ajax({
        type: 'POST',
        url: `${homePath}api/EventWidgets/PQI/HasPQIData`,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ EventID: eventID }),
        dataType: 'json',
        cache: true,
        async: true
    }) as JQuery.jqXHR<boolean>;
}

const getCurves = (homePath: string, eventID: number) => {
    return $.ajax({
        type: 'POST',
        url: `${homePath}api/EventWidgets/PQI/GetCurves`,
        contentType: 'application/json; charset=utf-8',
        data: JSON.stringify({ EventID: eventID }),
        dataType: 'json',
        cache: true,
        async: true
    }) as JQuery.jqXHR<any[]>;
}

export default PQICurves;
