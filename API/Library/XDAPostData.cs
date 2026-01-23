//******************************************************************************************************
//  XDAPostData.cs - Gbtc
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
//  12/24/2025 - Gabriel Santos
//       Generated original version of source code.
//
//******************************************************************************************************

#if IS_GEMSTONE
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using Gemstone.Data.Model;
using Gemstone.Web.APIController;
#else
using GSF.Data.Model;
using GSF.Web.Model;
#endif

namespace Widgets.API.Library
{
    /// <summary>
    /// This is postdata XDA model controllers accept.
    /// </summary>
    public class XDAPostData
    #if IS_GEMSTONE
        : SearchPost<object> 
    {
        public new IEnumerable<XDASQLSearchFilter> Searches { get; set; }
    }
    #else
        : ModelController<object>.PostData { }
    #endif

    /// <summary>
    /// This is postdata XDA model controllers accept.
    /// </summary>
    public class XDASQLSearchFilter
    #if IS_GEMSTONE
        : RecordFilter<object> 
    {
        [SetsRequiredMembers]
        public XDASQLSearchFilter() { SearchParameter = null; }
        public string SearchText { get; set; }
        public bool IsPivotColumn { get; set; }
        public string Type { get; set; }
    }
    #else
        : SQLSearchFilter { }
    #endif

}