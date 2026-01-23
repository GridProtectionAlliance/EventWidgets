//******************************************************************************************************
//  EventPost.cs - Gbtc
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
//  12/26/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

namespace Widgets.API.Library
{
    /// <summary>
    /// Post data object for certain widget controllers in the XDA reposisitory.
    /// </summary>
    public class EventPost
    {
        /// <summary>
        /// Represents the ID of an XDA <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/Events/Event.cs">Event</see>.
        /// </summary>
        public int EventID { get; set; }
        /// <summary>
        /// Represents the key of an XDA <see href="https://github.com/GridProtectionAlliance/openXDA/blob/master/Source/Libraries/openXDA.Model/SystemCenter/Customer.cs">Customer</see>.
        /// </summary>
        /// <remarks>This value may be <see langword="null"/>, this represents complete access to the XDA database.<br/>It is OUR responsibility, not the front end, to set this field, before redirecting a request.</remarks>
        public string CustomerKey { get; set; }
    }
}