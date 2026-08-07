//******************************************************************************************************
//  DynamicSQLResultsTable.tsx - Gbtc
//
//  Copyright (c) 2025, Grid Protection Alliance.  All Rights Reserved.
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
//  08/07/2026 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { Column, Table } from '@gpa-gemstone/react-table';

export type DynamicSQLRow = Record<string, string | number | boolean | null>;

interface IProps {
    Data: DynamicSQLRow[];
    MaxHeight?: number;
}

const DynamicSQLResultsTable = (props: IProps) => {
    const fields = Object.keys(props.Data[0] ?? {});

    return (
        <Table<DynamicSQLRow>
            Data={props.Data}
            OnSort={() => { /*Do Nothing*/ }}
            SortKey={''}
            Ascending={true}
            TableClass="table"
            KeySelector={(_data, index = 0) => index}
            TbodyStyle={{ display: 'block', overflowY: 'auto', width: '100%', maxHeight: props.MaxHeight ?? 500, flex: 1 }}
        >
            {fields.map(field =>
                <Column<DynamicSQLRow>
                    key={field}
                    Key={field}
                    AllowSort={false}
                    Field={field}
                    HeaderStyle={{ width: 'auto' }}
                    RowStyle={{ width: 'auto' }}
                >
                    {field}
                </Column>
            )}
        </Table>
    );
}

export default DynamicSQLResultsTable;