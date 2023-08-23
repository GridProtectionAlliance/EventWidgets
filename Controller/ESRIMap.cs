//******************************************************************************************************
//  LineParameters.cs - Gbtc
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
//  08/22/2023 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************

using GSF.Data;
using System;
using System.Data;
using System.Web.Http;

namespace Wigets.Controllers
{
    [RoutePrefix("api/ESRIMap")]
    public class ESRIMapController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("GetLightningInfo/{eventID:int}/{timeWindow:int}"), HttpGet]
        public IHttpActionResult GetLightningInfo(int eventID, int timeWindow)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                try
                {

                    const string SQL = @"
                        SELECT
	                        Service, DisplayTime, Amplitude, Latitude,Longitude
                        FROM
	                        LightningStrike JOIN
	                        Event ON LightningStrike.EventID = Event.ID JOIN
	                        FaultSummary ON Event.ID = FaultSummary.EventID AND FaultSummary.IsSelectedAlgorithm = 1
                        WHERE
	                        Event.ID = {0} AND CAST(LightningStrike.DisplayTime as datetime2) BETWEEN DateAdd(S,-{1}, FaultSummary.Inception) AND  DateAdd(S,{1}, FaultSummary.Inception)
                    ";

                    DataTable dataTable = connection.RetrieveData(SQL, eventID, timeWindow);

                    return Ok(dataTable);

                }
                catch (Exception ex)
                {
                    return InternalServerError(ex);
                }

            }

        }
    }
}