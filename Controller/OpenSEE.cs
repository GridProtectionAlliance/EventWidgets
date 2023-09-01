﻿//******************************************************************************************************
//  LineParameters.cs - Gbtc
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

using FaultData.DataAnalysis;
using GSF.Data;
using GSF.Data.Model;
using GSF.Web;
using openXDA.Model;
using System.Collections.Generic;
using System;
using System.Data;
using System.Web.Http;
using System.Runtime.Caching;
using System.Threading.Tasks;
using System.Linq;

namespace Widgets.Controllers
{
    [RoutePrefix("api/OpenSEE")]
    public class OpenSEEController : ApiController
    {
        MemoryCache s_memoryCache = new MemoryCache("OpenXDA");

        protected string SettingsCategory => "systemSettings";
        [Route("GetData"), HttpGet]
        public IHttpActionResult GetOpenSEEData(int eventID)
        {
            using (AdoDataConnection connection = new(SettingsCategory))
            {
                Dictionary<string, string> query = Request.QueryParameters();
                DateTime epoch = new(1970, 1, 1);

                int eventId = int.Parse(query["eventId"]);
                string type = query["type"];
                string dataType = query["dataType"];
                int pixels = (int)double.Parse(query["pixels"]);

                Event evt = new TableOperations<Event>(connection).QueryRecordWhere("ID = {0}", eventId);
                Meter meter = new TableOperations<Meter>(connection).QueryRecordWhere("ID = {0}", evt.MeterID);
                meter.ConnectionFactory = () => new AdoDataConnection(SettingsCategory);

                int calcCycle = connection.ExecuteScalar<int?>("SELECT CalculationCycle FROM FaultSummary WHERE EventID = {0} AND IsSelectedAlgorithm = 1", evt.ID) ?? -1;
                double systemFrequency = connection.ExecuteScalar<double?>("SELECT Value FROM Setting WHERE Name = 'SystemFrequency'") ?? 60.0;

                DateTime startTime = (query.ContainsKey("startDate") ? DateTime.Parse(query["startDate"]) : evt.StartTime);
                DateTime endTime = (query.ContainsKey("endDate") ? DateTime.Parse(query["endDate"]) : evt.EndTime);
                if (dataType == "Time")
                {
                    DataGroup dataGroup;
                    dataGroup = QueryDataGroup(eventId, meter);
                    Dictionary<string, IEnumerable<double[]>> returnData = new();
                    bool hasVoltLN = dataGroup.DataSeries.Select(x => x.SeriesInfo.Channel.Phase.Name).Where(x => x.Contains("N")).Any();
                    foreach (var series in dataGroup.DataSeries)
                    {
                        List<double[]> data = series.DataPoints.Select(dp => new double[2] { (dp.Time - epoch).TotalMilliseconds, dp.Value }).ToList();
                        if (type == "Voltage")
                        {
                            if (series.SeriesInfo.Channel.MeasurementType.Name == "Voltage" && series.SeriesInfo.Channel.MeasurementCharacteristic.Name == "Instantaneous" && series.SeriesInfo.Channel.Phase.Name.Contains("N"))
                            {
                                if (!returnData.ContainsKey("V" + series.SeriesInfo.Channel.Phase.Name))
                                    returnData.Add("V" + series.SeriesInfo.Channel.Phase.Name, Downsample(data, pixels));
                            }
                            else if (series.SeriesInfo.Channel.MeasurementType.Name == "Voltage" && series.SeriesInfo.Channel.MeasurementCharacteristic.Name == "Instantaneous" && !hasVoltLN)
                            {
                                if (!returnData.ContainsKey("V" + series.SeriesInfo.Channel.Phase.Name))
                                    returnData.Add("V" + series.SeriesInfo.Channel.Phase.Name, Downsample(data, pixels));
                            }

                        }
                        else if (type == "TripCoilCurrent")
                        {
                            if (series.SeriesInfo.Channel.MeasurementType.Name == "TripCoilCurrent" && series.SeriesInfo.Channel.MeasurementCharacteristic.Name == "Instantaneous")
                            {
                                if (!returnData.ContainsKey("TCE" + series.SeriesInfo.Channel.Phase.Name))
                                    returnData.Add("TCE" + series.SeriesInfo.Channel.Phase.Name, Downsample(data, pixels));
                            }
                        }
                        else
                        {
                            if (series.SeriesInfo.Channel.MeasurementType.Name == "Current" && series.SeriesInfo.Channel.MeasurementCharacteristic.Name == "Instantaneous")
                            {
                                if (!returnData.ContainsKey("I" + series.SeriesInfo.Channel.Phase.Name))
                                    returnData.Add("I" + series.SeriesInfo.Channel.Phase.Name, Downsample(data, pixels));
                            }
                        }

                    }

                    return Ok(returnData);
                }

                return Ok();
            }

            DataGroup QueryDataGroup(int eventID, Meter meter)
            {
                string target = $"DataGroup-{eventID}";

                Task<DataGroup> dataGroupTask = new(() =>
                {
                    List<byte[]> data = ChannelData.DataFromEvent(eventID, () => new AdoDataConnection(SettingsCategory));
                    return ToDataGroup(meter, data);

                });

                if (s_memoryCache.Add(target, dataGroupTask, new CacheItemPolicy { SlidingExpiration = TimeSpan.FromMinutes(10.0D) }))
                    dataGroupTask.Start();

                dataGroupTask = (Task<DataGroup>)s_memoryCache.Get(target);

                return dataGroupTask.Result;

            }

            DataGroup ToDataGroup(Meter meter, List<byte[]> data)
            {
                DataGroup dataGroup = new();
                dataGroup.FromData(meter, data);
                VIDataGroup vIDataGroup = new(dataGroup);
                return vIDataGroup.ToDataGroup();
            }

            List<double[]> Downsample(List<double[]> series, int maxSampleCount)
            {
                List<double[]> data = new();
                DateTime epoch = new(1970, 1, 1);
                double startTime = series.First()[0];
                double endTime = series.Last()[0];
                int step = (int)(endTime * 1000 - startTime * 1000) / maxSampleCount;
                if (step < 1)
                    step = 1;

                series = series.Where(x => x[0] >= startTime && x[0] <= endTime).ToList();

                int index = 0;

                for (double n = startTime * 1000; n <= endTime * 1000; n += 2 * step)
                {
                    double[] min = null;
                    double[] max = null;

                    while (index < series.Count() && series[index][0] * 1000 < n + 2 * step)
                    {
                        if (min == null || min[1] > series[index][1])
                            min = series[index];

                        if (max == null || max[1] <= series[index][1])
                            max = series[index];

                        ++index;
                    }

                    if (min != null)
                    {
                        if (min[0] < max[0])
                        {
                            data.Add(min);
                            data.Add(max);
                        }
                        else if (min[0] > max[0])
                        {
                            data.Add(max);
                            data.Add(min);
                        }
                        else
                        {
                            data.Add(min);
                        }
                    }
                }

                return data;

            }
        }
    }
}