//******************************************************************************************************
//  EventSearchCorrelatedSags.tsx - Gbtc
//
//  Copyright � 2019, Grid Protection Alliance.  All Rights Reserved.
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
//  04/25/2019 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import moment from 'moment';
import { EventWidget } from '../global';
import { ReactTable } from '@gpa-gemstone/react-table';
import { Input } from '@gpa-gemstone/react-forms';

interface ITimeCorrelatedSags {
    EventID: number;
    EventType: string;
    SagMagnitudePercent: number;
    SagDurationMilliseconds: number;
    SagDurationCycles: number;
    StartTime: string;
    MeterName: string;
    AssetName: string;
}
interface ISetting { OpenSeeUrl: string, OverlappingWindow: number }

const EventSearchCorrelatedSags: EventWidget.IWidget<ISetting> = {
    Name: 'CorrelatedSags',
    DefaultSettings: { OpenSeeUrl: 'http://opensee.demo.gridprotectionalliance.org', OverlappingWindow: 2 },
    Settings: (props) => {
        return <>
        <div className="row">
            <div className="col">
                <Input<ISetting>
                    Record={props.Settings}
                    Field={'OpenSeeUrl'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'OpenSEE URL'} />
            </div>
        </div>
        <div className="row">
            <div className="col">
                <Input<ISetting>
                    Record={props.Settings}
                    Field={'OverlappingWindow'}
                    Type={'number'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'Window (s)'} />
            </div>
        </div>
        </>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [data, setData] = React.useState<ITimeCorrelatedSags[]>([]);

        let correlatedSagsHandle;

        function getTimeCorrelatedSags() {
            if (correlatedSagsHandle !== undefined) {
                correlatedSagsHandle.abort();
            }

            correlatedSagsHandle = $.ajax({
                type: 'GET',
                url: `${props.HomePath}api/CorrelatedSags?eventId=${props.EventID}&timeTolerance=${props.Settings.OverlappingWindow}`,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                cache: true,
                async: true,
            });

            return correlatedSagsHandle;
        }

        React.useEffect(() => {
            const handle = getTimeCorrelatedSags();
            handle.done((data) => {
                setData(data);
            });
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [props.EventID]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Correlated Sags (within {props.Settings.OverlappingWindow} seconds):
                </div>
                <div className="card-body" >
                    <ReactTable.Table
                        Data={data}
                        KeySelector={item => item.EventID }
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        Selected={(d: ITimeCorrelatedSags) => d.EventID === props.EventID}
                    />
                </div>
            </div>
        );
    }
};


export default EventSearchCorrelatedSags;
