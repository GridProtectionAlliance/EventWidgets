//******************************************************************************************************
//  EventController.cs - Gbtc
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
//  11/7/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

using System.Threading;
using Newtonsoft.Json.Linq;
using Widgets.API.Library;

#if IS_GEMSTONE
using openXDA.APIAuthentication;
using Microsoft.AspNetCore.Mvc;
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
    /// Controller that handles fetching and searching of the
    /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/TransmissionElements/StandardMagDurCurve.cs">
    /// StandardMagDurCurve
    /// </see>
    /// model.
    /// </summary>
    [XDARedirect("api/Widgets/StandardMagDurCurve")]
    [RoutePrefix("api/EventWidgets/MagDurCurve")]
    public class MagDurCurveController : RedirectionController
    {
        #if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public MagDurCurveController(IAPICredentialRetriever retriever) : base(retriever) { }
        #endif

        /// <summary>
        /// Redirection endpoint that handles all requests to this controller.
        /// </summary>
        /// <remarks>
        /// XDA endpoint is a 
        /// <see href="https://github.com/GridProtectionAlliance/gsf/blob/master/Source/Libraries/GSF.Web/Model/ModelController.cs">GSF ModelController</see>
        /// that is view-only.
        /// </remarks>
        [RoutePrefix("{**catchAll}")]
        [HttpGet, HttpPost]
        public async ServerResponse HandleRequest([FromBody] JObject postData, CancellationToken cancellationToken) => await ForwardRequest(postData, cancellationToken);
    }
}