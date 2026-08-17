//******************************************************************************************************
//  ESRIMap.tsx - Gbtc
//
//  Copyright Â© 2020, Grid Protection Alliance.  All Rights Reserved.
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
import 'proj4leaflet';
import { basemapLayer, dynamicMapLayer, Geometry, query } from 'esri-leaflet';
import moment from 'moment';
import { EventWidget } from '../global';
import { Application } from '@gpa-gemstone/application-typings';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Select, ToggleSwitch } from '@gpa-gemstone/react-forms';
import { Input } from '@gpa-gemstone/react-forms';
import { Alert } from '@gpa-gemstone/react-interactive';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { buffer } from '@turf/turf';
import OAuthInfo from '@arcgis/core/identity/OAuthInfo';
import identityManager from '@arcgis/core/identity/IdentityManager';

require("leaflet_css");

interface ILightningStrike {
    ID: number,
    Service: string,
    DisplayTime: string,
    Amplitude: number,
    Latitude: number,
    Longitude: number
}

interface ILayerSetting {
    url: string,
    opacity: number,
    layertype: string,
    layer?: string
}

interface IFaultInfo {
    StationName: string,
    Inception: number,
    Latitude: number,
    Longitude: number,
    Distance: number,
    AssetName: string
}

interface ISettings {
    CenterLat: number,
    CenterLong: number,
    Zoom: number,
    Layers: ILayerSetting[],
    TransmissionLineLayer: string,
    ClientID: string,
    PortalURL: string,
    TransmissionLineQuery: string,
    UserAuthentication: boolean
}

const ESRIMap: EventWidget.IWidget<ISettings> = {
    Name: 'ESRIMap',
    DefaultSettings: {
        PortalURL: 'https://<host>:<port>/<webadaptor>',
        ClientID: '',
        CenterLong: 35,
        CenterLat: -85,
        Zoom: 6,
        Layers: [
            {
                url: `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?time={time}`,
                opacity: 0.5,
                layertype: 'wms',
                layer: 'nexrad-n0r-wmst',
            },
            {
                url: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Grid_Restricted_2/MapServer/`,
                opacity: 0.3,
                layertype: 'esri',
                layer: '6',
            },
            {
                url: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Edit/safetyHazards/MapServer/`,
                opacity: 0.3,
                layertype: 'esri',
                layer: undefined,
            },
            {
                url: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Station_Assets/MapServer/`,
                opacity: 0.3,
                layertype: 'esri',
                layer: undefined,
            }
        ],

        TransmissionLineLayer: `http://pq/arcgisproxynew/proxy.ashx?https://gis.tva.gov/arcgis/rest/services/EGIS_Transmission/Transmission_Grid_Restricted_2/MapServer/6`,
        TransmissionLineQuery: `UPPER(LINENAME) like '%{line}%'`,
        UserAuthentication: false

    },
    Settings: (props) => {
        return (
            <>
                <div className="row">
                    <div className={"col" + (props.Settings.UserAuthentication ? '-4' : '')}>
                        <ToggleSwitch<ISettings>
                            Record={props.Settings}
                            Field={'UserAuthentication'}
                            Help={'Enable or disable user authentication for ESRI requests.'}
                            Setter={(record) => props.SetSettings(record)}
                            Label={'User Authentication'}
                        />
                    </div>
                    {props.Settings.UserAuthentication ? <><div className="col-8">
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'ClientID'}
                            Help={'The App ID for ESRI user authentication. Note the callback URL must be set to the same domain as this application followed by /api/EventWidgets/ESRIMap/AuthCallback.'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'ESRI App ID'}
                        />
                    </div> <div className="col-8">
                            <Input<ISettings>
                                Record={props.Settings}
                                Field={'PortalURL'}
                                Help={'The portal URL for ESRI user authentication.'}
                                Setter={(record) => props.SetSettings(record)}
                                Valid={() => true}
                                Label={'ESRI Portal URL'}
                            />
                        </div> </> : null}
                </div>
                <div className="row">
                    <div className="col">
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'TransmissionLineLayer'}
                            Help={'The URL for transmission layer used to query lines and build buffer.'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'Transmission Line Layer'}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'TransmissionLineQuery'}
                            Help={'The Query used to query a specific Transmission Line. {0} gets replaced with the capitalized AssetKey'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'Transmission Line Query'}
                        />
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
                            Label={'Center Longitude'}
                            Type={'number'}
                        />
                    </div>
                    <div className="col">
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'CenterLat'}
                            Help={'The Center (Latitude) setting for ESRIMap widget.'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'Center Latitude'}
                            Type={'number'}
                        />
                    </div>
                    <div className="col">
                        <Input<ISettings>
                            Record={props.Settings}
                            Field={'Zoom'}
                            Help={'The default Zoom setting for map.'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'Default Zoom'}
                            Type={'number'}
                        />
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        {props.Settings.Layers?.map((layer, i) =>
                            <div className="row" style={{ background: '#f7f7f7' }} key={`layer_${i}`}>
                                <LayerSettings Layer={layer} SetLayer={(record) => {
                                    const layers = [...props.Settings.Layers];
                                    if (record === undefined)
                                        layers.splice(i, 1);
                                    else
                                        layers[i] = record;
                                    props.SetSettings({ ...props.Settings, Layers: layers });
                                }} Index={i} />
                            </div>
                        )}
                        <div className="row">
                            <div className="col" style={{ margin: 'auto' }}>
                                <button className="btn btn-primary" onClick={() => {
                                    props.SetSettings({
                                        ...props.Settings, Layers: [...props.Settings.Layers, {
                                            url: `https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?time={time}`,
                                            opacity: 0.5,
                                            layertype: 'wms',
                                            layer: 'nexrad-n0r-wmst',
                                        }]
                                    });
                                }}>
                                    Add Layer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    },
    Widget: (props: EventWidget.IWidgetProps<ISettings>) => {
        const map = React.useRef<leaflet.Map | null>(null);
        const div = React.useRef<HTMLDivElement | null>(null);
        const [status, setStatus] = React.useState<Application.Types.Status>('idle');
        const [lightningInfo, setLightningInfo] = React.useState<ILightningStrike[]>([]);
        const [faultInfo, setFaultInfo] = React.useState<IFaultInfo[]>([]);
        const [window, setWindow] = React.useState<number>(2);
        const [layerErrors, setLayerErrors] = React.useState<string[]>([]);
        const [authToken, setAuthToken] = React.useState<string>("");

        /* Get Lightning Info */
        React.useEffect(() => {
            setStatus("loading");
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/EventWidgets/ESRIMap/GetLightningInfo/${props.EventID}/${window}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            }).done((d) => {
                setLightningInfo(d);
                setStatus("idle")
            }).fail(() => {
                setStatus("error")
            });

            return () => {
                if (handle != null && handle.abort != null)
                    handle.abort();
            }
        }, [window, props.EventID])

        /* Handle ESRI Authentication */
        React.useEffect(() => {
            setAuthToken("");
            if (!props.Settings.UserAuthentication || props.Settings.ClientID.length === 0) return;

            const info = new OAuthInfo({
                appId: props.Settings.ClientID,
                portalUrl: props.Settings.PortalURL,
                popup: true,
                popupCallbackUrl: props.HomePath + 'api/EventWidgets/ESRIMap/AuthCallback'
            });

            identityManager.registerOAuthInfos([info]);
            identityManager.checkSignInStatus(props.Settings.PortalURL + "/sharing").then((credential) => {
                setAuthToken(credential.token);
            })
                .catch(() => {
                    identityManager.getCredential(info.portalUrl + "/sharing", {
                        oAuthPopupConfirmation: false,
                    }).then(() => {
                        identityManager.checkSignInStatus(props.Settings.PortalURL + "/sharing")
                            .then((credential) => {
                                setAuthToken(credential.token);
                            })
                    })
                });

        }, [props.Settings.UserAuthentication, props.Settings.ClientID, props.Settings.PortalURL]);

        /* Get Fault Info */
        React.useEffect(() => {
            //needs status handling
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/EventWidgets/FaultInformation/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true,
                error: function (response, ajaxOptions, thrownError) {
                    console.error('StringError: ' + ajaxOptions + '\n\nthrownError: ' + JSON.stringify(thrownError) + '\n\nResponse: ' + JSON.stringify(response));
                }
            }).done((d) => {
                setFaultInfo(d);
            });
            return () => {
                if (handle != null && handle.abort != null)
                    handle.abort();
            }

        }, [props.EventID])

        React.useEffect(() => {
            map.current = leaflet.map(div.current, { center: [props.Settings.CenterLat, props.Settings.CenterLong], zoom: props.Settings.Zoom });
            basemapLayer('Gray').addTo(map.current);

        }, []);

        /* Create map and map layers */
        React.useEffect(() => {
            if (div.current == null) return;
            const mapLayers: (leaflet.TileLayer.WMS | leaflet.esri.DynamicMapLayer)[] = [];
            const errors: string[] = [];

            props.Settings.Layers.forEach(layerOptions => {
                let url = resolveVars(layerOptions.url, faultInfo);

                if (layerOptions.layertype === 'wms') {
                    try {
                        const options = {
                            format: 'image/png',
                            transparent: true,
                            opacity: layerOptions.opacity,
                        };

                        if (layerOptions.layer != null)
                            options['layers'] = [layerOptions.layer];

                        const layer = leaflet.tileLayer.wms(url, options);
                        mapLayers.push(layer);
                        if (map.current != null)
                            map.current.addLayer(layer);
                    }
                    catch {
                        errors.push(url)
                    }

                }
                else if (layerOptions.layertype === 'esri') {
                    try {
                        const options = {
                            url: url,
                            opacity: layerOptions.opacity,
                            f: 'image'
                        }

                        if (layerOptions.layer != null)
                            options['layers'] = [layerOptions.layer];

                        if (authToken.trim().length > 0)
                            options['token'] = authToken;

                        const layer = dynamicMapLayer(options);
                        mapLayers.push(layer);
                        if (map.current != null)
                            map.current.addLayer(layer);
                    }
                    catch {
                        errors.push(url)
                    }
                }
            });

            setLayerErrors(errors);

            return (() => { mapLayers.forEach(layer => map.current?.removeLayer(layer)) });
        }, [faultInfo, authToken, props.Settings.Layers]);

        /* Adds fault marker  */
        React.useEffect(() => {
            if (faultInfo.length === 0 || map.current == null) return;

            const fault_marker = leaflet.marker([faultInfo[0]?.Latitude, faultInfo[0]?.Longitude]).addTo(map.current);

            return () => {
                map.current?.removeLayer(fault_marker);
            }

        }, [faultInfo]);

        /* Adds lightning markers */
        React.useEffect(() => {
            if (lightningInfo.length === 0 || map.current == null) return;

            const lightningIcon = leaflet.icon({
                iconUrl: props.HomePath + 'Images/lightning.png', // we should just use a lignting icon from reacticons for htis.. 
                iconSize: [20, 25]
            });

            const markers = lightningInfo.map(info =>
                leaflet.marker([info.Latitude, info.Longitude], { icon: lightningIcon }).addTo(map.current!));

            return () => {
                markers.forEach(marker => map.current?.removeLayer(marker));
            }
        }, [lightningInfo])

        /* Line Geometries */
        React.useEffect(() => {

            if (map.current == null) return;

            let bufferLayer: leaflet.GeoJSON<any> | null = null;

            let q = query({ url: props.Settings.TransmissionLineLayer })
            if (authToken.trim().length > 0)
                q = q.token(authToken);

            if (props.Settings.TransmissionLineQuery.length > 0)
                q = q.where(resolveVars(props.Settings.TransmissionLineQuery, faultInfo));

            //Ideally we add abort cleanup logic to this query
            q = q.run((error, featureCollection) => {
                if (error) {
                    console.error(error);
                    return;
                }

                const geojson = leaflet.geoJSON(featureCollection);
                const buffered = buffer(geojson.toGeoJSON() as GeoJSON.GeoJSON<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>, 0.5,
                    {
                        units: 'miles',
                    });

                if (buffered == null) return;

                console.log(buffered);
                if (map.current == null) return;
                bufferLayer = leaflet.geoJSON(buffered).addTo(map.current);
                map.current.fitBounds(bufferLayer.getBounds());
            });

            return () => {
                if (bufferLayer != null)
                    map.current?.removeLayer(bufferLayer);
            }

        }, [faultInfo, authToken, props.Settings.TransmissionLineLayer, props.Settings.TransmissionLineQuery]);

        return (
            <div className="card" style={{ maxHeight: props.MaxHeight ?? '50vh' }}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    <div className="row">
                        <div className="col-6 d-flex align-items-center">
                            ESRI Map
                        </div>
                        <div className="col-6 d-flex justify-content-end">
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
                                Style={{ marginBottom: 0 }}
                            />
                        </div>
                    </div>
                </div>
                <link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css" />
                {layerErrors.length > 0 ?
                    <div className="row">
                        <div className="col">
                            <Alert Class='alert-warning'>Unable to load the {layerErrors.length} map layers.</Alert>
                        </div>
                    </div> :
                    null
                }
                <div className="row">
                    <div className="col">
                        <div ref={div} style={{ height: 400, padding: 5, border: 'solid 1px gray' }}></div>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        {status === 'loading' ?
                            <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                                <ReactIcons.SpiningIcon Size={'50%'} />
                            </div> : null}
                        {status === 'error' ?
                            <Alert Class='alert-danger'>An error occurred while fetching lightning data.</Alert> : null}
                        {status === 'idle' && lightningInfo.length === 0 ?
                            <Alert Class='alert-info'>No lightning records found.</Alert>
                            : null}
                        <Table<ILightningStrike>
                            TableClass="table table-hover"
                            KeySelector={(item) => item.ID}
                            Data={lightningInfo}
                            SortKey={''}
                            Ascending={true}
                            OnSort={() => {/*Do Nothing*/ }}
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            TbodyStyle={{ display: 'block', overflowY: 'auto', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ display: 'table', tableLayout: 'fixed', width: 'calc(100%)' }}
                            Selected={() => false}
                        >
                            <Column<ILightningStrike>
                                Key={'Service'}
                                AllowSort={false}
                                Field={'Service'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Service
                            </Column>
                            <Column<ILightningStrike>
                                Key={'DisplayTime'}
                                AllowSort={false}
                                Field={'DisplayTime'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Time
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Amplitude'}
                                AllowSort={false}
                                Field={'Amplitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Amplitude
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Latitude'}
                                AllowSort={false}
                                Field={'Latitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Latitude
                            </Column>
                            <Column<ILightningStrike>
                                Key={'Longitude'}
                                AllowSort={false}
                                Field={'Longitude'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            >
                                Longitude
                            </Column>
                        </Table>
                    </div>
                </div>
            </div>
        );
    }
}

function resolveVars(str: string, faultInfo: IFaultInfo[]): string {


    const vars = {
        'time': '',
        'station': '',
        'line': '',
    };

    if (faultInfo.length > 0) {
        const t = moment(faultInfo[0]?.Inception);
        vars["time"] = t.utc().format('YYYY-MM-DDTHH') + ':' + (t.minutes() - t.minutes() % 5).toString();
        vars["station"] = faultInfo[0]?.StationName.toUpperCase();
        vars["line"] = faultInfo[0]?.AssetName.toUpperCase();
    }

    let result = str;
    for (const key in vars) {
        if (str.includes(`\{${key}\}`))
            result = result.replace(`\{${key}\}`, vars[key]);
    }
    return result;
}

const LayerSettings = (props: { Layer: ILayerSetting, SetLayer: (layer: ILayerSetting | undefined) => void, Index: number }) => {
    return <>
        <div className="col-8">
            <Input<ILayerSetting>
                Record={props.Layer}
                Field={'url'}
                Setter={(record) => props.SetLayer(record)}
                Valid={() => true}
                Label={'Layer ' + props.Index + ' Url'}
                Help={'The URL of the map server where this layer is served.'}
            />
        </div>
        <div className="col-4" style={{ margin: 'auto' }}>
            <button className="btn btn-small btn-danger" onClick={() => props.SetLayer(undefined)}>
                <ReactIcons.TrashCan />
            </button>
        </div>
        <div className="col-4">
            <Input<ILayerSetting>
                Record={props.Layer}
                Field={'layer'}
                Setter={(record) => props.SetLayer(record)}
                Valid={() => true}
                Label={'Layer ' + props.Index + ' LayerID'}
                Help={'The layer id of the layer in the map server. If left blank the entire map is shown.'}
            />
        </div>
        <div className="col-4">
            <Input<ILayerSetting>
                Record={props.Layer}
                Field={'opacity'}
                Setter={(record) => props.SetLayer(record)}
                Valid={() => props.Layer.opacity > 0 && props.Layer.opacity <= 1}
                Label={'Layer ' + props.Index + ' Opacity'}
                Type={'number'}
                Help={'The opacity of this layer between 0 and 1.'}
                Feedback={'Opacity must be between 0 and 1'}
            />
        </div>
        <div className="col-4">
            <Select
                Record={props.Layer}
                Field='layertype'
                Options={[
                    { Value: "wms", Label: "WMS" },
                    { Value: "esri", Label: "ESRI" },
                ]}
                Setter={(record) => props.SetLayer(record)}
                Label={'Layer ' + props.Index + ' Type'}
                Style={{ marginBottom: 0 }}
                Help={'The type of this layer. Options are WMS and ESRI.'}

            />
        </div>
        <hr />
    </>

}
export default ESRIMap;
