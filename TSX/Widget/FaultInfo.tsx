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
import { ReactTable } from '@gpa-gemstone/react-table';

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

        React.useEffect(() => {
            return GetData();
        }, [props.EventID]);

        function GetData() {
            const handle = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FaultInformation/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            const handle2 = $.ajax({
                type: "GET",
                url: `${props.HomePath}api/FaultInformation/GetLinks/FaultInfo`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done(data => {
                if (data.length > 0) {
                    setHidden(false);
                }
                setFaultInfo(data);
            });

            handle2.done(data => setLinks(data));

            return function () {
                if (handle.abort != undefined) handle.abort();
                if (handle2.abort != undefined) handle2.abort();
            }
        }

        function TreeProbability(value: number): string {
            if (value == null) return 'Undetermined';
            else if (value > 20) return `High (Rf=${value.toFixed(2)})`;
            else if (value > 10) return `Medium (Rf=${value.toFixed(2)})`;
            else return `Low (Rf=${value.toFixed(2)})`;
        }

        return (
            <div className="card" hidden={hidden}>
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>Fault Information:</div>
                <div className="card-body">
                    <ReactTable.Table<IFaultInfo>
                        Data={faultInfo}
                        KeySelector={(item) => item.Key}
                        OnClick={() => { /* Do Nothing */ }}
                        OnSort={() => { /* Do Nothing */ }}
                        SortKey={''}
                        Ascending={true}
                        TableClass="table"
                        TheadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                        TbodyStyle={{ display: 'block', overflowY: 'scroll', width: '100%', maxHeight: props.MaxHeight ?? 500 }}
                        RowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                    >
                        <ReactTable.Column<IFaultInfo>
                            Key={'Key'}
                            AllowSort={false}
                            Field={'Key'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > {" "}
                        </ReactTable.Column>
                        <ReactTable.Column<IFaultInfo>
                            Key={'Value'}
                            AllowSort={false}
                            Field={'Value'}
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                        > {" "}
                        </ReactTable.Column>
                    </ReactTable.Table>
                </div>
            </div>
        );
    }
}

export default FaultInfo;