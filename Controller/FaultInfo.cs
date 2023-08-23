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
    [RoutePrefix("api/FaultInformation")]
    public class FaultInformationController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("{eventID:int}"), HttpGet]
        public IHttpActionResult GetFaultInformation(int eventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {

                string SQL = @"
					SELECT 
						Event.ID,
						FaultSummary.Inception as FaultTime,
						Event.AssetID,
						Meter.Name as StationName, 
						Location.LocationKey as StationID, 
						LineView.AssetKey as LineAssetKey, 
						LineView.AssetName as LineName, 
						LineView.Length,
						ROUND(FaultSummary.Distance,2) as FaultDistance, 
						FaultSummary.FaultType, 
						ROUND(FaultSummary.DurationCycles,2) as FaultDuration, 
						FaultSummary.CurrentMagnitude,
						FaultSummary.ID as FaultID, 
						DoubleEndedFaultDistance.Distance as DblDist
					FROM
						Event inner join 
						Meter on Event.MeterID = Meter.ID inner join 
						Location on Meter.LocationID = Location.ID inner join 
						LineView on Event.AssetID = LineView.ID inner join 
						FaultSummary on Event.ID = FaultSummary.EventID and [IsSelectedAlgorithm] = 1 AND IsSuppressed = 0 AND IsValid <> 0 left join 
						DoubleEndedFaultDistance on FaultSummary.ID = DoubleEndedFaultDistance.LocalFaultSummaryID
					WHERE 
						Event.ID = {0}
                ";

                DataTable dataTable = connection.RetrieveData(SQL, eventID);
                return Ok(dataTable);

            }
        }
        [Route("GetLinks/{category}"), HttpGet]
        public IHttpActionResult GetLinks(string category)
        {
            try
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                {
                    return Ok(connection.RetrieveData("SELECT * FROM [SEBrowser.Links] WHERE Name LIKE {0} + '%'", category));
                }
            }
            catch (Exception ex)
            {
                return InternalServerError(ex);
            }
        }
    }
}