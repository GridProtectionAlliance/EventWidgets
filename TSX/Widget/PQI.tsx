//******************************************************************************************************
//  EventSearchPQI.tsx - Gbtc
//
//  Copyright � 2022, Grid Protection Alliance.  All Rights Reserved.
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
import Table from '@gpa-gemstone/react-table';
import { PQI } from '@gpa-gemstone/application-typings';
import { EventWidget } from '../global';

const EventSearchPQI: EventWidget.IWidget<{}> = {
    Name: 'pqi',
    DefaultSettings: {},
    Settings: () => {
        return <></>
    },
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [data, setData] = React.useState<PQI.Types.Equipment[]>([]);

        React.useEffect(() => {
            const handle = getData();
            return () => { if (handle != null && handle.abort != null) handle.abort(); }
        }, [])

        function getData() {

            return $.ajax({
                type: "GET",
                url: `${props.HomePath}api/PQI/GetEquipment/${props.EventID}`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            }).done((d) => { setData(d); });

        }

        return (
            <div className="card">
                <div className="card-header fixed-top" style={{ position: 'sticky', background: '#f7f7f7' }}>
                    Power Quality Investigator:
                </div>
                <div className="card-body">
                    <div className='row'>
                        <div className='col'>
                            <Table<PQI.Types.Equipment>
                                cols={[
                                    { key: 'Customer', field: 'Facility', label: 'Customer' },
                                    { key: 'Area', field: 'Area', label: 'Area' },
                                    { key: 'SectionTitle', field: 'SectionTitle', label: 'Section' },
                                    { key: 'ComponentModel', field: 'ComponentModel', label: 'Component Model' },
                                    { key: 'Manufacturer', field: 'Manufacturer', label: 'Manufacturer' },
                                    { key: 'Series', field: 'Series', label: 'Series' },
                                    { key: 'ComponentType', field: 'ComponentType', label: 'Component Type' }
                                ]}
                                data={data}
                                onSort={() => {/*Do Nothing*/ }}
                                sortKey={''}
                                ascending={true}
                                tableClass="table"
                                theadStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%', height: 50 }}
                                tbodyStyle={{ display: 'block', overflowY: 'scroll', maxHeight: props.MaxHeight ?? 500, width: '100%' }}
                                rowStyle={{ fontSize: 'smaller', display: 'table', tableLayout: 'fixed', width: '100%' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


export default EventSearchPQI;
