//******************************************************************************************************
//  RedirectionController.cs - Gbtc
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
//  10/26/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

using System;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Text;
using System.Threading;
using Newtonsoft.Json.Linq;
using openXDA.APIAuthentication;

#if IS_GEMSTONE
using Gemstone.Web;
using Microsoft.AspNetCore.Mvc;
using RoutePrefixAttribute = Microsoft.AspNetCore.Mvc.RouteAttribute;
using ServerResponse = System.Threading.Tasks.Task;
#else
using System.Web.Http;
using Controller = System.Web.Http.ApiController;
using ServerResponse = System.Threading.Tasks.Task<System.Net.Http.HttpResponseMessage>;
#endif
namespace Widgets.API.Library
{
    /// <summary>
    /// Controller base that is meant to reroute requests to XDA.
    /// </summary>
    /// <Remarks>
    /// This controller will by default send requests to the exact same route in XDA as specified for it.<br/>
    /// To change this, decorate it with a <see cref="XDARedirectAttribute"/> with a different route.
    /// <para>
    /// If this is NOT in gemstone, you MUST intialize the <see cref="XDAAPIHelper"/> static object in the outside project.<br/>
    /// Otherwise, please use dependency injection to provide a <see cref="IAPICredentialRetriever"/> into the constructor.
    /// </para>
    /// </Remarks>
    public abstract class RedirectionController : Controller
    {
        /// <summary>
        /// Route to this controller.<br/>
        /// Without decoration with a <see cref="XDARedirectAttribute"/>, this is also the route the controller will forward requests to
        /// the XDA <see cref="IAPICredentialRetriever.Host"/> specified by the appropriate API object.
        /// </summary>
        protected readonly string m_baseRoute;
        /// <summary>
        /// Route to this XDA controller.<br/>
        /// Without decoration with a <see cref="XDARedirectAttribute"/>, this route is the same as <see cref="m_baseRoute"/>.
        /// </summary>
        protected readonly string m_xdaRoute;
        #if IS_GEMSTONE
        protected XDAAPI API { get; set; }
        /// <summary>
        /// Dependency injection constructor for use in .NETCore Applications.
        /// </summary>
        /// <Remarks>
        /// Call this from the child constructor with the proper credential retriever object.
        /// </Remarks>
        /// <param name="retriever">An <see cref="IAPICredentialRetriever"/> that is responsible for retriving credentials used to make API calls to XDA.</param>
        public RedirectionController(IAPICredentialRetriever retriever) : this()
        {
            API = new XDAAPI(retriever);
        }
        #endif
        
        public RedirectionController()
        {
            #if IS_GEMSTONE
            m_baseRoute = this.GetType().GetCustomAttributes<RoutePrefixAttribute>().FirstOrDefault()?.Template ?? "";
            #else
            m_baseRoute = this.GetType().GetCustomAttributes<RoutePrefixAttribute>().FirstOrDefault()?.Prefix ?? "";
            #endif
            m_xdaRoute = this.GetType().GetCustomAttributes<XDARedirectAttribute>().FirstOrDefault()?.XDARoute ?? m_baseRoute;
        }

        /// <summary>
        /// Function that handles route redirection.
        /// </summary>
        /// <param name="postData">Post data of the request.</param>
        /// <param name="cancellationToken">Token to cancel the request.</param>
        /// <returns><see cref="ServerResponse"/> that depends on the target framework.</returns>
        public async ServerResponse ForwardRequest(JObject postData, CancellationToken cancellationToken)
        {
            if (!XDAAPIHelper.TryRefreshSettings())
                throw new InvalidOperationException("Unable to refresh XDA API helper.");

            string endPoint = this.GetEndpoint(m_baseRoute);
            string query = this.GetQueryString();

            StringContent content = null;
            if (postData is not null)
                content = new StringContent(postData.ToString(), Encoding.UTF8, "application/json");

            HttpResponseMessage response = await XDAAPIHelper
                .GetResponseTask(m_xdaRoute + endPoint + query, content)
                .ConfigureAwait(false);

            #if IS_GEMSTONE
            await Response.SetValues(response, cancellationToken);
            return;
            #else
            return response;
            #endif
        }

        /// <summary>
        /// Handles route redirection. <br/>
        /// Convenience call to <see cref="ForwardRequest(JObject, CancellationToken)"/>.
        /// </summary>
        /// <param name="cancellationToken">Token to cancel the request.</param>
        /// <returns><see cref="ServerResponse"/> that depends on the target framework.</returns>
        public async ServerResponse ForwardRequest(CancellationToken token) =>
            await ForwardRequest(null, token).ConfigureAwait(false);
    }
}