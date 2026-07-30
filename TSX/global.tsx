//******************************************************************************************************
//  global.tsx - Gbtc
//
//  Copyright © 2023, Grid Protection Alliance.  All Rights Reserved.
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
//  08/07/2023 - C Lackner
//       Generated original version of source code.
//
//******************************************************************************************************
import React from 'react';
import { Gemstone, OpenXDA } from '@gpa-gemstone/application-typings';

export namespace EventWidget {
    export interface IWidgetView {
        ID: number,
        Name: string,
        Type: string,
        Setting: string
    }

    export interface IMutationAuthorization {
        Create: boolean,
        Update: boolean,
        Delete: boolean
    }

    export interface IWidgetAuthorization {
        Notes: IMutationAuthorization,
        EventInfo: IMutationAuthorization
    }

    export interface IWidgetProps<T> {
        Settings: T,
        EventID: number,
        MaxHeight: number,
        DisturbanceID?: number,
        FaultID?: number,
        HomePath: string,
        WidgetAuthorization: IWidgetAuthorization,
        Name: string,
        WidgetID: number,
        EventTypes: OpenXDA.Types.EventType[]
    }

    // External filters into the search
    export interface ICollectionFilter {
        TimeFilter?: {
            StartTime: string,
            EndTime: string
        }
        MeterFilter?: OpenXDA.Types.Meter[],
        TypeFilter?: OpenXDA.Types.EventType[]
    }

    export interface ICollectionWidgetProps<T, TEventData = unknown, TQuery = void> {
        // Widget Props
        Settings: T,
        // Control Props
        CurrentFilter: ICollectionFilter,
        GetEventData?: (query: TQuery) => Gemstone.TSX.Interfaces.AbortablePromise<TEventData>,
        EventID?: number,
        DisturbanceID?: number,
        FaultID?: number,
        Callback?: (eventID: number, disturbanceID?: number, faultID?: number) => void,
        OnDataLoaded?: (count: number) => void,
        // Other Props
        HomePath: string,
        WidgetAuthorization: IWidgetAuthorization,
        Name: string,
        WidgetID: number,
        Title?: string
    }

    export interface IWidgetSettingsProps<T> {
        HomePath: string,
        SetErrors: (e: string[]) => void,
        Settings: T,
        SetSettings: (settings: T) => void
    }

    export interface IWidget<T>  {
        Widget: React.FC<IWidgetProps<T>>,
        Settings: React.FC<IWidgetSettingsProps<T>>,
        DefaultSettings: T,
        Name: string,
    }

    export interface ICollectionWidget<T, TEventData = unknown, TQuery = void> {
        Widget: React.FC<ICollectionWidgetProps<T, TEventData, TQuery>>,
        Settings: React.FC<IWidgetSettingsProps<T>>,
        DefaultSettings: T,
        Name: string
    }

}
