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
    [XDARedirect("api/Widgets/Trending")]
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
        /// Endpoint produces a list of RMS line to neutral trend 
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Channels/Channel.cs">channels</see>
        /// associated with the provided 
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Events/Event.cs">event</see> ID.
        /// </summary>
        [Route("TrendChannels/{eventID:int}")]
        [HttpGet]
        public async ServerResponse FetchTrendChannels(CancellationToken cancellationToken) => 
            await ForwardRequest(cancellationToken).ConfigureAwait(false);

        /// <summary>
        /// Redirection endpoint that handles forwarding requests for trending information to XDA.
        /// </summary>
        /// <param name="query">
        /// Query that contains a Object that contains the following fields:<br/>
        /// EventID: A id of an XDA
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Event/Event.cs">event</see>.<br/>
        /// HoursBefore: An <see cref="int"/> of the number of hours before the provided XDA
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Event/Event.cs">event</see>
        /// to pull data for.<br/>
        /// HoursAfter: An <see cref="int"/> of the number of hours after the provided XDA
        /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Event/Event.cs">event</see>
        /// to pull data for.<br/>
        /// </param>
        [Route("QueryPoints"), HttpPost]
        public async ServerResponse ForwardQueryPoints([FromBody] JObject query, CancellationToken token) =>
            await ForwardRequest(query, token).ConfigureAwait(false);
    }
}