//******************************************************************************************************
//  HelperMethods.cs - Gbtc
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
//  11/3/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

#if IS_GEMSTONE
using Microsoft.AspNetCore.Mvc;
#else
using Controller = System.Web.Http.ApiController;
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
    public static class HelperMethods
    {
        /// <summary>
        /// Gets the route path taken to hit the current endpoint,
        /// not including the portion to reach the current controller.
        /// </summary>
        /// <param name="controller"><see cref="Controller"/> from which is this called.</param>
        /// <param name="baseRoute"><see cref="string"/> that is the base portion of the route.</param>
        /// <returns><see cref="string"/> of endpoint route.</returns>
        public static string GetEndpoint(this Controller controller, string baseRoute)
        {
            string endPoint;
            #if IS_GEMSTONE
            endPoint = controller.Request.Path.Value;
            #else
            endPoint = controller.Request.AbsolutePath;
            #endif

            return endPoint.Substring(baseRoute.Length + 1);
        }

        /// <summary>
        /// Gets the query string of the current request.
        /// </summary>
        /// <param name="controller"><see cref="Controller"/> from which is this called.</param>
        /// <returns><see cref="string"/> that has the current query.</returns>
        public static string GetQueryString(this Controller controller)
        {
            #if IS_GEMSTONE
            return controller.Request.QueryString.Value;
            #else
            return controller.Request.RequestUri.Query;
            #endif
        }
    }
}