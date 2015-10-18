(function(){
  var MARKET = 'DAYSONMARKET';
  var CLOSING = 'DAYSTOCLOSING';
  var BIN_SIZE = 50;
  var MAIN_ID = 'main';
  var BREAKDOWN_ID = 'breakdown';

  var DATA_GREEN = [51, 160, 44];
  var DATA_BLUE = [31, 120, 180];

  var DATASET_LABELS = ['Days on Market', 'Days to Closing'];
  var DATA_COLORS = [DATA_GREEN, DATA_BLUE];

  var main = getChart(MAIN_ID);
  var breakdown = getChart(BREAKDOWN_ID);

  if( isDataCached() ){

    plotProcessedData(getDataFromCache(), main);

  } else {

    $.getJSON('./data-as-json/sales.json', function( data ) {

      var processedData = processData(data);
      cacheData(processedData);
      plotProcessedData(processedData, main);

    });

  }


  // procssing and plotting functions
  function processData(data){
    // Groups days by subdivisions
    var daysOnMarketBySub = groupDaysBySubdivision(data, MARKET);
    var daysToClosingBySub = groupDaysBySubdivision(data, CLOSING);

    var dayBins = binAllDaysBySize(data, BIN_SIZE);

    return {
      market: daysOnMarketBySub,
      closing: daysToClosingBySub,
      dayBins: dayBins
    };
  }

  function plotProcessedData(processedData, plotObject){
    // Pass in needed data to plot functions
    var plotOverview = setDataOnPlotter(plotterOverview, processedData.market, processedData.closing);
    var plotBreakdown = setDataOnPlotter(plotterBreakdown, processedData.market, processedData.closing, processedData.dayBins);

    // Plot overview chart
    plotObject.chart = plotOverview(plotObject, plotBreakdown);
  }


  // caching related functions
  function canCache(){
    return 'localStorage' in window;
  }

  function isDataCached(){
    return canCache() && !_.isUndefined(localStorage.housesSubData)
  }

  function getDataFromCache(){
    if(isDataCached()){
      return JSON.parse(localStorage.housesSubData);
    }
  }

  function cacheData(data){
    if(canCache()){
      localStorage.housesSubData = JSON.stringify(data);
    }
  }

  // Data related functions
  function groupDaysBySubdivision(data, factor){
    return _(data).groupBy(function(house){
      return s.titleize(house.LEGALSUBDIVISION);
    })
    .mapValues(function(sub){
      var daysToClosing = _.pluck(sub, factor);
      return daysToClosing;
    })
    .value();
  }

  function binAllDaysBySize(data, binSize){
    var allDays = _(data).pluck(MARKET).union(_.pluck(data, CLOSING)).value();
    return binBy(allDays, BIN_SIZE);
  }

  function binArray(days, dayBins){
    var dayLabels = _.pluck(dayBins, 'label');
    var destination = _.zipObject(dayLabels, _.fill(new Array(dayLabels.length), 0));

    var days = _.sortBy(days, function(day){
      return day * 1;
    });

    _.each(days, _.partial(binTo, _, destination, BIN_SIZE));
    return destination;
  }

  function binTo(day, destination, binSize){
    var rangeIndex = Math.floor(day / binSize);
    var label = (rangeIndex)* binSize + ' - ' + (rangeIndex + 1) * binSize;

    destination[label] = destination[label]? destination[label] : 0;

    destination[label] ++;
  }

  function binBy(array, binSize){
    var min = _.min(array);
    var max = _.max(array);
    var minStart = min -  (binSize - Math.abs(min % binSize));
    var maxEnd = max + (binSize - max % binSize);

    var range = _.range(minStart, maxEnd, binSize);
    var bins = [];

    _.each(range, function(rangeBorder, index){
      var bin = {};
      if(index == (range.length - 1)){
        return;
      }
      bin.label = rangeBorder + ' - ' + range[index + 1];
      bin.range = [rangeBorder, range[index + 1]];

      bins.push(bin);
    });

    return bins;
  }

  function mapAverage(allDays){
    return _.mapValues(allDays, function(groupDays){
      return _.sum(groupDays)/groupDays.length;
    });
  }

  // plotting related functions
  function setDataOnPlotter(plotter){
    var data = _.rest(arguments);
    var curriedPlotter = _.curry(plotter);
    return _.spread(curriedPlotter)(data);
  }

  function plotterOverview(daysOnMarketBySub, daysToClosingBySub, plotObject, onBreakdownChange){
    var averageDaysOnMarketBySub = mapAverage(daysOnMarketBySub);
    var averageDaysToClosingBySub = mapAverage(daysToClosingBySub);

    var chart = drawDayPlots(plotObject.context, averageDaysOnMarketBySub, averageDaysToClosingBySub);

    plotObject.heading.classList.remove('loading');
    plotObject.element.onclick = function(evt){
      var activeBars = plotObject.chart.getBarsAtEvent(evt);

      if(_.isUndefined(_.first(activeBars))){
        return;
      }
      breakdown.chart = onBreakdownChange(breakdown, _.first(activeBars).label);
    };

    return chart;
  }

  function plotterBreakdown(daysOnMarketBySub, daysToClosingBySub, dayBins, plotObject, subdivision){
    var marketDaysInBins = binArray(daysOnMarketBySub[subdivision], dayBins);
    var closingDaysInBins = binArray(daysToClosingBySub[subdivision], dayBins);
    plotObject.heading.dataset.sub = subdivision;

    if(_.isUndefined(plotObject.chart)){
      return drawDayPlots(plotObject.context, marketDaysInBins, closingDaysInBins);
    } else {
      return updateBarChart(plotObject.chart, marketDaysInBins, closingDaysInBins);
    }
  }

  function updateBarChart(barChart){
    var dataArrays = _.rest(arguments);

    _.each(barChart.datasets, function(dataset, dataIndex){
      var values = _.values(dataArrays[dataIndex]);
      _.each(dataset.bars, function(bar, barIndex){
        bar.value = values[barIndex];
      });
    });

    barChart.update();
    return barChart;
  }

  function drawDayPlots(){
    var args = _.toArray(arguments)
    args = _.union([DATASET_LABELS, DATA_COLORS], args);
    return _.spread(drawBarChart)(args);
  }

  function drawBarChart(datasetLabels, dataColors, chartContext){
    var daysObjects = _.slice(arguments, 3);
    var labels = _.keys(daysObjects[0]);

    var datasets = _.map(daysObjects, _.partial(getDatasetOptions, datasetLabels, dataColors));

    var shapedData = {
      labels: labels,
      datasets: datasets
    };

    return new Chart(chartContext).Bar(shapedData);
  }

  function getDatasetOptions(datasetLabels, dataColors, dataObject, index){
    var data = _.values(dataObject);
    var indexer = index % datasetLabels.length;

    var rgb = dataColors[indexer];
    var colorOptions = _.spread(getColorOptions)(rgb);

    var dataset = _.extend({}, {
      label: datasetLabels[indexer],
      data: data
    }, colorOptions);

    return dataset;
  }

  function getColorOptions(r, g, b){
    var rgbString = [r, g, b].join(', ');

    return {
      fillColor: 'rgba(' + rgbString + ', 0.5)',
      strokeColor: 'rgba(' + rgbString + ', 0.8)',
      highlightFill: 'rgba(' + rgbString + ', 0.75)',
      highlightStroke: 'rgba(' + rgbString + ', 1)'
    };
  }

  function getChart(chartId){
    var element = document.getElementById(chartId);
    var heading = document.querySelector('[data-chart=' + chartId + ']');
    var context = element.getContext('2d');

    return {
      element: element,
      heading: heading,
      context: context
    };
  }

}());
