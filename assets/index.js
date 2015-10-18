var MARKET = 'DAYSONMARKET';
var CLOSING = 'DAYSTOCLOSING';
var BIN_SIZE = 50;
var MAIN_ID = 'main';
var BREAKDOWN_ID = 'breakdown';

(function(){
  var main = getChart(MAIN_ID);
  var breakdown = getChart(BREAKDOWN_ID);

  $.getJSON('./data-as-json/sales.json', function( data ) {

    // Groups days by subdivisions
    var daysOnMarketBySub = groupDaysBySubdivision(data, MARKET);
    var daysToClosingBySub = groupDaysBySubdivision(data, CLOSING);

    var dayBins = binAllDaysBySize(data, BIN_SIZE);

    // Pass in needed data to plot functions
    var plotOverview = setDataOnPlotter(plotterOverview, daysOnMarketBySub, daysToClosingBySub);
    var plotBreakdown = setDataOnPlotter(plotterBreakdown, daysOnMarketBySub, daysToClosingBySub, dayBins);

    // Plot overview chart
    main.chart = plotOverview(main, plotBreakdown);

  });

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
    return curriedPlotter.apply(curriedPlotter, data);
  }

  function plotterOverview(daysOnMarketBySub, daysToClosingBySub, plotObject, onBreakdownChange){
    var averageDaysOnMarketBySub = mapAverage(daysOnMarketBySub);
    var averageDaysToClosingBySub = mapAverage(daysToClosingBySub);

    var chart = drawBarChart(plotObject.context, averageDaysOnMarketBySub, averageDaysToClosingBySub);

    plotObject.heading.classList.remove('loading');
    plotObject.element.onclick = function(evt){
      var activeBars = plotObject.chart.getBarsAtEvent(evt);

      if(_.isUndefined(_.first(activeBars).label)){
        return;
      }
      breakdown.chart = onBreakdownChange(breakdown, _.first(activeBars).label);
    };


    return chart;
  }

  function plotterBreakdown(daysOnMarketBySub, daysToClosingBySub, dayBins, plotObject, subdivision){
    var marketDaysInBins = binArray(daysOnMarketBySub[subdivision]);
    var closingDaysInBins = binArray(daysToClosingBySub[subdivision]);
    plotObject.heading.dataset.sub = subdivision;

    if(_.isUndefined(plotObject.chart)){
      return drawBarChart(plotObject.context, marketDaysInBins, closingDaysInBins);
    } else {
      return updateBarChart(plotObject.chart, marketDaysInBins, closingDaysInBins);
    }

    function binArray(days){
      var dayLabels = _.pluck(dayBins, 'label');
      var destination = _.zipObject(dayLabels, _.fill(new Array(dayLabels.length), 0));

      var days = _.sortBy(days, function(day){
        return day * 1;
      });

      _.each(days, _.partial(binTo, _, destination, BIN_SIZE));
      return destination;
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

  function drawBarChart(chartContext, marketDaysObject, closingDaysObject){

    var labels = _.keys(marketDaysObject);
    var marketDays = _.values(marketDaysObject);
    var closingDays = _.values(closingDaysObject);

    var shapedData = {
      labels: labels,
      datasets: [{
        label: 'Days on Market',
        fillColor: 'rgba(51,160,44,0.5)',
        strokeColor: 'rgba(51,160,44,0.8)',
        highlightFill: 'rgba(51,160,44,0.75)',
        highlightStroke: 'rgba(51,160,44,1)',
        data: marketDays
      }, {
        label: 'Days to Closing',
        fillColor: 'rgba(31,120,180,0.5)',
        strokeColor: 'rgba(31,120,180,0.8)',
        highlightFill: 'rgba(31,120,180,0.75)',
        highlightStroke: 'rgba(31,120,180,1)',
        data: closingDays
      }]
    };

    return new Chart(chartContext).Bar(shapedData);
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

})();
