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

using GSF.Data;
using System;
using System.Data;
using System.Web.Http;

namespace Widget.Controllers
{
    [RoutePrefix("api/ITOA")]
    public class ITOAController : ApiController
    {
        const string SOECategory = "dbITOA";
        const string SettingsCategory = "systemSettings";

        [Route("{eventID:int}/{timeWindow:int}"), HttpGet]
        public IHttpActionResult Get(int eventID, int timeWindow)
        {
            DateTime eventTime;
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                eventTime = connection.ExecuteScalar<DateTime>("SELECT StartTime FROM Event WHERE ID = {0}", eventID);
            }

            using (AdoDataConnection connection = new(SOECategory))
            {

                DataTable table = connection.RetrieveData(@"
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
                ", eventTime.AddSeconds(-1 * timeWindow), eventTime.AddSeconds(timeWindow));
                return Ok(table);
            }
           
        }

    }
}