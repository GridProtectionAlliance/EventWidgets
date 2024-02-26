﻿//******************************************************************************************************
//  EventInfo.cs - Gbtc
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

using GSF.Data;
using GSF.Data.Model;
using Newtonsoft.Json.Linq;
using System;
using System.Data;
using System.Web.Http;

namespace Widgets.Controllers
{
    [RoutePrefix("api/EventInfo")]

    public class EventInfoController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("{EventID:int}"), HttpGet]
        public IHttpActionResult GetEventInfo(int EventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                DataTable table = connection.RetrieveData(@"
                    SELECT
                        Event.ID AS EventID,
                        Meter.Name AS MeterName,
                        Asset.AssetName AS AssetName,
                        EventType.Name AS EventType,
                        Event.StartTime AS StartTime,
                        Event.EndTime AS EndTime,
                        Event.EventTypeID AS EventTypeID,
                        Event.UpdatedBy AS LastUpdatedBy

                    FROM
                        Event JOIN
                        Asset ON Event.AssetID = Asset.ID JOIN
                        Meter ON Event.MeterID = Meter.ID JOIN
                        EventType ON Event.EventTypeID = EventType.ID

                    WHERE
                        Event.ID = {0}
                ", EventID);

                return Ok(table);
            }
        }

        [Route("save/{EventID:int}"), HttpPost]
        public IHttpActionResult SetEvent(int EventID, [FromBody] JObject record)
        {
            using (AdoDataConnection connection = new("systemSettings"))
            {
                TableOperations<openXDA.Model.Event> tbl = new TableOperations<openXDA.Model.Event>(connection);

                openXDA.Model.Event evt = tbl.QueryRecordWhere("ID = {0}", EventID);
                evt.EventTypeID = (int)record["EventTypeID"];
                evt.StartTime = (DateTime)record["StartTime"];
                evt.EndTime = (DateTime)record["EndTime"];
                tbl.UpdateRecord(evt);
            }

            return Ok(1);
        }
    }
}