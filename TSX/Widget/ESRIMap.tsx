//******************************************************************************************************
//  ESRIMap.tsx - Gbtc
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
//  02/27/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import leaflet from 'leaflet';
import { basemapLayer, dynamicMapLayer } from 'esri-leaflet';
import moment from 'moment';
import { EventWidget } from '../global';
import { Application } from '@gpa-gemstone/application-typings';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Select } from '@gpa-gemstone/react-forms';
import { Input } from '@gpa-gemstone/react-forms';

require("leaflet_css");
interface ILightningStrike {
    ID: number,
    Service: string,
    DisplayTime: string,
    Amplitude: number,
    Latitude: number,
    Longitude: number
}

interface ISettings {
    CenterLat: number,
    CenterLong: number,
    Zoom: number,
    transmissionLayerURL: string,
    safetyLayerURL: string,
    lscLayerURL: string,
}

const ESRIMap: EventWidget.IWidget<ISettings> = {
    Name: 'ESRIMap',
    DefaultSettings: {
        CenterLong: 35,
        CenterLat: -85,
        Zoom: 7,
        transmissionLayerURL: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Grid_Restricted_2/MapServer/`,
        safetyLayerURL: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Edit/safetyHazards/MapServer/`,
        lscLayerURL: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Station_Assets/MapServer/`
    },
    Settings: (props) => {
        return ( <>
         <div className="row">
            <div className="col">
                <Input<ISettings>
                    Record={props.Settings}
                    Field={'transmissionLayerURL'}
                    Help={'The URL for transmission layer in ESRIMap Widget.'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'Transmission layer URl'} />
                </div>
                 </div>
                <div className="row">
               
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'safetyLayerURL'}
                        Help={'The URL for safety layer in ESRIMap Widget.'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'Safety layer URl'} />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'lscLayerURL'}
                        Help={'The URL for lsc layer in ESRIMap Widget.'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'LSC layer URl'} />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'Zoom'}
                        Help={'The Zoom setting for ESRIMap widget. ex: 7'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'Zoom setting'} />
                </div>
            </div>
            <div className="row">
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'CenterLong'}
                        Help={'The Center (Longitude) setting for ESRIMap widget.'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'Center Longitude'} />
                </div>
                <div className="col">
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'CenterLat'}
                        Help={'The Center (Latitude) setting for ESRIMap widget.'}
                        Setter={(record) => props.SetSettings(record)}
                        Valid={() => true}
                        Label={'Center Latitude'} />
                </div>
         </div> </>
        )
    },
    Widget: (props: EventWidget.IWidgetProps<ISettings>) => {
        const map = React.useRef<leaflet.Map>(null);
        const div = React.useRef(null);
        const [status, setStatus] = React.useState<Application.Types.Status>('idle');
        const [lightningInfo, setLightningInfo] = React.useState<ILightningStrike[]>([]);
        const [faultInfo, setFaultInfo] = React.useState<Array<{ StationName: string, Inception: number, Latitude: number, Longitude: number, Distance: number, AssetName }>>([]);
        const [window, setWindow] = React.useState<number>(2);


        /* Get Lightning Info */
        React.useEffect(() => {
            setStatus("loading");
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/ESRIMap/GetLightningInfo/${props.EventID}/${window}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            }).done((d) => { setLightningInfo(d); setStatus("idle") }).fail(() => { setStatus("error") });
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [window, props.EventID])

        /* Get Fault Info */
        React.useEffect(() => {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FaultInformation/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true,
                error: function (response, ajaxOptions, thrownError) {
                    console.error('StringError: ' + ajaxOptions + '\n\nthrownError: ' + JSON.stringify(thrownError) + '\n\nResponse: ' + JSON.stringify(response));
                }
            }).done((d) => { setFaultInfo(d); });
            return () => {
                if (handle != null && handle.abort != null) handle.abort();
            }

        }, [props.EventID])

        /* Create map and add layers */
        React.useEffect(() => {
            if (div == null) return;
            const setting: ISettings = props.Settings == undefined ? ESRIMap.DefaultSettings : props.Settings;
            map.current = leaflet.map(div.current, { center: [setting.CenterLat, setting.CenterLong], zoom: setting.Zoom, });
            basemapLayer('Gray').addTo(map.current);

            const transmissionLayer = dynamicMapLayer({ url: '', opacity: 0.3, f: 'image' });
            transmissionLayer.options['url'] = setting.transmissionLayerURL;
            transmissionLayer.options['f'] = 'image';
            transmissionLayer.addTo(map.current);

            const safetyLayer = dynamicMapLayer({ url: ``, opacity: 1, f: 'image' });
            safetyLayer.options['url'] = setting.safetyLayerURL;
            safetyLayer.options['f'] = 'image';
            safetyLayer.addTo(map.current);

            const lscLayer = dynamicMapLayer({ url: ``, opacity: 0.3, f: 'image' });
            lscLayer.options['url'] = setting.lscLayerURL;
            lscLayer.options['f'] = 'image';
            lscLayer.addTo(map.current);


        }, [])

        /* Radar Current */
        React.useEffect(() => {
            if (faultInfo == null || faultInfo.length == 0) return;
            const time = moment(faultInfo[0]?.Inception);
            const timestring = time.utc().format('YYYY-MM-DDTHH') + ':' + (time.minutes() - time.minutes() % 5).toString();

            const radar_current = leaflet.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?time=" + timestring + '&', {
                layers: 'nexrad-n0r-wmst',
                format: 'image/png',
                transparent: true,
                opacity: 0.5,
                attribution: "Weather data © 2016 IEM Nexrad",
            });
            map.current.addLayer(radar_current);

            const fault_marker = leaflet.marker([faultInfo[0]?.Latitude, faultInfo[0]?.Longitude]).addTo(map.current);

            return () => {
                map.current.removeLayer(radar_current);
                map.current.removeLayer(fault_marker);
            }

        }, [faultInfo]);

        /* Lightning Info */
        React.useEffect(() => {
            if (lightningInfo.length == 0) return;

            const lightningIcon = leaflet.icon({
                iconUrl: props.HomePath + 'Images/lightning.png',
                iconSize: [20, 25]
            });

            for (let i = 0; i < lightningInfo.length; i++)
                leaflet.marker([lightningInfo[i].Latitude, lightningInfo[i].Longitude], { icon: lightningIcon }).addTo(map.current);

            return () => {
                /* Implement cleanup function */
            }
        }, [lightningInfo])

        /* Line Geometries */
        React.useEffect(() => {

            const handle = $.ajax({
                type: 'GET',
                url: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Grid_Restricted_2/MapServer/6/query?` + encodeURI(`f=json&where=UPPER(LINENAME) like '%${faultInfo[0]?.AssetName.toUpperCase()}%'&returnGeometry=true&outfiels=LINENAME`),
                contentType: "application/json; charset=utf-8",
                cache: false,
                async: true

            }).done(lineGeometeries => {
                const params = {
                    f: 'json',
                    unionResults: true,
                    geodesic: false,
                    distances: 0.5,
                    geometries: JSON.stringify({ geometryType: "esriGeometryPolyline", geometries: JSON.parse(lineGeometeries).features.map(a => a.geometry) }),
                    inSR: 102100,
                    unit: 9093
                }

                $.ajax({
                    type: 'POST',
                    url: 'http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/Utilities/Geometry/GeometryServer/buffer',
                    data: params,
                    dataType: 'application/json',
                    cache: false,
                    async: true
                }).always(rsp => {
                    const buffer = leaflet.Proj.geoJson(poly(JSON.parse(rsp.responseText).geometries[0]), {
                        style: function (feature) {
                            return { color: feature.properties.color, opacity: feature.properties.opacity };
                        }
                    });

                    buffer.addTo(map.current);
                    map.current.fitBounds(buffer.getBounds());
                });

            })
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [faultInfo])

        /*
         * TODO: 
         * Lightning Info useEffect -> need to figure out cleanup function
         * add faultInfo if statement to Radar Current useEffect -> DONE
        */

        function poly(geometry): any {
            const outPut = {
                "type": "FeatureCollection",
                "features": []
            };
            //first we check for some easy cases, like if their is only one ring
            if (geometry.rings.length === 1) {
                outPut.features.push({ type: 'Feature', properties: { color: 'black', opacity: 1 }, geometry: { "type": "Polygon", "coordinates": geometry.rings }, crs: { type: "name", properties: { name: "EPSG:3857" } } });
            } else {
                /*if it isn't that easy then we have to start checking ring direction, basically the ring goes clockwise its part of the polygon, if it goes counterclockwise it is a hole in the polygon, but geojson does it by haveing an array with the first element be the polygons and the next elements being holes in it*/
                const ccc = dP(geometry.rings);
                const d = ccc[0];
                const dd = ccc[1];
                const r = [];
                if (dd.length === 0) {
                    /*if their are no holes we don't need to worry about this, but do need to stuck each ring inside its own array*/
                    const l2 = d.length;
                    let i3 = 0;
                    while (l2 > i3) {
                        r.push([d[i3]]);
                        i3++;
                    }
                    outPut.features.push({ type: 'Feature', properties: { color: 'black', opacity: 1 }, geometry: { "type": "MultiPolygon", "coordinates": r }, crs: { type: "name", properties: { name: "EPSG:3857" } } });
                } else if (d.length === 1) {
                    /*if their is only one clockwise ring then we know all holes are in that poly*/
                    dd.unshift(d[0]);
                    outPut.features.push({ type: 'Feature', properties: { color: 'black', opacity: 1 }, geometry: { "type": "Polygon", "coordinates": dd }, crs: { type: "name", properties: { name: "EPSG:3857" } } });

                } else {
                    /*if their are multiple rings and holes we have no way of knowing which belong to which without looking at it specially, so just dump the coordinates and add  a hole field, this may cause errors*/
                    outPut.features.push({ type: 'Feature', properties: { color: 'black', opacity: 1 }, geometry: { "type": "MultiPolygon", "coordinates": d, "holes": dd }, crs: { type: "name", properties: { name: "EPSG:3857" } } });
                }

            }

            return outPut
        }

        function dP(a) {
            //returns an array of 2 arrays, the first being all the clockwise ones, the second counter clockwise
            const d = [];
            const dd = [];
            const l = a.length;
            let ii = 0;
            while (l > ii) {
                if (c(a[ii])) {
                    d.push(a[ii]);
                } else {
                    dd.push(a[ii]);
                }
                ii++;
            }
            return [d, dd];
        }

        function c(a) {
            //return true if clockwise
            const l = a.length - 1;
            let i = 0;
            let o = 0;

            while (l > i) {
                o += (a[i][0] * a[i + 1][1] - a[i + 1][0] * a[i][1]);

                i++;
            }
            return o <= 0;
        }

        return (
            <div className="card" style={{ maxHeight: props.MaxHeight ?? '50vh' }}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    ESRI Map
                    <div className='pull-right'>
                        <div className="form-inline">
                            <Select
                                Record={{ window }}
                                Field='window'
                                Options={[
                                    { Value: "2", Label: "+/- 2 sec" },
                                    { Value: "5", Label: "+/- 5 sec" },
                                    { Value: "10", Label: "+/- 10 sec" },
                                    { Value: "20", Label: "+/- 20 sec" },
                                    { Value: "30", Label: "+/- 30 sec" },
                                    { Value: "60", Label: "+/- 60 sec" }
                                ]}
                                Setter={(record) => setWindow((record.window))}
                                Label="Time Window (secs)"
                            />
                        </div>
                    </div>
                </div>
                <link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css" />
                <div className="row">
                    <div className="col">
                        <div ref={div} style={{ height: 400, padding: 5, border: 'solid 1px gray' }}></div>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        {(status == 'loading' ? <span>Searching...</span> : null)}
                        {(status == 'error' ? <span>An error occurred</span> : null)}
                        {(lightningInfo.length == 0 ? <span>No Lightning Records Found</span> : null)}
                        <Table<ILightningStrike>
                            TableClass="table table-hover"
                            KeySelector={(item) => item.ID}
                            Data={lightningInfo}
                            SortKey={''}
                            Ascending={true}
                            OnSort={() => {/*Do Nothing*/ }}
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            TbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ display: 'table', tableLayout: 'fixed', width: 'calc(100%)' }}
                            Selected={() => false}
                        >
                            <Column<ILightningStrike>
                                Key={'Service'}
                                AllowSort={false}
                                Field={'Service'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Service
                            </Column>
                            <Column<ILightningStrike>
                                Key={'DisplayTime'}
                                AllowSort={false}
                                Field={'DisplayTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Time
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Amplitude'}
                                AllowSort={false}
                                Field={'Amplitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Amplitude
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Latitude'}
                                AllowSort={false}
                                Field={'Latitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Latitude
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Longitude'}
                                AllowSort={false}
                                Field={'Longitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Longitude
                            </Column>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
}

export default ESRIMap;