//******************************************************************************************************
//  PQIController.cs - Gbtc
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
using Microsoft.AspNetCore.Mvc;
using openXDA.APIAuthentication;
using Widgets.API.Library;
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
    /// <summary>
    /// Controller that handles fetching PQI data for both graphing and tables.
    /// </summary>
    [RoutePrefix("api/EventWidgets/PQI")]
    [XDARedirect("api/Widgets/PQI")]
    public class PQIController : RedirectionController
    {
        #if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public PQIController(IAPICredentialRetriever retriever) : base(retriever) { }
        #endif

        /// <summary>
        /// Redirection endpoint that handles fetching PQI equipment tables and PQI curve information.
        /// </summary>
        /// <remarks>
        /// Both endpoints supported require an eventID of a related XDA 
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Events/Event.cs">Event</see>
        /// to fetch information.
        /// </remarks>
        [Route("GetEquipment/{eventID:int}")]
        [Route("GetCurves/{eventID:int}")]
        [HttpGet]
        public async ServerResponse ForwardPQIRequest(CancellationToken token) => await ForwardRequest(token).ConfigureAwait(false);
    }
}