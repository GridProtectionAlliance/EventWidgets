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
import { Application, OpenXDA } from '@gpa-gemstone/application-typings';
import { ReactIcons } from '@gpa-gemstone/gpa-symbols';
import { ReadWriteControllerFunctions_Gemstone } from '@gpa-gemstone/common-pages';
import { Alert } from '@gpa-gemstone/react-interactive';
import { MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import { EventWidget } from '../../global';
import NoteTable from './NoteTable';

interface ISetting {
    NoteTypes: string[],
    NoteTags: string[]
}

interface INoteIDs {
    EventID: number,
    MeterID: number,
    AssetID: number,
    LocationID: number
}

interface IEventInformation {
    Meter: number,
    Asset: number,
    Location: number
}

type NoteRecordName = 'Event' | 'Meter' | 'Asset' | 'Location';
type NoteController = ReadWriteControllerFunctions_Gemstone<OpenXDA.Types.Note>;

const supportedNoteTypes: NoteRecordName[] = ['Event', 'Meter', 'Asset', 'Location'];

const defaultNoteType: OpenXDA.Types.NoteType = { ID: -1, Name: 'Event', ReferenceTableName: 'Event' };
const defaultNoteApp: OpenXDA.Types.NoteApplication = { ID: -1, Name: 'SEbrowser' };

const NoteWidget: EventWidget.IWidget<ISetting> = {
    Name: 'Notes',
    DefaultSettings: { NoteTags: [], NoteTypes: [] },
    Settings: () => <></>,
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [noteType, setNoteType] = React.useState<OpenXDA.Types.NoteType>(defaultNoteType);
        const [noteApp, setNoteApp] = React.useState<OpenXDA.Types.NoteApplication>(defaultNoteApp);
        const [noteTypes, setNoteTypes] = React.useState<OpenXDA.Types.NoteType[]>([]);
        const [noteTags, setNoteTags] = React.useState<OpenXDA.Types.NoteTag[]>([]);
        const [selectedTags, setSelectedTags] = React.useState<number[]>([]);
        const [ids, setIDs] = React.useState<INoteIDs>({ EventID: props.EventID, MeterID: -1, AssetID: -1, LocationID: -1 });
        const [notes, setNotes] = React.useState<OpenXDA.Types.Note[]>([]);
        const [idStatus, setIDStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [noteTypeStatus, setNoteTypeStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [noteTagStatus, setNoteTagStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [noteAppStatus, setNoteAppStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [noteStatus, setNoteStatus] = React.useState<Application.Types.Status>('uninitiated');
        const [sortField, setSortField] = React.useState<keyof OpenXDA.Types.Note>('Timestamp');
        const [ascending, setAscending] = React.useState<boolean>(true);
        const [refreshToken, setRefreshToken] = React.useState<number>(0);
        const [newNote, setNewNote] = React.useState<OpenXDA.Types.Note>(createBlankNote(defaultNoteType, defaultNoteApp, -1, []));
        const [editNote, setEditNote] = React.useState<OpenXDA.Types.Note>(createBlankNote(defaultNoteType, defaultNoteApp, -1, []));
        const [showEdit, setShowEdit] = React.useState<boolean>(false);
        const [hover, setHover] = React.useState<'none' | 'add' | 'clear'>('none');

        const canModify = props.WidgetAuthorization.Notes.CanModify;

        const controllers = React.useMemo(() => ({
            Event: new ReadWriteControllerFunctions_Gemstone<OpenXDA.Types.Note>(`${props.HomePath}api/OpenXDA/Note/Event`),
            Meter: new ReadWriteControllerFunctions_Gemstone<OpenXDA.Types.Note>(`${props.HomePath}api/OpenXDA/Note/Meter`),
            Asset: new ReadWriteControllerFunctions_Gemstone<OpenXDA.Types.Note>(`${props.HomePath}api/OpenXDA/Note/Asset`),
            Location: new ReadWriteControllerFunctions_Gemstone<OpenXDA.Types.Note>(`${props.HomePath}api/OpenXDA/Note/Location`)
        }), [props.HomePath]);

        const activeRecordName = noteType.Name as NoteRecordName;
        const activeReferenceID = getReferenceID(activeRecordName, ids);
        const activeTags = React.useMemo(() => noteTags.filter((tag) => selectedTags.indexOf(tag.ID) >= 0), [noteTags, selectedTags]);
        const filteredNotes = React.useMemo(() =>
            selectedTags.length === 0 ? [] : notes.filter((note) => selectedTags.indexOf(note.NoteTagID) >= 0),
            [notes, selectedTags]);
        const metadataLoading = statusIsLoading(idStatus, noteTypeStatus, noteTagStatus, noteAppStatus);
        const metadataError = statusIsError(idStatus, noteTypeStatus, noteTagStatus, noteAppStatus);

        React.useEffect(() => {
            setIDStatus('loading');
            const handle = getIDs(props.HomePath, props.EventID);

            handle.done((data) => {
                setIDs({
                    EventID: props.EventID,
                    MeterID: data.Meter,
                    AssetID: data.Asset,
                    LocationID: data.Location
                });
                setIDStatus('idle');
            }).fail(() => setIDStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); };
        }, [props.EventID, props.HomePath]);

        React.useEffect(() => {
            setNoteTypeStatus('loading');
            const handle = getNoteTypes(props.HomePath);

            handle.done((data) => {
                const supported = data.filter((type) => isSupportedNoteType(type.Name));

                if (props.Settings?.NoteTypes == null || props.Settings.NoteTypes.length === 0)
                    setNoteTypes(supported);
                else
                    setNoteTypes(props.Settings.NoteTypes
                        .map((typeName) => supported.find((type) => type.Name.toLocaleLowerCase() === typeName.toLocaleLowerCase()))
                        .filter((type): type is OpenXDA.Types.NoteType => type != null));

                setNoteTypeStatus('idle');
            }).fail(() => setNoteTypeStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); };
        }, [props.HomePath, props.Settings]);

        React.useEffect(() => {
            setNoteTagStatus('loading');
            const handle = getNoteTags(props.HomePath);

            handle.done((data) => {
                if (props.Settings?.NoteTags == null || props.Settings.NoteTags.length === 0)
                    setNoteTags(data);
                else
                    setNoteTags(props.Settings.NoteTags
                        .map((tagName) => data.find((tag) => tag.Name.toLocaleLowerCase() === tagName.toLocaleLowerCase()))
                        .filter((tag): tag is OpenXDA.Types.NoteTag => tag != null));

                setNoteTagStatus('idle');
            }).fail(() => setNoteTagStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); };
        }, [props.HomePath, props.Settings]);

        React.useEffect(() => {
            setNoteAppStatus('loading');
            const handle = getNoteApp(props.HomePath);

            handle.done((data) => {
                setNoteApp(data.find((app) => app.Name === 'SEbrowser') ?? defaultNoteApp);
                setNoteAppStatus('idle');
            }).fail(() => setNoteAppStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); };
        }, [props.HomePath]);

        React.useEffect(() => {
            if (noteTypes.length === 0) return;

            setNoteType((current) => {
                if (noteTypes.find((type) => type.ID === current.ID) != null)
                    return current;

                return noteTypes.find((type) => type.Name === 'Event') ?? noteTypes[0];
            });
        }, [noteTypes]);

        React.useEffect(() => {
            setSelectedTags((current) => current.filter((id) => noteTags.find((tag) => tag.ID === id) != null));
        }, [noteTags]);

        React.useEffect(() => {
            setNewNote((note) => ensureNoteDefaults(note, noteType, noteApp, activeReferenceID, activeTags));
        }, [noteType, noteApp, activeReferenceID, activeTags]);

        React.useEffect(() => {
            if (metadataLoading || metadataError) {
                setNotes([]);
                return;
            }

            if (!isSupportedNoteType(noteType.Name) || activeReferenceID <= 0) {
                setNotes([]);
                setNoteStatus('idle');
                return;
            }

            setNoteStatus('loading');
            const handle = getNotes(controllers[activeRecordName], sortField, ascending, activeReferenceID);

            handle.done((data) => {
                setNotes(data);
                setNoteStatus('idle');
            }).fail(() => setNoteStatus('error'));

            return () => { if (handle?.abort != null) handle.abort(); };
        }, [activeRecordName, activeReferenceID, ascending, controllers, metadataError, metadataLoading, noteType.Name, props.EventID, refreshToken, sortField]);

        const handleTagChange = (_: any, changed: { Value: number | string, Label: string | JSX.Element, Selected: boolean }[]): void => {
            setSelectedTags((current) => {
                const updated = current.filter((id) => changed.findIndex((option) => parseInt(option.Value.toString(), 10) === id) < 0);
                updated.push(...changed
                    .filter((option) => !option.Selected)
                    .map((option) => parseInt(option.Value.toString(), 10)));
                return updated;
            });
        };

        const handleSort = (data: { colField?: keyof OpenXDA.Types.Note }): void => {
            if (data.colField == null) return;

            if (data.colField === sortField)
                setAscending((value) => !value);
            else {
                setSortField(data.colField);
                setAscending(true);
            }
        };

        const handleAdd = (record: OpenXDA.Types.Note): void => {
            const note = createActionNote(record);

            setNoteStatus('loading');
            addNote(controllers[activeRecordName], note).done(() => {
                setNewNote(createBlankNote(noteType, noteApp, activeReferenceID, activeTags));
                setRefreshToken((token) => token + 1);
            }).fail(() => setNoteStatus('error'));
        };

        const handleEdit = (record: OpenXDA.Types.Note): void => {
            setEditNote(record);
            setShowEdit(true);
        };

        const handleSaveEdit = (confirm: boolean): void => {
            setShowEdit(false);

            if (!confirm || !canModify) {
                setEditNote(createBlankNote(noteType, noteApp, activeReferenceID, activeTags));
                return;
            }

            if (editNote.Note == null || editNote.Note.length === 0)
                return;

            const note = createActionNote(editNote);

            setNoteStatus('loading');
            updateNote(controllers[activeRecordName], note).done(() => {
                setEditNote(createBlankNote(noteType, noteApp, activeReferenceID, activeTags));
                setRefreshToken((token) => token + 1);
            }).fail(() => setNoteStatus('error'));
        };

        const createActionNote = (record: OpenXDA.Types.Note): OpenXDA.Types.Note => {
            return {
                ...record,
                ReferenceTableID: activeReferenceID,
                NoteTypeID: noteType.ID,
                NoteApplicationID: record.NoteApplicationID > 0 ? record.NoteApplicationID : noteApp.ID,
                NoteTagID: activeTags.find((tag) => tag.ID === record.NoteTagID)?.ID ?? activeTags[0]?.ID ?? -1,
                Timestamp: record.ID > 0 ? record.Timestamp : moment().format('MM/DD/YYYY HH:mm'),
                UserAccount: record.ID > 0 ? record.UserAccount : undefined
            };
        };

        if (!isSupportedNoteType(noteType.Name))
            return null;

        return (
            <div className='card' style={{ maxHeight: props.MaxHeight ?? 500 }}>
                <div className='card-header fixed-top' style={{ position: 'sticky', background: '#f7f7f7' }}>Notes:</div>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col'>
                            <MultiCheckBoxSelect
                                Label={'Types:'}
                                Options={noteTags.map((tag) => ({ Selected: selectedTags.find((id) => id === tag.ID) != null, Label: tag.Name, Value: tag.ID }))}
                                OnChange={handleTagChange}
                                ShowToolTip={true}
                            />
                            <Select<OpenXDA.Types.NoteType>
                                Record={noteType}
                                Label={'Record:'}
                                Options={noteTypes.map((type) => ({ Label: type.Label ?? type.Name, Value: type.ID.toString() }))}
                                Setter={(record) => {
                                    const selectedType = noteTypes.find((type) => type.ID === parseInt(record.ID.toString(), 10));
                                    if (selectedType != null) setNoteType(selectedType);
                                }}
                                Field={'ID'}
                            />
                        </div>
                    </div>
                    {metadataError || noteStatus === 'error' ?
                        <Alert Class='alert-danger'>
                            An error occurred while fetching note data.
                        </Alert>
                    : null}
                    {metadataLoading || noteStatus === 'loading' ?
                        <div className='d-flex align-items-center justify-content-center' style={{ height: 250 }}>
                            <ReactIcons.SpiningIcon Size={'50%'} />
                        </div>
                        : selectedTags.length === 0 ?
                                <div className={'alert alert-warning'}>
                                    <p>At least 1 Type needs to be selected.</p>
                                </div>
                                :
                                <NoteTable
                                    Notes={filteredNotes}
                                    NoteTags={activeTags}
                                    NoteApplications={[noteApp]}
                                    SortField={sortField}
                                    Ascending={ascending}
                                    MaxHeight={props.MaxHeight ?? 500}
                                    AllowEdit={canModify}
                                    NewNote={newNote}
                                    SetNewNote={setNewNote}
                                    EditNote={editNote}
                                    SetEditNote={setEditNote}
                                    ShowEdit={showEdit}
                                    Hover={hover}
                                    SetHover={setHover}
                                    OnSort={handleSort}
                                    OnAdd={handleAdd}
                                    OnEdit={handleEdit}
                                    OnSaveEdit={handleSaveEdit}
                                />
                    }
                </div>
            </div>
        );
    }
};


const createBlankNote = (noteType: OpenXDA.Types.NoteType, noteApp: OpenXDA.Types.NoteApplication, referenceID: number, noteTags: OpenXDA.Types.NoteTag[]): OpenXDA.Types.Note => {
    return {
        ID: -1,
        ReferenceTableID: referenceID,
        NoteTagID: noteTags[0]?.ID ?? -1,
        NoteTypeID: noteType.ID,
        NoteApplicationID: noteApp.ID,
        Timestamp: '',
        UserAccount: '',
        Note: ''
    };
};

const ensureNoteDefaults = (note: OpenXDA.Types.Note, noteType: OpenXDA.Types.NoteType, noteApp: OpenXDA.Types.NoteApplication, referenceID: number, noteTags: OpenXDA.Types.NoteTag[]): OpenXDA.Types.Note => {
    const tagID = noteTags.find((tag) => tag.ID === note.NoteTagID)?.ID ?? noteTags[0]?.ID ?? -1;

    return {
        ...note,
        ReferenceTableID: referenceID,
        NoteTypeID: noteType.ID,
        NoteApplicationID: note.NoteApplicationID > 0 ? note.NoteApplicationID : noteApp.ID,
        NoteTagID: tagID
    };
};

const getReferenceID = (noteType: NoteRecordName, ids: INoteIDs): number => {
    if (noteType === 'Event') return ids.EventID;
    if (noteType === 'Meter') return ids.MeterID;
    if (noteType === 'Asset') return ids.AssetID;
    return ids.LocationID;
};

const getNotes = (controller: NoteController, sortField: keyof OpenXDA.Types.Note, ascending: boolean, referenceTableID: number): JQuery.jqXHR<OpenXDA.Types.Note[]> => {
    return controller.GetAll(sortField, ascending, [], referenceTableID);
};

const addNote = (controller: NoteController, record: OpenXDA.Types.Note): JQuery.jqXHR<OpenXDA.Types.Note> => {
    return controller.Add(record);
};

const updateNote = (controller: NoteController, record: OpenXDA.Types.Note): JQuery.jqXHR<OpenXDA.Types.Note> => {
    return controller.Update(record);
};

const getNoteTypes = (homePath: string): JQuery.jqXHR<OpenXDA.Types.NoteType[]> => {
    return $.ajax({
        type: 'GET',
        url: `${homePath}api/EventWidgets/Note/NoteType`,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: true,
        async: true
    }) as JQuery.jqXHR<OpenXDA.Types.NoteType[]>;
};

const getNoteTags = (homePath: string): JQuery.jqXHR<OpenXDA.Types.NoteTag[]> => {
    return $.ajax({
        type: 'GET',
        url: `${homePath}api/EventWidgets/Note/NoteTag`,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: true,
        async: true
    }) as JQuery.jqXHR<OpenXDA.Types.NoteTag[]>;
};

const getNoteApp = (homePath: string): JQuery.jqXHR<OpenXDA.Types.NoteApplication[]> => {
    return $.ajax({
        type: 'GET',
        url: `${homePath}api/EventWidgets/Note/NoteApp`,
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        cache: true,
        async: true
    }) as JQuery.jqXHR<OpenXDA.Types.NoteApplication[]>;
};

const getIDs = (homePath: string, eventID: number): JQuery.jqXHR<IEventInformation> => {
    return $.ajax({
        type: 'GET',
        url: `${homePath}api/EventWidgets/Note/EventInformation/${eventID}`,
        cache: true,
        async: true
    }) as JQuery.jqXHR<IEventInformation>;
};

const statusIsLoading = (...statuses: Application.Types.Status[]): boolean => {
    return statuses.some((status) => status === 'loading' || status === 'uninitiated');
};

const statusIsError = (...statuses: Application.Types.Status[]): boolean => {
    return statuses.some((status) => status === 'error');
};

const isSupportedNoteType = (noteType: string): noteType is NoteRecordName => {
    return supportedNoteTypes.indexOf(noteType as NoteRecordName) >= 0;
};

export default NoteWidget;
