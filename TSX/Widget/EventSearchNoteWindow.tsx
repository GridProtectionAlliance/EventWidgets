//******************************************************************************************************
//  EventSearchNoteWindow.tsx - Gbtc
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
//  04/25/2019 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import React from 'react';
import { EventWidget } from '../global';
import { AssetNoteSlice, EventNoteSlice, LocationNoteSlice, MeterNoteSlice } from '../../../Scripts/TSX/Store';
import { OpenXDA } from '@gpa-gemstone/application-typings';
import { Note } from '@gpa-gemstone/common-pages';
import { MultiCheckBoxSelect, Select } from '@gpa-gemstone/react-forms';
import { Input } from '@gpa-gemstone/react-forms';

interface ISetting {
    NoteTypes: string[],
    NoteTags: string[]
}

const NoteWidget: EventWidget.IWidget<any> = {
    Name: 'EventSearchNoteWindow',
    DefaultSettings: { SystemCenterURL: 'http://localhost:8989', NoteTags: '', NoteTypes: '' },
    Settings: (props) => {
        return <div className="row">
            <div className="col">
                <Input<EventWidget.ISetting>
                    Record={props.Settings}
                    Field={'SystemCenterURL'}
                    Help={'The URL for SystemCenter. This has to be accesable from the Client.'}
                    Setter={(record) => props.SetSettings(record)}
                    Valid={() => true}
                    Label={'System Center URL'} />
            </div>
        </div>
    },
    Widget: (props: EventWidget.IWidgetProps<ISetting>) => {
        const [noteType, setNoteType] = React.useState<OpenXDA.Types.NoteType>({ ID: -1, Name: 'Event', ReferenceTableName: 'Event' });
        const [selectedTags, setSelectedTags] = React.useState<number[]>([]);
        const [noteApp, setNoteApp] = React.useState<OpenXDA.Types.NoteApplication>({ ID: -1, Name: 'SEbrowser' });

        const [noteTypes, setNoteTypes] = React.useState<OpenXDA.Types.NoteType[]>([]);
        const [noteTags, setNoteTags] = React.useState<OpenXDA.Types.NoteTag[]>([]);

        const [ids, setIDs] = React.useState<{ EventID: number, MeterID: number, AssetID: number, LocationID: number }>({ EventID: props.EventID, MeterID: -1, AssetID: -1, LocationID: -1 });


        React.useEffect(() => {
            const idHandle = getIDs();
            return () => { if (idHandle != null && idHandle.abort != null) idHandle.abort(); }
        }, [props.EventID])

        React.useEffect(() => {
            const typeHandle = getNoteType();
            return () => { if (typeHandle != null && typeHandle.abort != null) typeHandle.abort(); }
        }, []);

        React.useEffect(() => {
            const tagHandle = getNoteTag();
            return () => { if (tagHandle != null && tagHandle.abort != null) tagHandle.abort(); }
        }, []);

        React.useEffect(() => {
            const appHandle = getNoteApp();
            return () => { if (appHandle != null && appHandle.abort != null) appHandle.abort(); }
        }, []);

        React.useEffect(() => {
            if (noteType == null && noteTypes.length > 0)
                setNoteType(noteTypes[0]);
        }, [noteTypes, noteType])
        function getNoteType(): JQuery.jqXHR<OpenXDA.Types.NoteType[]> {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/OpenXDA/NoteType`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done((d: OpenXDA.Types.NoteType[]) => {

                if (props.Settings == null || props.Settings.NoteTypes.length == 0)
                    setNoteTypes(d);
                else
                    setNoteTypes(props.Settings.NoteTypes.map((t) => d.find((d) => d.Name.toLocaleLowerCase() == t.toLocaleLowerCase())));
            });

            return handle;
        }

        function getNoteApp(): JQuery.jqXHR<OpenXDA.Types.NoteApplication[]> {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/OpenXDA/NoteApp`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done((d: OpenXDA.Types.NoteApplication[]) => {
                const record = d.find(r => r.Name == "SEbrowser")
                setNoteApp(record);
            });

            return handle;
        }

        function getNoteTag(): JQuery.jqXHR<OpenXDA.Types.NoteTag[]> {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/OpenXDA/NoteTag`,
                contentType: "application/json; charset=utf-8",
                dataType: 'json',
                cache: true,
                async: true
            });

            handle.done((d: OpenXDA.Types.NoteTag[]) => {
                if (props.Settings == null || props.Settings.NoteTags.length == 0)
                    setNoteTags(d);
                else
                    setNoteTags(props.Settings.NoteTags.map((t) => d.find((d) => d.Name.toLocaleLowerCase() == t.toLocaleLowerCase())));
            });

            return handle;
        }

        function getIDs(): JQuery.jqXHR {
            const handle = $.ajax({
                type: "GET",
                url: `${homePath}api/OpenXDA/GetEventInformation/${props.EventID}`,
                cache: true,
                async: true,
            }).done((d) => {
                setIDs({
                    AssetID: d['Asset'],
                    EventID: props.EventID,
                    LocationID: d['Location'],
                    MeterID: d['Meter']
                })
            })

            return handle;
        }

        let slice;
        if (ids == null || noteType == null)
            return null;
        if (noteType.Name == 'Event')
            slice = EventNoteSlice;
        else if (noteType.Name == 'Meter')
            slice = MeterNoteSlice;
        else if (noteType.Name == 'Asset')
            slice = AssetNoteSlice;
        else if (noteType.Name == 'Location')
            slice = LocationNoteSlice;
        else
            return null;
        let id;
        if (noteType.Name == 'Event')
            id = props.EventID;
        else if (noteType.Name == 'Meter')
            id = ids.MeterID;
        else if (noteType.Name == 'Asset')
            id = ids.AssetID;
        else if (noteType.Name == 'Location')
            id = ids.LocationID;

        return (
            <div className='card' style={{ maxHeight: props.MaxHeight ?? 500, overflowY: 'auto' }}>
                <div className='card-header'>Notes</div>
                <div className='card-body'>
                    <div className='row'>
                        <div className='col'>
                            <MultiCheckBoxSelect Label={'Types:'}
                                Options={noteTags.map(t => ({ Selected: selectedTags.find(i => i == t.ID) != null, Text: t.Name, Value: t.ID }))}
                                OnChange={(evt, changed) => {
                                    setSelectedTags((st) => {
                                        const u = st.filter((t) => changed.findIndex(c => c.Value == t) == -1);
                                        u.push(...changed.filter(t => !t.Selected).map(t => t.Value));
                                        return u;
                                    })
                                }}
                            />
                            <Select<OpenXDA.Types.NoteType>
                                Record={noteType}
                                Label={'Record:'}
                                Options={noteTypes.map(t => ({ Label: t.Label, Value: t.ID.toString() }))}
                                Setter={(r) => setNoteType(noteTypes.find((t) => t.ID == r.ID))}
                                Field={'ID'} />
                        </div>
                    </div>
                    {selectedTags.length > 0 ? < Note
                        MaxHeight={window.innerHeight - 215}
                        ReferenceTableID={id}
                        NoteApplications={[noteApp]}
                        NoteTags={noteTags.filter((t) => selectedTags.find(i => i == t.ID) != null)}
                        NoteTypes={[noteType]}
                        NoteSlice={slice}
                        AllowAdd={true}
                        Title={''}
                        AllowEdit={true}
                        AllowRemove={false}
                        ShowCard={false}
                        Filter={(n) => selectedTags.find(i => i == n.NoteTagID) != null}
                    /> : <div className={'alert alert-warning'}>
                        <p>At least 1 Type needs to be selected.</p>
                    </div>}
                </div>
            </div>
        );
    }
}

export default NoteWidget;