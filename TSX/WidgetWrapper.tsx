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

const allWidgets: EventWidget.IWidget<any>[] = [LineParameters , 
    EventSearchOpenSEE, ESRIMap, FaultInfo, EventSearchAssetFaultSegments,
    AssetVoltageDisturbances, EventSearchCorrelatedSags, SOE, EventSearchPQI, Lightning, EventSearchFileInfo, EventSearchNoteWindow,
    StructureInfo, PQICurve, InterruptionReport, EventSearchRelayPerformance, EventSearchBreakerPerformance, EventSearchCapBankAnalyticOverview,
    AssetHistoryStats, AssetHistoryTable, MatlabAnalyticResults];

interface IProps {
    Widget: EventWidget.IWidgetView,
    EventID: number,
    Height: number,
    DisturbanceID: number,
    FaultID: number,
    StartTime: number,
    HomePath: string,
    Roles: string[],
    Date?: string,
    Time?: string,
    TimeWindowUnits?: number,
    WindowSize?: number
}

const WidgetRouter: React.FC<IProps> = (props: IProps) => {
    const Widget = React.useMemo(() => allWidgets.find(item => item.Name === props.Widget.Name), [props.Widget.Name]);
    const Settings = React.useMemo(() => {
        if (props.Widget.setting == null)
            return Widget.DefaultSettings;
        const s = cloneDeep(Widget.DefaultSettings);
        for (const [k, v] of Object.entries(Widget.DefaultSettings)) {
            if (props.Widget.setting.hasOwnProperty(k))
                s[k] = cloneDeep(props.Widget.setting[k]);
        }
        return s;
    }, [Widget, props.Widget.setting]);

    return <ErrorBoundary>
        <Widget.Widget
            Settings={Settings}
            StartTime={props.StartTime}
            EventID={props.EventID}
            HomePath={props.HomePath}
            MaxHeight={props.Height - 37.5}
            Roles={props.Roles}
            DisturbanceID={props.DisturbanceID}
            FaultID={props.FaultID}
            Date={props.Date}
            Time={props.Time}
            TimeWindowUnits={props.TimeWindowUnits}
            WindowSize={props.WindowSize}
        />
    </ErrorBoundary>
}

interface IError {
    name: string,
    message: string
}

class ErrorBoundary extends React.Component<{}, IError> {
    constructor(props) {
        super(props);
        this.state = { name: "", message: "" };
    }

    componentDidCatch(error) {
        this.setState({
            name: error.name,
            message: error.message
        });
    }

    render() {
        if (this.state.name.length > 0) {
            return (
                <ServerErrorIcon Show={true} />
            );
        } else {
            return <>{this.props.children}</>;
        }
    }
}


export default WidgetRouter;