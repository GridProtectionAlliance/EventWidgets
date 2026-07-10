//******************************************************************************************************
// EventInfo.tsx - Gbtc
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
//  10/11/2023 - Lillian Gensolin
//       Generated original version of source code.
//
//******************************************************************************************************

import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Select, DatePicker } from '@gpa-gemstone/react-forms';
import { Alert, Modal } from '@gpa-gemstone/react-interactive';
import * as React from 'react';
import { EventWidget } from '../global';
import moment from 'moment';
import _ from 'lodash';
import { Table, Column } from '@gpa-gemstone/react-table';
import { Application } from '@gpa-gemstone/application-typings';

interface IEventInfo {
    EventID: number;
    MeterName: string;
    AssetName: string;
    EventType: string;
    StartTime: string;
    EndTime: string;
    EventTypeID: string;
    LastUpdatedBy?: string;
}

interface IStat {
    Stat: string;
    Value: string;
    IsTime: boolean;
}

const momentDateFormat = "MM/DD/YYYY";
const momentTimeFormat = "HH:mm:ss.SSS";

const EventInfo: EventWidget.IWidget<{}> = {
    Name: 'EventInfo',
    DefaultSettings: {},
    Settings: () => <></>,
    Widget: (props: EventWidget.IWidgetProps<{}>) => {
        const [statsData, setStatsData] = React.useState<IEventInfo | undefined>(undefined);
        const [showModal, setShowModal] = React.useState<boolean>(false);
        const [status, setStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [forceUpdate, setForceUpdate] = React.useState<boolean>(false);

        React.useEffect(() => {
            setStatus('loading')
            const h = $.ajax({
                type: 'GET',
                url: `${props.HomePath}api/EventWidgets/EventInfo/${props.EventID}`,
                contentType: 'application/json; charset=utf-8',
                dataType: 'json',
                cache: true,
                async: true,
            });

            h.done((data) => {
                setStatsData(data[0]);
                setStatus('idle');
            })

            h.fail(() => setStatus('error'));

            return () => {
                if (h?.abort != null) {
                    h.abort();
                }
            }
        }, [props.EventID, forceUpdate]);

        const rows = React.useMemo(() => {
            if (statsData == null)
                return [];

            const rows: IStat[] = [];

            rows.push({ Stat: 'Meter', Value: statsData.MeterName, IsTime: false });
            rows.push({ Stat: 'Asset', Value: statsData.AssetName, IsTime: false });
            rows.push({ Stat: 'Event Type', Value: statsData.EventType, IsTime: false });
            rows.push({ Stat: 'Start Time', Value: statsData.StartTime, IsTime: true });
            rows.push({ Stat: 'End Time', Value: statsData.EndTime, IsTime: true });
            rows.push({ Stat: 'Last Updated By', Value: statsData.LastUpdatedBy ?? 'n/a', IsTime: false });

            return rows;
        }, [statsData]);

        function saveChange() {
            $.ajax({
                url: `${homePath}api/EventWidgets/EventInfo/save/${props.EventID}`,
                type: 'POST',
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                data: JSON.stringify(statsData)

            }).then(() => { setForceUpdate(x => !x) })
        }

        return (
            <div className="card">
                <div className="card-header">
                    <div className='row'>
                        <div className='col-6'>
                            Event Info:
                        </div>
                        <div className="col-6 justify-content-end d-flex">
                            {props.WidgetAuthorization.EventInfo.Update ?
                            <button className="btn btn-sm"
                                onClick={() => {
                                    setShowModal(true);
                                }}
                            >
                                <ReactIcons.Pencil />
                            </button>
                            : null}
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    {status === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching event info data.
                        </Alert>
                    : null}
                    {status === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center flex-column' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : rows.length === 0 ?
                            <Alert Class='alert-info'>
                                No event info data.
                            </Alert>
                            :
                            <Table<IStat>
                                TableClass="table table-hover"
                                Data={rows}
                                SortKey={''}
                                Ascending={false}
                                TableStyle={{
                                    padding: 0, width: 'calc(100%)', height: 'calc(100% - 16px)',
                                    tableLayout: 'fixed', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                                }}
                                TheadStyle={{ fontSize: 'smaller', tableLayout: 'fixed', display: 'table', width: '100%' }}
                                TbodyStyle={{ display: 'block', overflowY: 'auto', flex: 1 }}
                                RowStyle={{ display: 'table', tableLayout: 'fixed', width: '100%' }}
                                Selected={() => false}
                                KeySelector={(item) => item.Stat}
                                OnSort={() => { }}
                            >
                                <Column<IStat>
                                    Key={'Stat'}
                                    AllowSort={false}
                                    Field={'Stat'}
                                    HeaderStyle={{ width: 'auto', textAlign: 'left' }}
                                    RowStyle={{ width: 'auto', textAlign: 'left' }}
                                >
                                    Property
                                </Column>
                                <Column<IStat>
                                    Key={'Value'}
                                    AllowSort={false}
                                    Field={'Value'}
                                    HeaderStyle={{ width: 'auto', textAlign: 'right' }}
                                    RowStyle={{ width: 'auto', textAlign: 'right' }}
                                    Content={(d) => d.item.IsTime ? moment(d.item.Value).format(momentDateFormat + ' ' + momentTimeFormat) : d.item.Value}
                                >
                                    Value
                                </Column>
                            </Table>}
                </div>

                {statsData == null ? null :
                    <Modal
                        Title={'Edit Event Info:'}
                        ShowX={true}
                        Show={showModal}
                        Size={'lg'}
                        ShowCancel={false}
                        CallBack={(c, b) => {
                            if (c)
                                saveChange();
                            setStatsData(undefined);
                            if (!c)
                                setForceUpdate(x => !x)
                            setShowModal(false);
                        }}
                    >
                        <div className="row">
                            <div className="col-12">
                                <Select<IEventInfo>
                                    Record={statsData}
                                    Field='EventTypeID'
                                    Options={
                                        props.EventTypes.map((type) => { return { Value: type.ID.toString(), Label: type.Name } })
                                    }
                                    Setter={(r) => {
                                        const updatedStatsData = { ...statsData, EventTypeID: r.EventTypeID };
                                        setStatsData(updatedStatsData);
                                    }}
                                    Label="Event Type"
                                />
                            </div>
                            <div className="col-12">
                                <DatePicker<IEventInfo>
                                    Record={statsData}
                                    Field={'StartTime'}
                                    Setter={(r) => {
                                        const diff = moment(statsData.EndTime).diff(moment(statsData.StartTime));
                                        const updatedStatsData = { ...statsData, StartTime: r.StartTime, EndTime: moment(r.StartTime).add(diff).toISOString() };
                                        setStatsData(updatedStatsData);
                                    }}
                                    Type='datetime-local'
                                    Valid={() => (true)}
                                />
                            </div>
                            <div className="col-12">
                                <DatePicker<IEventInfo>
                                    Record={statsData}
                                    Field={'EndTime'}
                                    Setter={(r) => {
                                        const diff = moment(statsData.EndTime).diff(moment(statsData.StartTime));
                                        const updatedStatsData = { ...statsData, EndTime: r.EndTime, StartTime: moment(r.EndTime).subtract(diff).toISOString() };
                                        setStatsData(updatedStatsData);
                                    }}
                                    Type='datetime-local'
                                    Valid={() => (true)}
                                />
                            </div>
                        </div>

                    </Modal>
                }
            </div>

        );
    }
};

export default EventInfo;
