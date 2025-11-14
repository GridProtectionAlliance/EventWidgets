//******************************************************************************************************
//  HIDSController.cs - Gbtc
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
using System.Threading;
using Widgets.API.Library;
using Newtonsoft.Json.Linq;

#if IS_GEMSTONE
using Microsoft.AspNetCore.Mvc;
using openXDA.APIAuthentication;
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif

namespace Widgets.API.Visualizations
{
    /// <summary>
    /// Controller that handles fetching HIDS trending data from XDA.
    /// </summary>
    [RoutePrefix("api/EventWidgets/HIDS")]
    [XDARedirect("api/HIDS")]
    public class HIDSController : RedirectionController
    {
        #if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public HIDSController(IAPICredentialRetriever retriever) : base(retriever) { }
        #endif

        /// <summary>
        /// Redirection endpoint that handles forwarding requests for trending information to XDA.
        /// </summary>
        /// <param name="query">
        /// Query that contains a Object that contains the following fields:<br/>
        /// Channels: A list of <see cref="List{T}"/> of 
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Channels/Channel.cs">channel</see> IDs.<br/>
        /// StartTime: A <see cref="DateTime"/> of the start of data points to be queried.<br/>
        /// EndTime: A <see cref="DateTime"/> of the end of data points to be queried.<br/>
        /// </param>
        [Route("QueryPoints"), HttpPost]
        public async ServerResponse ForwardQueryPoints([FromBody] JObject query, CancellationToken token) => await ForwardRequest(query, token).ConfigureAwait(false);
    }
}