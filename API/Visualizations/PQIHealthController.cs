//******************************************************************************************************
//  PQIHealthController.cs - Gbtc
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
//  10/17/2025 - Gabriel Santos
//       Removed endpoint, pointing this to an existing endpoint in XDA.
//
//******************************************************************************************************

using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using Widgets.API.Library;
using Newtonsoft.Json.Linq;

#if IS_GEMSTONE
using Gemstone.Web;
using Microsoft.AspNetCore.Mvc;
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using Controller = System.Web.Http.ApiController;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif

namespace Widgets.API.Visualizations
{
    /// <summary>
    /// Controller that handles fetching HIDS trending data from XDA.
    /// </summary>
    [RoutePrefix("api/EventWidgets/PQIHealth")]
    public class PQIHealthController : Controller
    {
        private static HttpClient HttpClient { get; } = new HttpClient();

        [Route("sites"), Route("reportsummary")]
        [HttpGet]
        public async ServerResponse ForwardRequest([FromBody] JObject postData, CancellationToken cancellationToken)
        {
            string endPoint = this.GetEndpoint("api/EventWidgets/PQIHealth");
            string queryString = this.GetQueryString();

            StringContent content = null;
            if (postData is not null)
                content = new StringContent(postData.ToString(), Encoding.UTF8, "application/json");

            void ConfigureRequest(HttpRequestMessage request)
            {
                request.Content = content;
                request.Method = HttpMethod.Get;
                request.RequestUri = new Uri("http://172.21.1.164:8080/epriwhit/v1" + "/" + endPoint + queryString);
                MediaTypeWithQualityHeaderValue acceptHeader = new MediaTypeWithQualityHeaderValue("application/json");
                request.Headers.Accept.Add(acceptHeader);
            }

            using (HttpRequestMessage request = new HttpRequestMessage())
            {
                ConfigureRequest(request);
                using (HttpResponseMessage response = await HttpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, cancellationToken))
                {
                    #if IS_GEMSTONE
                    await Response.SetValues(response, cancellationToken);
                    return;
                    #else
                    return response;
                    #endif

                }
            }
        }
    }
}