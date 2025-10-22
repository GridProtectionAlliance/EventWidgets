//******************************************************************************************************
//  OpenSEEController.cs - Gbtc
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
using System.Threading;

#if IS_GEMSTONE
using Gemstone.Web;
using Microsoft.AspNetCore.Mvc;
using openXDA.APIAuthentication;
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using API = openXDA.APIAuthentication.XDAAPIHelper;
using Controller = System.Web.Http.ApiController;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif

namespace Widgets.API.Visualizations
{
    [RoutePrefix("api/EventWidgets/OpenSEE")]
    public class OpenSEEController : Controller
    {
        // if this is disabled, the static object must be intialized by the outside instead of having the retriever injected here
        #if IS_GEMSTONE
        XDAAPI API { get; set; }
        public OpenSEEController(IAPICredentialRetriever retriever)
        {
            API = new XDAAPI(retriever);
        }
        #endif

        [Route("GetData"), HttpGet]
        public async ServerResponse GetOpenSEEData(CancellationToken cancellationToken)
        {
            if (!API.TryRefreshSettings())
                throw new InvalidOperationException("Unable to refresh XDA API helper.");

            string query;

            #if IS_GEMSTONE
            query = Request.QueryString.Value;
            #else
            query = Request.RequestUri.Query;
            #endif

            HttpResponseMessage response = await API.GetResponseTask("api/OpenSEE/GetData" + query).ConfigureAwait(false);

            #if IS_GEMSTONE
            await Response.SetValues(response, cancellationToken);
            return;
            #else
            return response;
            #endif
        }
    }
}