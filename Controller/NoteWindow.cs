//******************************************************************************************************
//  NoteController.cs - Gbtc
//
//  Copyright © 2020, Grid Protection Alliance.  All Rights Reserved.
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
//  03/26/2020 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************

using GSF.Data;
using GSF.Data.Model;
using GSF.Identity;
using GSF.Web.Model;
using openXDA.Model;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Web.Http;

namespace Wigets.Controllers
{
    [RoutePrefix("api/Note/NoteType")]
    public class NoteTypeController : ModelController<LimitedNoteType> { }

    [RootQueryRestriction("[ReferenceTableName] IN ('Event', 'Meter', 'Asset', 'Location')")]
    public class LimitedNoteType : NoteType
    { }

    [RoutePrefix("api/Note/NoteTag")]
    public class NoteTagController : ModelController<NoteTag> { }

    [RoutePrefix("api/Note/NoteApp")]
    public class NoteAppController : ModelController<NoteApplication> { }

    [RoutePrefix("api/Note/EventInformation")]
    public class EventInformationController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("{eventID:int}"), HttpGet]
        public IHttpActionResult GetEventInformation(int eventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                int meterID = connection.ExecuteScalar<int>("SELECT MeterID FROM Event WHERE ID = {0}", eventID);
                var ids = new
                {
                    Meter = meterID,
                    Asset = connection.ExecuteScalar<int>("SELECT AssetID FROM Event WHERE ID = {0}", eventID),
                    Location = connection.ExecuteScalar<int>("SELECT LocationID FROM Meter WHERE ID = {0}", meterID)
                };
                return Ok(ids);
            }
        }
    }
}