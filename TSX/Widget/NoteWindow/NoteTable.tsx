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
import moment from 'moment';
import { OpenXDA } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { Modal } from '@gpa-gemstone/react-interactive';
import { ToolTip } from '@gpa-gemstone/react-forms';
import { Column, Table } from '@gpa-gemstone/react-table';
import NoteOptions from './NoteOptions';

interface IProps {
    Notes: OpenXDA.Types.Note[],
    NoteTags: OpenXDA.Types.NoteTag[],
    NoteApplications: OpenXDA.Types.NoteApplication[],
    SortField: keyof OpenXDA.Types.Note,
    Ascending: boolean,
    MaxHeight: number,
    AllowCreate: boolean,
    AllowUpdate: boolean,
    NewNote: OpenXDA.Types.Note,
    SetNewNote: (note: OpenXDA.Types.Note) => void,
    EditNote: OpenXDA.Types.Note,
    SetEditNote: (note: OpenXDA.Types.Note) => void,
    ShowEdit: boolean,
    Hover: 'none' | 'add' | 'clear',
    SetHover: (hover: 'none' | 'add' | 'clear') => void,
    OnSort: (data: { colField?: keyof OpenXDA.Types.Note }) => void,
    OnAdd: (note: OpenXDA.Types.Note) => void,
    OnEdit: (note: OpenXDA.Types.Note) => void,
    OnSaveEdit: (confirm: boolean) => void
}

const NoteTable = (props: IProps) => {
    const useFixedApp = props.NoteApplications.length === 1;

    return (
        <div style={{ border: '0px', maxHeight: props.MaxHeight, width: '100%' }}>
            <div style={{ maxHeight: props.MaxHeight - 100, overflowY: 'auto', width: '100%' }}>
                {props.AllowCreate ?
                    <>
                        <NoteOptions
                            Record={props.NewNote}
                            Setter={props.SetNewNote}
                            NoteTags={props.NoteTags}
                            NoteApplications={props.NoteApplications}
                            ShowApplications={!useFixedApp}
                        />
                        <div className='btn-group mr-2'>
                            <button
                                className={`btn btn-primary${props.NewNote.Note == null || props.NewNote.Note.length === 0 ? ' disabled' : ''}`}
                                onClick={() => { if (props.NewNote.Note != null && props.NewNote.Note.length > 0) props.OnAdd(props.NewNote); }}
                                data-tooltip='Add'
                                style={{ cursor: props.NewNote.Note == null || props.NewNote.Note.length === 0 ? 'not-allowed' : 'pointer' }}
                                onMouseOver={() => props.SetHover('add')}
                                onMouseOut={() => props.SetHover('none')}
                            >
                                Add Note
                            </button>
                            <ToolTip Show={props.Hover === 'add' && (props.NewNote.Note == null || props.NewNote.Note.length === 0)} Position='top' Target='Add'>
                                <p><ReactIcons.CrossMark /> A note needs to be entered.</p>
                            </ToolTip>
                        </div>
                        <div className='btn-group mr-2'>
                            <button
                                className={`btn btn-default${props.NewNote.Note == null || props.NewNote.Note.length === 0 ? ' disabled' : ''}`}
                                onClick={() => props.SetNewNote({ ...props.NewNote, Note: '' })}
                                style={{ cursor: props.NewNote.Note == null || props.NewNote.Note.length === 0 ? 'not-allowed' : 'pointer' }}
                                data-tooltip='ClearNote'
                                onMouseOver={() => props.SetHover('clear')}
                                onMouseOut={() => props.SetHover('none')}
                            >
                                Clear
                            </button>
                            <ToolTip Show={props.Hover === 'clear' && (props.NewNote.Note == null || props.NewNote.Note.length === 0)} Position='top' Target='ClearNote'>
                                <p><ReactIcons.CrossMark /> The note field is already empty.</p>
                            </ToolTip>
                        </div>
                    </>
                    : null}
                <Table<OpenXDA.Types.Note>
                    TableClass='table table-hover'
                    Data={props.Notes}
                    SortKey={props.SortField.toString()}
                    Ascending={props.Ascending}
                    OnSort={props.OnSort}
                    OnClick={() => { return; }}
                    TbodyStyle={{ maxHeight: props.MaxHeight - 300 }}
                    Selected={() => false}
                    KeySelector={(note) => note.ID}
                >
                    <Column<OpenXDA.Types.Note>
                        Key='Note'
                        Field='Note'
                        HeaderStyle={{ width: '50%' }}
                        RowStyle={{ width: '50%' }}
                    >
                        Note
                    </Column>
                    <Column<OpenXDA.Types.Note>
                        Key='Timestamp'
                        Field='Timestamp'
                        HeaderStyle={{ width: 'auto' }}
                        RowStyle={{ width: 'auto' }}
                        Content={(row) => moment.utc(row.item.Timestamp).format('MM/DD/YYYY HH:mm')}
                    >
                        Time
                    </Column>
                    <Column<OpenXDA.Types.Note>
                        Key='UserAccount'
                        Field='UserAccount'
                        HeaderStyle={{ width: 'auto' }}
                        RowStyle={{ width: 'auto' }}
                    >
                        User
                    </Column>
                    {props.NoteTags.length > 1 ?
                        <Column<OpenXDA.Types.Note>
                            Key='NoteTagID'
                            Field='NoteTagID'
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={(row) => props.NoteTags.find((tag) => tag.ID === row.item.NoteTagID)?.Name}
                        >
                            Type
                        </Column>
                        :
                        <></>
                    }
                    {props.NoteApplications.length > 1 ?
                        <Column<OpenXDA.Types.Note>
                            Key='NoteApplicationID'
                            Field='NoteApplicationID'
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={(row) => props.NoteApplications.find((app) => app.ID === row.item.NoteApplicationID)?.Name}
                        >
                            Application
                        </Column>
                        :
                        <></>
                    }
                    {props.AllowUpdate ?
                        <Column<OpenXDA.Types.Note>
                            Key='buttons'
                            HeaderStyle={{ width: 'auto' }}
                            RowStyle={{ width: 'auto' }}
                            Content={(row) =>
                                <button className='btn btn-sm' onClick={() => props.OnEdit(row.item)}>
                                    <ReactIcons.Pencil />
                                </button>
                            }
                        >
                            &nbsp;
                        </Column>
                        : <></>
                    }
                </Table>
                <Modal
                    Show={props.ShowEdit}
                    Title='Edit Note'
                    ShowCancel={true}
                    CallBack={props.OnSaveEdit}
                    DisableConfirm={props.EditNote.Note == null || props.EditNote.Note.length === 0}
                    ShowX={true}
                    ConfirmShowToolTip={props.EditNote.Note == null || props.EditNote.Note.length === 0}
                    ConfirmToolTipContent={<p><ReactIcons.CrossMark /> An empty Note can not be saved.</p>}
                >
                    <NoteOptions
                        ShowApplications={!useFixedApp}
                        Record={props.EditNote}
                        Setter={props.SetEditNote}
                        NoteTags={props.NoteTags}
                        NoteApplications={props.NoteApplications}
                    />
                </Modal>
            </div>
        </div>
    );
}

export default NoteTable;
