//******************************************************************************************************
//  NoteWindow.tsx - Gbtc
//
//  Copyright (c) 2019, Grid Protection Alliance.  All Rights Reserved.
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
import { OpenXDA } from '@gpa-gemstone/application-typings';
import { Select, TextArea } from '@gpa-gemstone/react-forms';

interface IProps {
    Record: OpenXDA.Types.Note,
    Setter: (note: OpenXDA.Types.Note) => void,
    NoteTags: OpenXDA.Types.NoteTag[],
    NoteApplications: OpenXDA.Types.NoteApplication[],
    ShowApplications?: boolean
}

const NoteOptions = (props: IProps) => {
    const showOptions = props.NoteTags.length > 1 || (props.ShowApplications === true && props.NoteApplications.length > 1);

    return (
        <div className='row' style={{ marginRight: 0, marginLeft: 0 }}>
            <div className={showOptions ? 'col-6' : 'col-12'}>
                <TextArea<OpenXDA.Types.Note>
                    Record={props.Record}
                    Rows={4}
                    Field='Note'
                    Setter={props.Setter}
                    Valid={() => props.Record.Note != null && props.Record.Note.length > 0}
                    Label=''
                />
            </div>
            {showOptions ?
                <div className='col-6'>
                    {props.NoteTags.length > 1 ?
                        <Select<OpenXDA.Types.Note>
                            Record={props.Record}
                            Field='NoteTagID'
                            Label='Type: '
                            Options={props.NoteTags.map((tag) => ({ Value: tag.ID.toString(), Label: tag.Name }))}
                            Setter={(record) => props.Setter({ ...record, NoteTagID: parseInt(record.NoteTagID.toString(), 10) })}
                        />
                        : null}
                    {props.ShowApplications === true && props.NoteApplications.length > 1 ?
                        <Select<OpenXDA.Types.Note>
                            Record={props.Record}
                            Field='NoteApplicationID'
                            Label='Application: '
                            Options={props.NoteApplications.map((app) => ({ Value: app.ID.toString(), Label: app.Name }))}
                            Setter={(record) => props.Setter({ ...record, NoteApplicationID: parseInt(record.NoteApplicationID.toString(), 10) })}
                        />
                        : null}
                </div>
                : null}
        </div>
    );
}

export default NoteOptions;
