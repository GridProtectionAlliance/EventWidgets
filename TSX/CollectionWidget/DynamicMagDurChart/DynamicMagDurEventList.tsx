//******************************************************************************************************
//  DynamicMagDurEventList.tsx - Gbtc
//
//  Copyright (c) 2026, Grid Protection Alliance.  All Rights Reserved.
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
//  07/01/2026 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************

import * as React from 'react';
import { Modal } from '@gpa-gemstone/react-interactive';
import { DynamicEventSearchRow } from '../DynamicEventTable/DynamicEventSearchData';
import { DynamicEventSearchList } from '../DynamicEventTable/DynamicEventSearchTable';
import { LocalStorageKey } from '../DynamicEventTable/DynamicEventSearch';

interface IProps {
    Select: (eventID: number, row?: DynamicEventSearchRow) => void;
    Magnitude: number;
    Duration: number;
    Height: number;
    Data: DynamicEventSearchRow[];
    SortField: string;
    Ascending: boolean;
    OnSort: (colKey: string) => void;
    OnClose: () => void;
}

export function DynamicMagDurEventList(props: IProps) {
    const show = props.Magnitude !== 0 && props.Duration !== 0;

    const data = React.useMemo(() => props.Data.filter(p =>
        Math.abs((p.MagDurDuration ?? 0) - props.Duration) < 1E-10 && Math.abs((p.MagDurMagnitude ?? 0) - props.Magnitude) < 0.0001),
        [props.Data, props.Magnitude, props.Duration]);

    return (
        <Modal
            Title={''}
            Show={show}
            Size={'lg'}
            ShowCancel={false}
            ShowConfirm={false}
            ShowX={true}
            CallBack={props.OnClose}
        >
            <div className={'magDurChartSelection'}>
                <DynamicEventSearchList
                    Eventid={-1}
                    SelectEvent={(eventID, row) => { props.Select(eventID, row); props.OnClose(); }}
                    Height={props.Height}
                    Data={data}
                    Status={'idle'}
                    SortField={props.SortField}
                    Ascending={props.Ascending}
                    OnSort={props.OnSort}
                    LocalStorageKey={LocalStorageKey}
                />
            </div>
        </Modal>
    )
}
