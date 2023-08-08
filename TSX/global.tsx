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

export namespace EventWidget {

    export interface IWidgetView { ID: number, CategoryID: number, Name: string, setting: object, Enabled: boolean }

    export interface IWidgetProps<T> {
        Settings: T,
        EventID: number,
        MaxHeight?: number,
        DisturbanceID?: number,
        FaultID?: number,
        StartTime?: number,
        HomePath: string,
        Roles: string[]
    }

    export interface IWidgetSettingsProps<T> {
        Settings: T,
        SetSettings: (settings: T) => void,
    }

    export interface IWidget<T>  {
        Widget: React.FC<IWidgetProps<T>>,
        Settings: React.FC<IWidgetSettingsProps<T>>,
        DefaultSettings: T,
        Name: string,
    }
}