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
    /// Controller that handles fetching of openSEE data from XDA to display a graph of event data. 
    /// </summary>
    [XDARedirect("api/Widgets/OpenSEE")]
    [RoutePrefix("api/EventWidgets/OpenSEE")]
    public class OpenSEEController : RedirectionController
    {
        #if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public OpenSEEController(IAPICredentialRetriever retriever) : base(retriever) { }
        #endif

        /// <summary>
        /// Redirection endpoint that handles fetching openSEE event chart data.
        /// </summary>
        /// <remarks>
        /// This event relies on a query string with the following parameters:<br/>
        /// eventID is a <see cref="int"/> that represents the ID of the event in the XDA database.<br/>
        /// pixels is a <see cref="int"/> the width resolution of the graph, so that data may be downsampled.<br/>
        /// type is a <see cref="string"/> that represents the measurement type of the channels data is being pulled from. Note: supported values are "Voltage", "Current", and "TripCoilCurrent".<br/>
        /// </remarks>
        [Route("GetData")]
        public async ServerResponse GetOpenSEEData(CancellationToken token) => await ForwardRequest(token).ConfigureAwait(false);
    }
}