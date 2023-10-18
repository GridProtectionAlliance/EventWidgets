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
//  08/22/2023 - Preston Crawford
//       Generated original version of source code.
//
//******************************************************************************************************


using GSF.Data;
using GSF.Web;
using System.Collections.Generic;
using System;
using System.Data;
using System.Web.Http;

namespace Widgets.Controllers
{
    [Route("api/CorrelatedSags")]
    public class CorrelatedSagsController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        public DataTable GetCorrelatedSags()
        {
            const string TimeCorrelatedSagsSQL =
                "SELECT " +
                "    Event.ID AS EventID, " +
                "    EventType.Name AS EventType, " +
                "    FORMAT(Sag.PerUnitMagnitude * 100.0, '0.#') AS SagMagnitudePercent, " +
                "    FORMAT(Sag.DurationSeconds * 1000.0, '0') AS SagDurationMilliseconds, " +
                "    FORMAT(Sag.DurationCycles, '0.##') AS SagDurationCycles, " +
                "    Event.StartTime, " +
                "    Meter.Name AS MeterName, " +
                "    Asset.AssetName " +
                "FROM " +
                "    Event JOIN " +
                "    EventType ON Event.EventTypeID = EventType.ID JOIN " +
                "    Meter ON Event.MeterID = Meter.ID JOIN " +
                "    MeterAsset ON " +
                "        Event.MeterID = MeterAsset.MeterID AND " +
                "        Event.AssetID = MeterAsset.AssetID JOIN" +
                "   Asset ON Asset.ID = MeterAsset.AssetID  CROSS APPLY " +
                "    ( " +
                "        SELECT TOP 1 " +
                "            Disturbance.PerUnitMagnitude, " +
                "            Disturbance.DurationSeconds, " +
                "            Disturbance.DurationCycles " +
                "        FROM " +
                "            Disturbance JOIN " +
                "            EventType DisturbanceType ON Disturbance.EventTypeID = DisturbanceType.ID JOIN " +
                "            Phase ON " +
                "                Disturbance.PhaseID = Phase.ID AND " +
                "                Phase.Name = 'Worst' " +
                "        WHERE " +
                "            Disturbance.EventID = Event.ID AND " +
                "            DisturbanceType.Name = 'Sag' AND " +
                "            Disturbance.StartTime <= {1} AND " +
                "            Disturbance.EndTime >= {0} " +
                "        ORDER BY PerUnitMagnitude DESC " +
                "    ) Sag " +
                "ORDER BY " +
                "    Event.StartTime, " +
                "    Sag.PerUnitMagnitude";

            Dictionary<string, string> query = Request.QueryParameters();
            int eventID = int.Parse(query["eventId"]);
            string timeTolerance;
            if (!query.TryGetValue("timeTolerance", out timeTolerance))
                 timeTolerance = "2.0";
            double tolerance = double.Parse(timeTolerance);

            if (eventID <= 0) return new DataTable();
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                
                DateTime startTime = connection.ExecuteScalar<DateTime>("SELECT StartTime FROM Event WHERE ID = {0}", eventID);
                DateTime endTime = connection.ExecuteScalar<DateTime>("SELECT EndTime FROM Event WHERE ID = {0}", eventID);
                DateTime adjustedStartTime = startTime.AddSeconds(-tolerance);
                DateTime adjustedEndTime = endTime.AddSeconds(tolerance);
                DataTable dataTable = connection.RetrieveData(TimeCorrelatedSagsSQL, adjustedStartTime, adjustedEndTime);
                return dataTable;
            }
        }
    }
}