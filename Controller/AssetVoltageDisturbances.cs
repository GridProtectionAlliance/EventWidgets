//******************************************************************************************************
//  AssetVoltageDisturbances.cs - Gbtc
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
//  08/21/2023 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************


using GSF.Data;
using System.Data;
using System.Web.Http;

namespace Widgets.Controllers
{
    [RoutePrefix("api/AssetVoltageDisturbances")]
    public class AssetVoltageDisturbancesController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("{EventID:int}"), HttpGet]
        public IHttpActionResult GetAssetVoltageDisturbances(int EventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {

                const string SQL = @"
                    SELECT 
                        EventType.Name as EventType,
                        Phase.Name as Phase,
                        Disturbance.ID,
                        Disturbance.PerUnitMagnitude,
                        Disturbance.DurationSeconds,
                        Disturbance.StartTime,
                        DisturbanceSeverity.SeverityCode,
                        CASE 
                            WHEN Disturbance.ID = EventWorstDisturbance.WorstDisturbanceID THEN 1
                            ELSE 0
                        END as IsWorstDisturbance
                    FROM 
                        Disturbance 
                        JOIN Phase ON Disturbance.PhaseID = Phase.ID 
                        JOIN EventType ON Disturbance.EventTypeID = EventType.ID 
                        JOIN DisturbanceSeverity ON Disturbance.ID = DisturbanceSeverity.DisturbanceID
                        JOIN EventWorstDisturbance ON Disturbance.EventID = EventWorstDisturbance.EventID
                    WHERE
                        Phase.Name != 'WORST' AND  
                        Disturbance.EventID = {0}
                    ORDER BY Disturbance.StartTime
                ";

                DataTable dataTable = connection.RetrieveData(SQL, EventID);
                return Ok(dataTable);


            }
        }
    }
}