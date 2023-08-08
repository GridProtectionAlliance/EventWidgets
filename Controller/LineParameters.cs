﻿//******************************************************************************************************
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

using GSF.Data;
using System.Data;
using System.Web.Http;

namespace Wigets.Controllers
{
    [RoutePrefix("api/LineParameter")]
    public class LineParameterController : ApiController
    {
        protected string SettingsCategory => "systemSettings";

        [Route("{eventID:int}"), HttpGet]
        public IHttpActionResult GetLineParameters(int eventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {
               
                const string SQL = @"
                    SELECT
	                    LineView.*
                    FROM
	                    LineView JOIN
	                    Event ON Event.AssetID = LineView.ID
                    WHERE
	                    Event.ID = {0}
                ";

                DataTable dataTable = connection.RetrieveData(SQL, eventID);
                return Ok(dataTable);


            }
        }
    }
}