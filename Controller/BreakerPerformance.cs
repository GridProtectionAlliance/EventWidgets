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
//  08/08/2023 - C. Lackner
//       Generated original version of source code.
//
//******************************************************************************************************
using GSF;
using GSF.Data;
using GSF.Web;
using System.Collections.Generic;
using System;
using System.Data;
using System.Globalization;
using System.Web.Http;
using static SEBrowser.Controllers.DERReportController;
using openXDA.Model;
using GSF.Data.Model;

namespace Widgets.Controllers
{
    [Route("api/BreakerPerformance")]
    public class BreakerPerformanceController : ApiController
    {

        protected string SettingsCategory => "systemSettings";

        [HttpGet]
        public DataTable GetBreakerPerformance()
        {
            Dictionary<string, string> query = Request.QueryParameters();
            int eventID;
           
            try { eventID = int.Parse(query["eventID"]); }
            catch { eventID = -1; }
            if (eventID <= 0) return new DataTable();
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                Event evt = new TableOperations<Event>(connection).QueryRecordWhere("ID = {0}", eventID);
                return RelayHistoryTable(evt.AssetID);
            }
        }

        private DataTable RelayHistoryTable(int assetID)
        {
            DataTable dataTable;

            using (AdoDataConnection connection = new(SettingsCategory))
            {
                dataTable = connection.RetrieveData($"SELECT * FROM BreakerHistory WHERE BreakerId = {{0}}", assetID);
            }
            return dataTable;
        }
    }
}