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
    EventID?: number,
    DisturbanceID?: number,
    FaultID?: number,
    Callback?: (eventID: number, disturbanceID?: number, faultID?: number) => void,
    EventFilter: EventWidget.ICollectionFilter,
    Title?: string,
    HomePath: string,
    Roles: string[]
}

const CollectionWidgetRouter: React.FC<IProps> = (props: IProps) => {
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

    return (
        <ErrorBoundary
            ErrorMessage={`Widget ${props.Widget.Name} has encoutered an error.`}
        >
            <Widget.Widget
                Title={props.Title}
                Settings={Settings}
                Callback={props.Callback}
                EventID={props.EventID}
                DisturbanceID={props.DisturbanceID}
                FaultID={props.FaultID}
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

