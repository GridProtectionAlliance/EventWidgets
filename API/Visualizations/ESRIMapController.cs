//******************************************************************************************************
//  ESRIMapController.cs - Gbtc
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

using System.Threading;
using Newtonsoft.Json.Linq;
using openXDA.APIAuthentication;
using Widgets.API.Library;

#if IS_GEMSTONE
using Microsoft.AspNetCore.Mvc;
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif

namespace Widgets.API.Visualizations
{
    /// <summary>
    /// Controller that redirects ESRI map (lightning, structure, and image) requests to XDA.
    /// </summary>
    [XDARedirect("api/Widgets/ESRIMap")]
    [RoutePrefix("api/EventWidgets/ESRIMap")]
    public class ESRIMapController : RedirectionController
    {
#if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public ESRIMapController(IAPICredentialRetriever retriever) : base(retriever) { }
#endif

        [Route("GetLightningInfo/{eventID:int}/{timeWindow:int}"), HttpGet]
        public async ServerResponse GetLightningInfo(int eventID, int timeWindow, CancellationToken token) =>
            await ForwardRequest(token).ConfigureAwait(false);

        [Route("NearestStructure/{station}/{line}"), HttpGet]
        public async ServerResponse GetNearestStructure(string station, string line, CancellationToken token) =>
            await ForwardRequest(token).ConfigureAwait(false);

        [Route("Image/{base64Encoded}"), HttpGet]
        public async ServerResponse GetImage(string base64Encoded, CancellationToken token) =>
            await ForwardRequest(token).ConfigureAwait(false);
    }
}
