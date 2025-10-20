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

using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Runtime.Caching;
using System.Threading.Tasks;
using FaultData.DataAnalysis;
using openXDA.APIAuthentication;
using System.Net.Http;
using GSF.Web;


#if IS_GEMSTONE
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using Microsoft.AspNetCore.Mvc;
#else
using System.Web.Http;
using ControllerBase = System.Web.Http.ApiController;
#endif

namespace Widgets.Controllers
{
    [RoutePrefix("api/OpenSEE")]
    public class OpenSEEController : ControllerBase
    {
        // if this is disabled, the static object must be intialized by the outside instead of having the function injected here
        #if IS_GEMSTONE
        public OpenSEEController(Func<(string,string,string)> initFunction) 
        {
            if (!XDAAPIHelper.IsIntialized)
                XDAAPIHelper.InitializeHelper(initFunction);
        }
        #endif

        [Route("GetData"), HttpGet]
        public Task<HttpResponseMessage> GetOpenSEEData()
        {
            string query = Request.RequestUri.Query;
            XDAAPIHelper.RefreshSettings();
            return XDAAPIHelper.GetResponseTask("api/OpenSEE/GetData" + query);
        }
    }
}