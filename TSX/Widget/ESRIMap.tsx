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
    Key: string,
    Value: string | number | null
}

interface IStructureLocation {
    Latitude: number,
    Longitude: number
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
    StructureCrawlerURL: string,
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
        StructureCrawlerURL: `http://opsptpsnet.cha.tva.gov:8025/TLI/StructureCrawler/FaultFinder.asp?Station={StationID}&Line={LineAssetKey}&Mileage={FaultDistance}`,
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
                            Field={'StructureCrawlerURL'}
                            Help={'The full structure crawler URL, including query parameters. Populate a parameter from fault information using its field name in braces, for example Station={StationID} or Mileage={FaultDistance}.'}
                            Setter={(record) => props.SetSettings(record)}
                            Valid={() => true}
                            Label={'Structure Crawler URL'}
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
        const [structureLocation, setStructureLocation] = React.useState<IStructureLocation | null>(null);
        const [structureStatus, setStructureStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [stationStatus, setStationStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [crawlerReturnedNoCoordinates, setCrawlerReturnedNoCoordinates] = React.useState<boolean>(false);
        const locationWarning = getLocationWarning(structureStatus, stationStatus, crawlerReturnedNoCoordinates, structureLocation != null);
        const mapWarning = [layerErrors.length > 0 ? `Unable to load ${layerErrors.length} map ${layerErrors.length === 1 ? 'layer' : 'layers'}.` : '', locationWarning]
            .filter(message => message.length > 0).join(' ');

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

        /* Get the nearest structure location, falling back to the meter's substation location. */
        React.useEffect(() => {
            setStructureLocation(null);
            setStructureStatus('uninitiated');
            setStationStatus('uninitiated');
            setCrawlerReturnedNoCoordinates(false);

            let stationHandle: JQuery.jqXHR<IStructureLocation[]> | undefined;

            /** Loads the event meter's substation location as a fallback. */
            const loadStationLocation = () => {
                setStationStatus('loading');
                stationHandle = $.ajax({
                    type: 'GET',
                    url: `${props.HomePath}api/EventWidgets/ESRIMap/SubstationLocation/${props.EventID}`,
                    dataType: 'json',
                    cache: true
                }) as JQuery.jqXHR<IStructureLocation[]>;

                stationHandle.done((data) => {
                    setStructureLocation(data[0] ?? null);
                    setStationStatus('idle');
                }).fail((response) => {
                    setStationStatus('error');
                    console.error('Unable to fetch the substation location: ' + JSON.stringify(response));
                });
            };

            const station = getFaultInfoValue(faultInfo, 'StationID');
            const line = getFaultInfoValue(faultInfo, 'LineAssetKey');
            const distance = getFaultInfoValue(faultInfo, 'FaultDistance');

            if (station.length === 0 || line.length === 0 || distance.length === 0 || !props.Settings.StructureCrawlerURL)
                return;

            setStructureStatus('loading');
            const handle = $.ajax({
                type: 'GET',
                url: resolveVars(props.Settings.StructureCrawlerURL, faultInfo),
                dataType: 'text',
                cache: true,
                xhrFields: { withCredentials: true }
            }).done((response) => {
                const location = parseStructureLocation(response);
                setCrawlerReturnedNoCoordinates(location == null);

                if (location == null) {
                    setStructureStatus('idle');
                    loadStationLocation();
                    return;
                }

                setStructureLocation(location);
                setStructureStatus('idle');
            }).fail((response) => {
                setStructureStatus('error');
                console.error('Unable to fetch structure crawler data: ' + JSON.stringify(response));
                loadStationLocation();
            });

            return () => {
                if (handle?.abort != null)
                    handle.abort();
                if (stationHandle?.abort != null)
                    stationHandle.abort();
            };
        }, [faultInfo, props.EventID, props.HomePath, props.Settings.StructureCrawlerURL]);

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
            if (structureLocation == null || map.current == null) return;

            const coordinates: [number, number] = [structureLocation.Latitude, structureLocation.Longitude];
            const fault_marker = leaflet.marker(coordinates).addTo(map.current);
            map.current.setView(coordinates, map.current.getZoom());

            return () => {
                map.current?.removeLayer(fault_marker);
            }

        }, [structureLocation]);

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
                <div className="card-header fixed-top" style={{ position: 'sticky' }}>
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
                {mapWarning.length > 0 ?
                    <div className="row">
                        <div className="col">
                            <Alert Class='alert-warning'>{mapWarning}</Alert>
                        </div>
                    </div>
                    : null
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

/** Replaces map-setting placeholders with values from fault information. */
function resolveVars(str: string, faultInfo: IFaultInfo[]): string {
    let result = str;

    for (const info of faultInfo) {
        if (info.Value != null)
            result = result.split(`{${info.Key}}`).join(info.Value.toString());
    }

    const aliases = {
        'time': '',
        'station': '',
        'line': '',
        'distance': ''
    };

    if (faultInfo.length > 0) {
        const t = moment(getFaultInfoValue(faultInfo, 'FaultTime'));
        if (t.isValid())
            aliases["time"] = t.utc().format('YYYY-MM-DDTHH') + ':' + (t.minutes() - t.minutes() % 5).toString();

        aliases["station"] = getFaultInfoValue(faultInfo, 'StationID').toUpperCase();
        aliases["line"] = getFaultInfoValue(faultInfo, 'LineAssetKey').toUpperCase();
        aliases["distance"] = getFaultInfoValue(faultInfo, 'FaultDistance');
    }

    for (const key in aliases)
        result = result.split(`{${key}}`).join(aliases[key]);

    return result;
}

/** Returns a fault-information value as text. */
function getFaultInfoValue(faultInfo: IFaultInfo[], key: string): string {
    const value = faultInfo.find(info => info.Key === key)?.Value;
    return value == null ? '' : value.toString();
}

/** Parses the first valid latitude and longitude from a structure crawler HTML/CSV response. */
function parseStructureLocation(response: string): IStructureLocation | null {
    const document = new DOMParser().parseFromString(response, 'text/html');
    const csv = document.body.textContent?.trim() ?? '';
    const lines = csv.split(/[\r\n]+/).map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length < 2)
        return null;

    const fields = lines[0].split(',').map(field => field.trim());
    const latitudeIndex = fields.findIndex(field => field.toLowerCase() === 'latitude');
    const longitudeIndex = fields.findIndex(field => field.toLowerCase() === 'longitude');

    if (latitudeIndex === -1 || longitudeIndex === -1)
        return null;

    for (const line of lines.slice(1)) {
        const values = line.split(',').map(value => value.trim());
        const latitude = parseFloat(values[latitudeIndex]);
        const longitude = parseFloat(values[longitudeIndex]);

        if (Number.isFinite(latitude) && Number.isFinite(longitude))
            return { Latitude: latitude, Longitude: longitude };
    }

    return null;
}

/** Returns the warning for the structure-to-substation fallback. */
function getLocationWarning(structureStatus: Application.Types.Status, stationStatus: Application.Types.Status, crawlerReturnedNoCoordinates: boolean, hasLocation: boolean): string {
    if (stationStatus === 'uninitiated') return '';

    const crawlerResult = structureStatus === 'error' ? 'failed' : crawlerReturnedNoCoordinates ? 'returned no coordinates' : '';
    if (crawlerResult.length === 0) return '';
    if (stationStatus === 'loading')
        return `The structure crawler ${crawlerResult}. The map is attempting to use the meter's substation location instead.`;
    if (hasLocation)
        return `The structure crawler ${crawlerResult}. The map is using the meter's substation location instead.`;
    return `The structure crawler ${crawlerResult}, and no valid substation location was available.`;
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
