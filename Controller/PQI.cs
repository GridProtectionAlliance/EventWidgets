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
using openXDA.PQI;
using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using System.Threading.Tasks;
using System.Web.Http;

namespace Widgets.Controllers
{
    [RoutePrefix("api/PQI")]
    public class PQIController : ApiController
    {
        const string SettingsCategory = "systemSettings";

        public string ClientID
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.ClientID'") ?? "";
            }
        }

        public string ClientSecret
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.ClientSecret'") ?? "";
            }
        }

        public string Username
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.Username'") ?? "";
            }
        }

        public string Password
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.Password'") ?? "";
            }
        }
        public string PingURL
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.PingURL'") ?? "";
            }
        }
        public string BaseURL
        {
            get
            {
                using (AdoDataConnection connection = new(SettingsCategory))
                    return connection.ExecuteScalar<string>($"SELECT Value From Setting Where Name = 'PQI.BaseURL'") ?? "";
            }
        }

        [Route("GetEquipment/{eventID:int}"), HttpGet]
        public async Task<IHttpActionResult> GetEquipment(int eventID)
        {
                PQIWSClient pqiwsClient = new(BaseURL, FetchAccessToken);
                PQIWSQueryHelper pqiwsQueryHelper = new(() => new GSF.Data.AdoDataConnection(SettingsCategory), pqiwsClient);

                return Ok(await pqiwsQueryHelper.GetAllImpactedEquipmentAsync(eventID));
        }

        [Route("GetCurves/{eventID:int}"), HttpGet]
        public async Task<IHttpActionResult> GetCurves(int eventID)
        {
            PQIWSClient pqiwsClient = new(BaseURL, FetchAccessToken);
            PQIWSQueryHelper pqiwsQueryHelper = new(() => new GSF.Data.AdoDataConnection(SettingsCategory), pqiwsClient);
            List <Tuple<TestCurve, List<TestCurvePoint>>> r = await pqiwsQueryHelper.GetAllTestCurvesAsync(new List<int>() { eventID });
            return Ok(r);
            
        }

        private string FetchAccessToken()
        {
            NetworkCredential clientCredential = new(ClientID, ClientSecret);
            NetworkCredential userCredential = new(Username, Password);
            PingClient pingClient = new(PingURL);
            Task exchangeTask = pingClient.ExchangeAsync(clientCredential, userCredential);
            exchangeTask.GetAwaiter().GetResult();
            return pingClient.AccessToken;
        }
    }
}