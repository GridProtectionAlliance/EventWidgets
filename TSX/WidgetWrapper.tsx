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
//  08/07/2023 - C Lackner
//       Generated original version of source code.
//
//******************************************************************************************************
import { EventWidget } from './global'; 
import * as React from 'react';
import LineParameters from './Widget/LineParameters';
import { ServerErrorIcon } from '@gpa-gemstone/react-interactive';
import { cloneDeep } from 'lodash';
import EventSearchOpenSEE from './Widget/OpenSEE'
import ESRIMap from './Widget/ESRIMap'
import FaultInfo from './Widget/FaultInfo'
import EventSearchAssetFaultSegments from './Widget/AssetFaultSegments';
import AssetVoltageDisturbances from './Widget/AssetVoltageDisturbances'
import EventSearchCorrelatedSags from './Widget/CorrelatedSags'
import SOE from './Widget/SOE'
import EventSearchPQI from './Widget/PQI'
import EventSearchFileInfo from './Widget/FileInfo'
import EventSearchNoteWindow from './Widget/NoteWindow'
import Lightning from './Widget/Lightning'
import StructureInfo from './Widget/StructureInfo'
import PQICurve from './Widget/PQICurves'
import InterruptionReport from './Widget/InterruptionReport'
import EventSearchRelayPerformance from './Widget/RelayPerformance'
import EventSearchBreakerPerformance from './Widget/BreakerPerformance'
import EventSearchCapBankAnalyticOverview from './Widget/CapBankAnalyticOverview'
import AssetHistoryStats from './Widget/AssetHistoryStats'
import AssetHistoryTable from './Widget/AssetHistoryTable'
import MatlabAnalyticResults from './Widget/MatlabAnalyticResults';
import { IWigetStore } from './Store';
import EventInfo from './Widget/EventInfo';
import ITOA from './Widget/ITOA';
import { ErrorBoundary } from '@gpa-gemstone/common-pages';
import TrendGraph from './Widget/TrendGraph';
import PQAI from './Widget/PQAI';

const AllWidgets: EventWidget.IWidget<any>[] = [LineParameters , 
    EventSearchOpenSEE, ESRIMap, FaultInfo, EventSearchAssetFaultSegments,
    AssetVoltageDisturbances, EventSearchCorrelatedSags, SOE, EventSearchPQI, Lightning, EventSearchFileInfo, EventSearchNoteWindow,
    StructureInfo, PQICurve, InterruptionReport, EventSearchRelayPerformance, EventSearchBreakerPerformance, EventSearchCapBankAnalyticOverview,
    AssetHistoryStats, AssetHistoryTable, MatlabAnalyticResults, EventInfo, ITOA, TrendGraph, PQAI];

interface IProps {
    Widget: EventWidget.IWidgetView,
    EventID: number,
    Height: number,
    DisturbanceID: number,
    FaultID: number,
    HomePath: string,
    Roles: string[],
    Store: IWigetStore
}

const WidgetRouter: React.FC<IProps> = (props: IProps) => {
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

        for (const [k, v] of Object.entries(Widget?.DefaultSettings ?? {})) {
            if (custom.hasOwnProperty(k))
                s[k] = cloneDeep(custom[k]);
        }
        return s;
    }, [Widget, props.Widget.Setting]);

   

    return <>{Widget == null ?  <div className="card">
            <div className="card-header">
                {props.Widget.Name} - Error
            </div>
            <div className="card-body">
                <ServerErrorIcon Show={true}
                Label={`Widget ${props.Widget.Name} is not available. Please contact your system administrator.`}
                Size={150} />
            </div>
             </div>
        : <ErrorBoundary
            ErrorMessage={`Widget ${props.Widget.Name} has encoutered an error.`}
        >
            <Widget.Widget
                Settings={Settings}
                EventID={props.EventID}
                HomePath={props.HomePath}
                MaxHeight={props.Height - 37.5}
                Roles={props.Roles}
                DisturbanceID={props.DisturbanceID}
                FaultID={props.FaultID}
                Name={props.Widget.Name}
                Store={props.Store}
                WidgetID={props.Widget.ID}
            />
        </ErrorBoundary>}
    </>
}

export { AllWidgets }
export default WidgetRouter;