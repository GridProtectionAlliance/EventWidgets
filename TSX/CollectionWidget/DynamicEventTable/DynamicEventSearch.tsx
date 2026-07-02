//******************************************************************************************************
//  DynamicEventSearch.tsx - Gbtc
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

import { Application, Gemstone } from '@gpa-gemstone/application-typings';
import { useGetContainerPosition } from '@gpa-gemstone/helper-functions';
import { CheckBox, Input } from '@gpa-gemstone/react-forms';
import _ from 'lodash';
import * as React from 'react';
import { DynamicEventSearchList } from './DynamicEventSearchTable';
import { DynamicEventSearchRow, FetchFallbackDynamicEventSearchData, IDynamicEventSearchQuery } from './DynamicEventSearchData';
import { EventWidget } from '../../global';

const LocalStorageKey = 'EventWidgets.DynamicEventSearch.TableCols';

interface ISettings {
    ShowCard: boolean,
    NumberResults: number
}

const DynamicEventSearch: EventWidget.ICollectionWidget<ISettings, DynamicEventSearchRow[], IDynamicEventSearchQuery> = {
    Name: 'DynamicEventSearch',
    DefaultSettings: { ShowCard: false, NumberResults: 100 },
    Settings: (props: EventWidget.IWidgetSettingsProps<ISettings>) => {
        return (
            <div className="row">
                <div className="col">
                    <CheckBox<ISettings>
                        Record={props.Settings}
                        Field={'ShowCard'}
                        Setter={props.SetSettings}
                        Label={'Show as Card'}
                    />
                    <Input<ISettings>
                        Record={props.Settings}
                        Field={'NumberResults'}
                        Setter={props.SetSettings}
                        Valid={() => props.Settings.NumberResults > 0}
                        Type={'integer'}
                        Label={'Number of Results'}
                        Feedback={'Number of Results must be a positive integer'}
                    />
                </div>
            </div>
        );
    },
    Widget: (props: EventWidget.ICollectionWidgetProps<ISettings, DynamicEventSearchRow[], IDynamicEventSearchQuery>) => {
        const bodyRef = React.useRef<HTMLDivElement | null>(null);
        const { height } = useGetContainerPosition(bodyRef);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [events, setEvents] = React.useState<DynamicEventSearchRow[]>([]);
        const [sortField, setSortField] = React.useState<string>('Time');
        const [ascending, setAscending] = React.useState<boolean>(true);

        const sortedEvents = React.useMemo(() =>
            _.orderBy(events, [sortField], [ascending ? 'asc' : 'desc']),
            [events, sortField, ascending]);

        React.useEffect(() => {
            setStatus('loading');

            const handle: Gemstone.TSX.Interfaces.AbortablePromise<DynamicEventSearchRow[]> | null = props.GetEventData == null ?
                FetchFallbackDynamicEventSearchData(props.CurrentFilter, props.HomePath, sortField, ascending, props.Settings.NumberResults) :
                props.GetEventData({ SortField: sortField, Ascending: ascending });

            if (handle == null) {
                setEvents([]);
                setStatus('idle');
                return;
            }

            handle.then((data) => {
                setEvents(data);
                setStatus('idle');
            }, () => {
                setStatus('error');
            });

            return () => {
                if (handle?.abort != null)
                    handle.abort();
            };
        }, [props.GetEventData, props.CurrentFilter, props.HomePath, props.Settings.NumberResults, sortField, ascending]);

        const content = (
            <DynamicEventSearchList
                Eventid={props.EventID ?? -1}
                SelectEvent={(eventID, row) => {
                    if (props.Callback != null)
                        props.Callback(eventID, row?.DisturbanceID, row?.FaultID);
                }}
                Height={height}
                Data={sortedEvents}
                Status={status}
                SortField={sortField}
                Ascending={ascending}
                NumberResults={props.Settings.NumberResults}
                OnSort={(colKey) => {
                    if (colKey == sortField)
                        setAscending(!ascending);
                    else {
                        setSortField(colKey);
                        setAscending(true);
                    }
                }}
                LocalStorageKey={LocalStorageKey}
            />
        );

        if (!props.Settings.ShowCard)
            return (
                <div className="h-100 w-100" style={{ display: 'flex', flexDirection: "column", overflow: 'hidden' }} ref={bodyRef}>
                    {content}
                </div>
            );

        return (
            <div className="card h-100 w-100" style={{ display: 'flex', flexDirection: "column" }}>
                <div className="card-header">
                    {props.Title == null ? "Event Search" : props.Title}
                </div>
                <div className="card-body p-0" style={{ display: 'flex', flexDirection: "column", flex: 1, overflow: 'hidden' }} ref={bodyRef}>
                    {content}
                </div>
            </div>
        );
    }
}

export default DynamicEventSearch;
