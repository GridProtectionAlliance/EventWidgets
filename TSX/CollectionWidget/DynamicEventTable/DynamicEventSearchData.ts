//******************************************************************************************************
//  DynamicEventSearchData.ts - Gbtc
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
//******************************************************************************************************

import { ajax } from 'jquery';
import moment from 'moment';
import { OpenXDA } from '@gpa-gemstone/application-typings';
import { EventWidget } from '../../global';

export interface IDynamicEventSearchRequest {
    // Time fields are unused (and may be omitted) when eventID is provided - the request then targets that single event
    date?: string,
    time?: string,
    windowSize?: number,
    timeWindowUnits?: number,
    eventID?: number,
    durationMin?: number,
    durationMax?: number,
    phases?: { AN: boolean, BN: boolean, CN: boolean, AB: boolean, BC: boolean, CA: boolean, ABG: boolean, BCG: boolean, ABC: boolean, ABCG: boolean },
    transientMin?: number,
    transientMax?: number,
    transientType?: 'both' | 'LL' | 'LN',
    sagMin?: number,
    sagMax?: number,
    sagType?: 'both' | 'LL' | 'LN',
    swellMin?: number,
    swellMax?: number,
    swellType?: 'both' | 'LL' | 'LN',
    curveID?: number,
    curveInside?: boolean,
    curveOutside?: boolean,
    meterIDs?: number[],
    typeIDs?: number[],
    assetIDs?: number[],
    groupIDs?: number[],
    locationIDs?: number[],
    numberResults?: number,
    ascending?: boolean,
    sortKey?: string
}

// Query shape the dynamic collection widgets pass to GetEventData (TQuery of ICollectionWidgetProps)
export interface IDynamicEventSearchQuery {
    SortField: string,
    Ascending: boolean
}

export type DynamicEventSearchRow = {
    EventID: number,
    DisturbanceID?: number,
    FaultID?: number,
    Time?: string,
    MagDurDuration?: number,
    MagDurMagnitude?: number,
    [key: string]: any
}

export function GetDynamicEventSearchData(params: IDynamicEventSearchRequest, route: string): JQuery.jqXHR<DynamicEventSearchRow[]> {
    return ajax({
        type: "POST",
        url: route,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(params),
        dataType: 'json',
        cache: true,
        async: true
    });
}

export function BuildFallbackDynamicEventSearchRequest(
    filter: EventWidget.ICollectionFilter,
    sortField: string,
    ascending: boolean,
    numberResults: number
): IDynamicEventSearchRequest | null {
    if (filter.TimeFilter == null)
        return null;

    const start = moment.utc(filter.TimeFilter.StartTime, OpenXDA.Consts.DateTimeFormat);
    const end = moment.utc(filter.TimeFilter.EndTime, OpenXDA.Consts.DateTimeFormat);
    const center = moment.utc((start.valueOf() + end.valueOf()) / 2);

    return {
        date: center.format('MM/DD/YYYY'),
        time: center.format('HH:mm:ss.SSS'),
        windowSize: Math.max(end.diff(start, 'milliseconds') / 2, 0),
        timeWindowUnits: 0,
        phases: {
            AN: true,
            BN: true,
            CN: true,
            AB: true,
            BC: true,
            CA: true,
            ABG: true,
            BCG: true,
            ABC: true,
            ABCG: true
        },
        curveInside: true,
        curveOutside: true,
        meterIDs: filter.MeterFilter?.map(meter => meter.ID) ?? [],
        typeIDs: filter.TypeFilter?.map(type => type.ID),
        assetIDs: [],
        groupIDs: [],
        locationIDs: [],
        numberResults,
        ascending,
        sortKey: sortField
    };
}

export function FetchFallbackDynamicEventSearchData(
    filter: EventWidget.ICollectionFilter,
    homePath: string,
    sortField: string,
    ascending: boolean,
    numberResults: number
): JQuery.jqXHR<DynamicEventSearchRow[]> | null {
    const request = BuildFallbackDynamicEventSearchRequest(filter, sortField, ascending, numberResults);

    if (request == null)
        return null;

    return GetDynamicEventSearchData(request, `${homePath}api/EventWidgets/DynamicEventSearch`);
}
