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

import { ErrorBoundary } from '@gpa-gemstone/common-pages';
import { GenericController, LoadingIcon, Search, ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import { cloneDeep } from 'lodash';
import * as React from 'react';
import { EventWidget } from './global';
import EventTable from './CollectionWidget/EventTable';
import { OpenXDA } from '@gpa-gemstone/application-typings';

export const AllWidgets: EventWidget.ICollectionWidget<any>[] = [EventTable];

interface IProps {
    Widget: EventWidget.IWidgetView,
    EventCallBack: (arg: OpenXDA.Types.EventSearch[]) => void,
    SelectedEvents: Set<number>,
    EventFilter: EventWidget.ICollectionFilter,
    HomePath: string,
    Roles: string[]
}

const EventController = new GenericController<OpenXDA.Types.EventSearch>(
    "api/EventWidgets/Event", "StartTime", true
);

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
            SearchText: `(${filt.MeterFilter.join(',')})`,
            Operator: 'IN',
            Type: 'number',
            IsPivotColumn: false
        });

    if (filt?.TypeFilter != null)
        newFilt.push({
            FieldName: 'EventTypeID',
            SearchText: `(${filt.TypeFilter.join(',')})`,
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
        Status: 'unintiated'
    });

    const Widget = React.useMemo(() => AllWidgets.find(item => item.Name === props.Widget.Type), [props.Widget.ID]);

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

        setSearchInfo(i => ({...i, Status: 'loading'}));
        let handle;
        if (Widget.IsPaged)
            handle = EventController.PagedSearch(TransformFilter(props.EventFilter), searchState.SortKey, searchState.Ascending, searchState.Page).done((result) => {
                setEvents(JSON.parse(result.Data as unknown as string));
                setSearchInfo({
                    RecordsPerPage: result.RecordsPerPage,
                    NumberOfPages: result.NumberOfPages,
                    TotalRecords: result.TotalRecords,
                    Status: 'idle'
                });
            });
        else
            handle = EventController.DBSearch(TransformFilter(props.EventFilter), searchState.SortKey, searchState.Ascending).done((result) => {
                setEvents(result);
                setSearchInfo({
                    TotalRecords: result.length,
                    Status: 'idle'
                });
            });

        handle.fail(() => setSearchInfo(i => ({ ...i, Status: 'error' })));

        return () => { if (handle != null && handle?.abort != null) handle.abort(); }
    }, [searchState, props.EventFilter])

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

    if (searchInfo.Status === 'loading' || searchInfo.Status === 'unintiated')
        return (
            <div className="card">
                <div className="card-header">
                    {props.Widget.Name}
                </div>
                <div className="card-body">
                    <LoadingIcon Show={true} Size={150} />
                </div>
            </div>
        );



    return (
        <ErrorBoundary
            ErrorMessage={`Widget ${props.Widget.Name} has encoutered an error.`}
        >
            <Widget.Widget
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

