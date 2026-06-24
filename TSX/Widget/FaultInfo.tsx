//******************************************************************************************************
//  TVAESRIMap.tsx - Gbtc
//
//  Copyright � 2020, Grid Protection Alliance.  All Rights Reserved.
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
//  02/27/2020 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import moment from 'moment';
import { EventWidget } from '../global';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Application } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';

interface IFaultInfo {
    FaultTime?: string,
    FaultDuration?: number,
    FaultType?: string,
    FaultDistance?: number,
    StationID?: string,
    StationName?: string,
    LineName?: string,
    LineAssetKey?: string,
    DblDist?: number,
    TreeFaultResistance?: number
    Key: string,
    Value: string
}

interface ILinks {
    ID: number,
    Name: string,
    Display: string,
    Value: string
}

const FaultInfo: EventWidget.IWidget<{}> = {
    Name: 'FaultInfo',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [hidden, setHidden] = React.useState<boolean>(true);
        const [faultInfo, setFaultInfo] = React.useState<IFaultInfo[]>([]);
        const [links, setLinks] = React.useState<ILinks[]>([]);
        const [faultInfoStatus, setFaultInfoStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [linksStatus, setLinksStatus] = React.useState<Application.Types.Status>('uninitiated');

        React.useEffect(() => {
            setFaultInfoStatus('loading');
            setHidden(false);
            const handle = getFaultInfo(props.HomePath, props.EventID);

            handle.done((data) => {
                setHidden(data.length === 0);
                setFaultInfo(data);
                setFaultInfoStatus('idle');
            }).fail(() => {
                setHidden(true);
                setFaultInfoStatus('error');
            });

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            };
        }, [props.EventID, props.HomePath]);

        React.useEffect(() => {
            setLinksStatus('loading');
            const handle = getFaultInfoLinks(props.HomePath);

            handle.done((data) => {
                setLinks(data);
                setLinksStatus('idle');
            }).fail(() => setLinksStatus('error'));

            return () => {
                if (handle?.abort != null) {
                    handle.abort();
                }
            }
        }, [props.EventID, props.HomePath]);

        return (
            <div className="card" hidden={hidden}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Fault Information:
                    {linksStatus === 'loading' ?
                        <div className='pull-right'>
                            <ReactIcons.SpiningIcon Size={'1em'} />
                        </div>
                        : null
                    }
                </div>
                <div className="card-body">
                    {faultInfoStatus === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: props.MaxHeight ?? 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        :
                        <Table<IFaultInfo>
                            Data={faultInfo}
                            KeySelector={(item) => item.Key}
                            OnClick={() => { /* Do Nothing */ }}
                            OnSort={() => { /* Do Nothing */ }}
                            SortKey={''}
                            Ascending={true}
                            TableClass="table"
                            TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                            RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        >
                            <Column<IFaultInfo>
                                Key={'Key'}
                                AllowSort={false}
                                Field={'Key'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > {" "}
                            </Column>
                            <Column<IFaultInfo>
                                Key={'Value'}
                                AllowSort={false}
                                Field={'Value'}
                                HeaderStyle={{ width: 'auto' }}
                                RowStyle={{ width: 'auto' }}
                            > {" "}
                            </Column>
                        </Table>
                    }
                </div>
            </div>
        );
    }
}

const getFaultInfo = (homePath: string, eventID: number) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/FaultInformation/${eventID}`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

const getFaultInfoLinks = (homePath: string) => {
    return $.ajax({
        type: "GET",
        url: `${homePath}api/EventWidgets/FaultInformation/GetLinks/FaultInfo`,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        cache: true,
        async: true
    });
};

export default FaultInfo;