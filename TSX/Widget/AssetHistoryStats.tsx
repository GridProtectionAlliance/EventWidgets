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
import { Table, Column } from '@gpa-gemstone/react-table';
import { Select } from '@gpa-gemstone/react-forms';
import { Application, Gemstone } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

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

type TimeWindow = '999' | '12' | '1';

const TimeWindowOptions: Gemstone.TSX.Interfaces.ILabelValue<TimeWindow>[] = [
    { Value: "999", Label: "Lifetime" },
    { Value: "12", Label: "Last Year" },
    { Value: "1", Label: "Last Month" }
];

const AssetHistoryStats: EventWidget.IWidget<{}> = {
    Name: 'AssetHistoryStats',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [statsData, setStatsData] = React.useState<IStatsData | null>(null);
        const [time, setTime] = React.useState<TimeWindow>('999');
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setStatus('loading');
            const handle = getStatsData(props.HomePath, props.EventID, time);

            handle.done((data) => {
                setStatsData(data?.[0] ?? null);
                setStatus('idle');
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath, time]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Event Statistics for {statsData?.AssetName}:
                    <div className='pull-right'>
                        <div className="form-inline">
                            <Select
                                Record={{ time }}
                                Field='time'
                                Options={TimeWindowOptions}
                                Setter={(record) => setTime(record.time)}
                                Label="Time Window: "
                            />
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    {status === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : Object.entries(statsData ?? {}).length === 0 ? 
                            <Alert Class='alert-info'>
                                No data stats data.
                            </Alert>
                        :
                        <Table
                            Data={Object.entries(statsData ?? {}).map(([key, value]) => ({ Stat: key, Value: value }))}
                            OnSort={() => { /*Do Nothing*/ }}
                            KeySelector={(item) => item.Stat}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <Column
                                Key={'Stat'}
                                AllowSort={false}
                                Field={'Stat'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Stat
                            </Column>
                            <Column
                                Key={'Value'}
                                AllowSort={false}
                                Field={'Value'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > Value
                            </Column>
                        </Table>
                    }
                </div>
            </div>
        );
    }
};

const getStatsData = (homePath: string, eventID: number, time: TimeWindow) => {
    const url = time === '1' || time === '12'
        ? `${homePath}api/EventWidgets/AssetHistoryStats/${eventID}/${time}`
        : `${homePath}api/EventWidgets/AssetHistoryStats/${eventID}`;

    return $.ajax({
        url,
        method: 'GET',
        dataType: 'json',
        cache: false
    });
};

export default AssetHistoryStats;
