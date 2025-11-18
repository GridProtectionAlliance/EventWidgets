//******************************************************************************************************
//  WidgetWrapper.tsx - Gbtc
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
//  10/23/2025 - G. Santos
//       Generated original version of source code.
//
//******************************************************************************************************

import { OpenXDA } from '@gpa-gemstone/application-typings';
import { ErrorBoundary } from '@gpa-gemstone/common-pages';
import { GenericController, Search, ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import { cloneDeep } from 'lodash';
import * as React from 'react';
import EventCountChart from './CollectionWidget/EventCountChart';
import EventCountTable from './CollectionWidget/EventCountTable';
import EventTable from './CollectionWidget/EventTable';
import MagDurChart from './CollectionWidget/MagDurChart';
import PQHealthIndex from './CollectionWidget/PQHealthIndex';
import { EventWidget } from './global';

export const AllWidgets: EventWidget.ICollectionWidget<any>[] = [
    EventTable, PQHealthIndex, MagDurChart, EventCountTable, EventCountChart
];

interface IProps {
    Widget: EventWidget.IWidgetView,
    EventCallBack?: (arg: OpenXDA.Types.EventSearch[]) => void,
    SelectedEvents?: Set<number>,
    EventFilter: EventWidget.ICollectionFilter,
    Title?: string,
    HomePath: string,
    Roles: string[]
}

function TransformFilter(filt: EventWidget.ICollectionFilter): Search.IFilter<OpenXDA.Types.EventSearch>[] {
    const newFilt: Search.IFilter<OpenXDA.Types.EventSearch>[] = [];
    if (filt?.TimeFilter != null)
        newFilt.push({
            FieldName: 'StartTime',
            SearchText: filt.TimeFilter.StartTime,
            Operator: '>=',
            Type: 'datetime',
            IsPivotColumn: false
        }, {
            FieldName: 'StartTime',
            SearchText: filt.TimeFilter.EndTime,
            Operator: '<=',
            Type: 'datetime',
            IsPivotColumn: false
        });

    if (filt?.MeterFilter != null)
        newFilt.push({
            FieldName: 'MeterID',
            SearchText: `(${filt.MeterFilter.map(meter => meter.ID).join(',')})`,
            Operator: 'IN',
            Type: 'number',
            IsPivotColumn: false
        });

    if (filt?.TypeFilter != null)
        newFilt.push({
            FieldName: 'EventTypeID',
            SearchText: `(${filt.TypeFilter.map(type => type.ID).join(',')})`,
            Operator: 'IN',
            Type: 'number',
            IsPivotColumn: false
        });

    return newFilt;
}

const CollectionWidgetRouter: React.FC<IProps> = (props: IProps) => {
    const [events, setEvents] = React.useState<OpenXDA.Types.EventSearch[]>([]);
    const [searchState, setSearchState] = React.useState<EventWidget.ICollectionSearchState>({
        SortKey: 'StartTime',
        Ascending: true,
        Page: 0
    });
    const [searchInfo, setSearchInfo] = React.useState<EventWidget.ICollectionSearchInformation>({
        TotalRecords: 0,
        Status: 'uninitiated'
    });

    const Widget = React.useMemo(() => AllWidgets.find(item => item.Name === props.Widget.Type), [props.Widget.ID]);

    const EventController = React.useMemo(() => new GenericController<OpenXDA.Types.EventSearch>(
        `${props.HomePath}api/EventWidgets/Event`, "StartTime", true
    ), [props.HomePath]);

    const Settings = React.useMemo(() => {
        if (props.Widget.Setting == null)
            return Widget?.DefaultSettings ?? {};

        const s = cloneDeep(Widget?.DefaultSettings ?? {});
        let custom = {};
        if (props.Widget.Setting != null && props.Widget.Setting.length > 2) {
            try {
                custom = JSON.parse(props.Widget.Setting); 
            } catch {
                custom = {};
                console.warn(`Widget ${props.Widget.Name} does not have a valid settings string`);
            }
        }

        for (const [k] of Object.entries(Widget?.DefaultSettings ?? {})) {
            if (custom.hasOwnProperty(k))
                s[k] = cloneDeep(custom[k]);
        }
        return s;
    }, [Widget, props.Widget.Setting]);

    React.useEffect(() => {
        if (Widget == null) return;
        if (Widget.DataType === 'Custom') {
            setSearchInfo(i => ({ ...i, Status: 'idle' }));
            return;
        }

        setSearchInfo(i => ({...i, Status: 'loading'}));
        let handle: JQuery.jqXHR;
        let abort = false;
        if (Widget.DataType === 'XDA-Paged')
            handle = EventController.PagedSearch(TransformFilter(props.EventFilter), searchState.SortKey, searchState.Ascending, searchState.Page).done((result) => {
                setEvents(JSON.parse(result.Data as unknown as string));
                setSearchInfo({
                    RecordsPerPage: result.RecordsPerPage,
                    NumberOfPages: result.NumberOfPages,
                    TotalRecords: result.TotalRecords,
                    Status: 'idle'
                });
            });
        else if (Widget.DataType === 'XDA-Search')
            handle = EventController.DBSearch(TransformFilter(props.EventFilter), searchState.SortKey, searchState.Ascending).done((result) => {
                setEvents(result);
                setSearchInfo({
                    TotalRecords: result.length,
                    Status: 'idle'
                });
            });
        else {
            console.error("Unrecognized data type in Widget Collection Wrapper: " + Widget.DataType)
            return;
        }

        handle.fail((_handle, _status, reason) => {
            if (!abort)
                setSearchInfo(i => ({ ...i, Status: 'error' }));
        });

        return () => {
            if (handle != null && handle?.abort != null) {
                abort = true;
                handle.abort();
            }
        }
    }, [searchState, props.EventFilter, Widget?.DataType])

    if (Widget == null || searchInfo.Status === 'error')
        return (
            <div className="card">
                <div className="card-header">
                    {props.Widget.Name} - Error
                </div>
                <div className="card-body">
                    <ServerErrorIcon Show={true}
                        Label={ Widget == null ?
                            `Widget ${props.Widget.Name} is not available. Please contact your system administrator.` :
                            `Unable to complete search. Please contact your system administrator.`}
                        Size={150} />
                </div>
            </div>
        );

    return (
        <ErrorBoundary
            ErrorMessage={`Widget ${props.Widget.Name} has encoutered an error.`}
        >
            <Widget.Widget
                Title={props.Title}
                Settings={Settings}
                Events={events}
                SearchInformation={searchInfo}
                SearchState={searchState}
                SetSearchState={setSearchState}
                EventCallBack={props.EventCallBack}
                SelectedEvents={props.SelectedEvents}
                CurrentFilter={props.EventFilter}
                HomePath={props.HomePath}
                Roles={props.Roles}
                Name={props.Widget.Name}
                WidgetID={props.Widget.ID}
            />
        </ErrorBoundary>
    );
}

export default CollectionWidgetRouter;

