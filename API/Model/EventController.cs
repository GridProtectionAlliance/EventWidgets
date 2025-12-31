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
//  10/24/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

using System.Threading;
using Newtonsoft.Json.Linq;
using Widgets.API.Library;
using openXDA.APIAuthentication;
using System.Security.Claims;
using System.Linq;

#if IS_GEMSTONE
using Microsoft.AspNetCore.Mvc;
using RoutePrefix = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif

namespace Widgets.API.Model
{
    /// <summary>
    /// Controller that handles fetching and searching of the 
    /// <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Events/Event.cs">EventWidgetsEventView</see>
    /// model.
    /// </summary>
    [XDARedirect("api/Widgets/EventView")]
    [RoutePrefix("api/EventWidgets/Event")]
    public class EventController : RedirectionController
    {
        #if IS_GEMSTONE
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public EventController(IAPICredentialRetriever retriever) : base(retriever) { }
        #endif

        /// <summary>
        /// Redirection endpoint that handles all requests to this controller.
        /// </summary>
        /// <remarks>
        /// XDA endpoint is a 
        /// <see href="https://github.com/GridProtectionAlliance/gsf/blob/master/Source/Libraries/GSF.Web/Model/ModelController.cs">GSF ModelController</see>
        /// that is view-only.
        /// </remarks>
        [Route("{parentID?}/SearchableList")]
        [Route("SearchableList")]
        [Route("{parentID?}/PagedList/{page}")]
        [Route("PagedList/{page}")]
        [HttpPost]
        public async ServerResponse HandleRequest([FromBody] PostData postData, CancellationToken cancellationToken)
        {
            if (this.TryGetClaimsPrinciple(out ClaimsPrincipal principal) && XDAAPIHelper.TryRetrieveCustomer(principal, out string customerKey) && customerKey is not null)
            {
                // This looks strange but we don't have the ability to do OR with this otherwise...
                postData.Searches = postData.Searches.Append(new SQLSearchFilter
                {
                    FieldName = "ID",
                    SearchText = @$"(
                        SELECT ID FROM Event WHERE
                        MeterID IN (
                            SELECT MeterID FROM CustomerMeter WHERE CustomerID = 
                                (SELECT ID FROM Customer WHERE CustomerKey = '{customerKey}')
                        ) OR 
                        AssetID IN (
                            SELECT AssetID FROM CustomerAsset WHERE CustomerID = 
                                (SELECT ID FROM Customer WHERE CustomerKey = '{customerKey}')
                        )
                    )",
                    IsPivotColumn = false,
                    Operator = "IN",
                    Type = "query"
                });
            }

            ServerResponse resp = ForwardRequest(cancellationToken, postData);

            #if IS_GEMSTONE
            await resp.ConfigureAwait(false);
            return;
            #else
            return await resp.ConfigureAwait(false);
            #endif
        }

        /// <summary>
        /// Redirection endpoint that handles event count aggregation widgets.
        /// </summary>
        [Route("EventCount")]
        [Route("EventCountAggregate")]
        [HttpPost]
        public async ServerResponse HandleAggregateRequest([FromBody] JObject postData, CancellationToken cancellationToken) =>
            await ForwardAndConstrainRequest(postData, cancellationToken).ConfigureAwait(false);
    }
}