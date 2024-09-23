//******************************************************************************************************
//  AssetHistoryStats.tsx - Gbtc
//
//  Copyright � 2023, Grid Protection Alliance.  All Rights Reserved.
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
//  06/19/2023 - Gary Pinkley
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { ReactTable } from '@gpa-gemstone/react-table';
import { Select } from '@gpa-gemstone/react-forms';

interface IStatsData {
    VPeakMax: number;
    VMax: number;
    VMin: number;
    IMax: number;
    I2tMax: number;
    IPeakMax: number;
    AVGMW: number;
    AssetName: string;
}

const AssetHistoryStats: EventWidget.IWidget<{}> = {
    Name: 'AssetHistoryStats',
    DefaultSettings: { },
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [statsData, setStatsData] = React.useState<IStatsData[]>([]);
        const [time, setTime] = React.useState<string>('999');

        React.useEffect(() => {
            getStatsData(time);
        }, [props.EventID]);

        React.useEffect(() => {
            getStatsData(time);
        }, [time]);

        function getStatsData(time: string) {
            if (time === '1' || time === '12') {
                $.ajax({
                    url: `${props.HomePath}api/AssetHistoryStats/${props.EventID}/${time}`,
                    method: 'GET',
                    dataType: 'json',
                    success: (data) => {
                        if (data && data.length > 0) {
                            const stats = data[0];
                            setStatsData(stats);
                        }
                    },
                });
            }
            else {
                $.ajax({
                    url: `${props.HomePath}api/AssetHistoryStats/${props.EventID}`,
                    method: 'GET',
                    dataType: 'json',
                    success: (data) => {
                        if (data && data.length > 0) {
                            const stats = data[0];
                            setStatsData(stats);
                        }
                    },
                });
            }
        }

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Stats for {statsData['AssetName']}:
                <div className='pull-right'>
                    <div className="form-inline">
                        <Select
                            Record={{ time }}
                            Field='time'
                            Options={[
                                { Value: "999", Label: "Lifetime" },
                                { Value: "12", Label: "Last Year" },
                                { Value: "1", Label: "Last Month" }
                            ]}
                            Setter={(record) => setTime(record.time)}
                            Label="Time Window: "
                        />
                    </div>
                </div>
            </div>
                <div className="card-body">
                    <ReactTable.Table
                        Data={Object.entries(statsData).map(([key, value]) => ({ Stat: key, Value: value }))}
                        OnSort={() => {/*Do Nothing*/ }}
                        KeySelector={(_item, index) => { return index; /* Note: index isn't a good key, but we have no better options at time of writing */ } }
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    >
                        <ReactTable.Column
                            Key={'Stat'}
                            AllowSort={false}
                            Field={'Stat'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Stat
                        </ReactTable.Column>
                        <ReactTable.Column
                            Key={'Value'}
                            AllowSort={false}
                            Field={'Value'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > Value
                        </ReactTable.Column>
                    </ReactTable.Table>
                </div>
            </div>
        );
    }
};

export default AssetHistoryStats;