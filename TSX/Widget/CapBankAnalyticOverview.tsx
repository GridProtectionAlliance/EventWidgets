//******************************************************************************************************
//  EventSearchCapBankAnalyticOverview.tsx - Gbtc
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
//  08/22/2019 - Christoph Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Alert } from '@gpa-gemstone/react-interactive';

interface ICapBankAnalytic {
    ID: number,
    Phase: string,
    Status: string,
    Operation: string,
    Resonance: boolean,
    CapBankHealth: string,
    PreInsertionSwitch: string,
    Restrike: string
}

const EventSearchCapBankAnalyticOverview: EventWidget.IWidget<{}> = {
    Name: 'CapBankAnalyticOverview',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<ICapBankAnalytic[]>([]);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setStatus('loading');

            const handle = getCapBankAnalytics(props.HomePath, props.EventID);

            handle.done((data) => {
                setData(data);
                setStatus('idle')
            }).fail(() => setStatus('error'));

            return () => {
                if (handle?.abort != null)
                    handle.abort();
            }
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    EPRI Capacitor Bank Analytic:
                </div>
                <div className="card-body">
                    {status === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : data.length === 0 ?
                            <Alert Class='alert-info'>
                                No capacitor bank analytic data.
                            </Alert> :
                            <Table<ICapBankAnalytic>
                                Data={data}
                                KeySelector={item => item.ID}
                                OnClick={() => { /* Do Nothing */ }}
                                OnSort={() => { /* Do Nothing */ }}
                                SortKey={''}
                                Ascending={true}
                                TableClass="table"
                                TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                                TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                                RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            >
                                <Column<ICapBankAnalytic>
                                    Key={'Phase'}
                                    AllowSort={false}
                                    Field={'Phase'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Phase
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'Status'}
                                    AllowSort={false}
                                    Field={'Status'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Analysis Status
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'Operation'}
                                    AllowSort={false}
                                    Field={'Operation'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Capacitor Bank Operation
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'Resonance'}
                                    AllowSort={false}
                                    Field={'Resonance'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Resonance
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'Health'}
                                    AllowSort={false}
                                    Field={'CapBankHealth'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Capacitor Bank Health
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'Restrike'}
                                    AllowSort={false}
                                    Field={'Restrike'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    Restrike
                                </Column>
                                <Column<ICapBankAnalytic>
                                    Key={'PIS'}
                                    AllowSort={false}
                                    Field={'PreInsertionSwitch'}
                                    HeaderStyle={{ width: 'auto' }}
                                    RowStyle={{ width: 'auto' }}
                                >
                                    PreInsertionSwitching Condition
                                </Column>
                            </Table>
                    }
                </div>
            </div>
        );
    }
}

const getCapBankAnalytics = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/OpenXDA/getCapBankAnalytic?eventId=${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    })
}

export default EventSearchCapBankAnalyticOverview;