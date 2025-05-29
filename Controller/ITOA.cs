//******************************************************************************************************
//  ITOAController.cs - Gbtc
//
//  Copyright © 2025, Grid Protection Alliance.  All Rights Reserved.
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
//  06/01/2025 - C. Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

using GSF.Configuration;
using GSF.Data;
using System;
using System.Configuration;
using System.Data;
using System.Web.Http;
using Widgets.Configuration;

namespace Widget.Controllers
{
    [RoutePrefix("api/ITOA")]
    public class ITOAController : ApiController
    {

        public class Settings
        {
            public Settings(Action<object> configure) =>
               configure(this);

            [Setting()]
            public string SQLCommand { get; set; }
        }

        const string ITOACategory = "dbITOA";
        const string SettingsCategory = "systemSettings";

        [Route("{eventID:int}/{timeWindow:int}/{widgetID:int}"), HttpGet]
        public IHttpActionResult Get(int eventID, int timeWindow, int widgetID)
        {
            DateTime eventTime;
            using (AdoDataConnection connection = CreateDbConnection())
            {
                eventTime = connection.ExecuteScalar<DateTime>("SELECT StartTime FROM Event WHERE ID = {0}", eventID);
            }

            Settings settings = new Settings(new ConfigurationLoader(CreateDbConnection,widgetID).Configure);

            
            using (AdoDataConnection connection = new(ITOACategory))
            {
                string sql = settings.SQLCommand;
                if (string.IsNullOrEmpty(sql))
                    sql = @"
                SELECT TOP 100
                    GENERIC_INTERRUPT.APP_ID AS ID,
                    GENERIC_INTERRUPT.SCHED_START_DATE AS StartTime,
                    GENERIC_INTERRUPT.INITIATING_CAUSE_CODE AS Cause,
                    GENERIC_INTERRUPT.STATION AS Station,
                    MAX(INTERRUPT_EQUIP.VOLTAGE) AS Voltage
                FROM GENERIC_INTERRUPT LEFT JOIN INTERRUPT_EQUIP ON GENERIC_INTERRUPT.APP_ID = INTERRUPT_EQUIP.INTERRUPT_ID
                WHERE 
                    GENERIC_INTERRUPT.SCHED_START_DATE BETWEEN {0} AND {1}
                GROUP BY 
                    GENERIC_INTERRUPT.APP_ID,
                    GENERIC_INTERRUPT.SCHED_START_DATE,
                    GENERIC_INTERRUPT.INITIATING_CAUSE_CODE,
                    GENERIC_INTERRUPT.STATION
                ORDER BY GENERIC_INTERRUPT.SCHED_START_DATE DESC                  
                ";

                DataTable table = connection.RetrieveData(sql, eventTime.AddSeconds(-1 * timeWindow), eventTime.AddSeconds(timeWindow));

                return Ok(table);
            }
           
        }

        public AdoDataConnection CreateDbConnection() => new(SettingsCategory);        
    }
}