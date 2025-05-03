//******************************************************************************************************
//  ConfigurationLoader.cs - Gbtc
//
//  Copyright © 2018, Grid Protection Alliance.  All Rights Reserved.
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
//  04/25/2025 - C. Lackner
//       Generated original version of source code.
//
//******************************************************************************************************

using GSF;
using GSF.Configuration;
using GSF.Data;
using GSF.Data.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Configuration;
using System.Linq;

namespace Widgets.Configuration
{
    /// <summary>
    /// Loads settings from openXDA and Widget Table.
    /// </summary>
    /// <remarks>
    /// This is a derivative of the openXDA Configuration Loader but specifically for Widgets
    /// </remarks>
    public class ConfigurationLoader
    {
        #region [ Constructors ]

        /// <summary>
        /// Creates a new <see cref="ConfigurationLoader"/>.
        /// </summary>
        public ConfigurationLoader(Func<AdoDataConnection> connectionFactory, int widgetID)
        {
            ConnectionFactory = connectionFactory;
            LazyConfigureAction = new Lazy<Action<object>>(() => CreateConfigureAction(widgetID));
        }

        #endregion
        
        #region [ Properties ]

        private Func<AdoDataConnection> ConnectionFactory { get; }
        private Lazy<Action<object>> LazyConfigureAction { get; }

        #endregion

        #region [ Methods ]

        public void Configure(object obj) => LazyConfigureAction.Value(obj);

        private Action<object> CreateConfigureAction(int widgetID)
        {
            string connectionString = LoadConnectionString(widgetID);
            return obj => ConnectionStringParser.ParseConnectionString(connectionString, obj);
        }

        private string LoadConnectionString(int widgetID)
        {
            string ToConnectionString(IEnumerable<string[]> settingList, int index)
            {
                string ToValue(IEnumerable<string[]> grouping) =>
                    grouping.Any(setting => index < setting.Length - 2)
                        ? ToConnectionString(grouping, index + 1)
                        : grouping.First().Last();

                return settingList
                    .Where(setting => index < setting.Length - 1)
                    .GroupBy(setting => setting[index], StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(grouping => grouping.Key, ToValue, StringComparer.OrdinalIgnoreCase)
                    .JoinKeyValuePairs();
            }

            using (AdoDataConnection connection = ConnectionFactory())
            {
                var xdaSettings = LoadXDASettings(connection);
                var scSettings = LoadWidgetSettings(connection,widgetID);

                var allSettings = xdaSettings
                    .Concat(scSettings);

                return ToConnectionString(allSettings, 0);
            }
        }

        private IEnumerable<string[]> LoadXDASettings(AdoDataConnection connection)
        {
            TableOperations<openXDA.Model.Setting> settingTable = new TableOperations<openXDA.Model.Setting>(connection);
            List<openXDA.Model.Setting> settingList = settingTable.QueryRecords().ToList();

            return settingList.Select(setting => ToArray(setting.Name, setting.Value));
        }

        private IEnumerable<string[]> LoadWidgetSettings(AdoDataConnection connection, int widgetID)
        {
            string widgetSettings = new TableOperations<SEBrowser.Model.Widget>(connection).QueryRecord(new RecordRestriction("ID = {0}", widgetID)).Setting;
            return JsonConfigurationParser.Parse(widgetSettings).Select(v => ToArray(v.Key, v.Value));
        }

        private string[] ToArray(string key, string value)
        {
            return key.Split('.').Append(value).ToArray();
        }


        #endregion

        #region [ Static ]

        // Static Properties
        private static ConnectionStringParser<SettingAttribute, CategoryAttribute> ConnectionStringParser { get; } =
            new ConnectionStringParser<SettingAttribute, CategoryAttribute>();

        #endregion
    }
}