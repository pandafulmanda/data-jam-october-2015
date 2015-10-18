var MARKET = 'DAYSONMARKET';
var CLOSING = 'DAYSTOCLOSING';
var BINSIZE = 50;

(function(){
  var mainChartElement = document.getElementById("main");
  var mainChartHeading = document.querySelector("[data-chart=main]");

  var breakdownChartElement = document.getElementById("breakdown");
  var breakdownChartHeading = document.querySelector("[data-chart=breakdown]");

  var ctx = mainChartElement.getContext("2d");
  var breakdownCtx = breakdownChartElement.getContext("2d");

  $.getJSON('./data-as-json/sales.json', function( data ) {

    var daysOnMarketBySub = groupDaysBySubdivision(data, MARKET);
    var daysToClosingBySub = groupDaysBySubdivision(data, CLOSING);
    var allDays = _(data).pluck(MARKET).union(_.pluck(data, CLOSING)).value();
    var dayBins = binBy(allDays, BINSIZE);
    var mainChart = plotMain();
    var breakdownChart;

    mainChartElement.onclick = function(evt){
      var activeBars = mainChart.getBarsAtEvent(evt);
      breakdownChart = plotBreakdown(_.first(activeBars).label, dayBins);
    };

    mainChartHeading.classList.remove('loading');

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

    function plotMain(){
      var averageDaysOnMarketBySub = _.mapValues(daysOnMarketBySub, function(sub){
          return _.sum(sub)/sub.length;
        });

      var averageDaysToClosingBySub = _.mapValues(daysToClosingBySub, function(sub){
          return _.sum(sub)/sub.length;
        });

      return drawBarChart(ctx, averageDaysOnMarketBySub, averageDaysToClosingBySub);
    }

    function plotBreakdown(subdivision, dayBins){
      var marketDaysInBins = binArray(daysOnMarketBySub[subdivision]);
      var closingDaysInBins = binArray(daysToClosingBySub[subdivision]);
      breakdownChartHeading.dataset.sub = subdivision;

      if(_.isUndefined(breakdownChart)){
        return drawBarChart(breakdownCtx, marketDaysInBins, closingDaysInBins);
      } else {
        return updateBarChart(breakdownChart, marketDaysInBins, closingDaysInBins);
      }

      function binArray(days){
        var dayLabels = _.pluck(dayBins, 'label');
        var destination = _.zipObject(dayLabels, _.fill(new Array(dayLabels.length), 0));

        var days = _.sortBy(days, function(day){
          return day * 1;
        });

        _.each(days, _.partial(binTo, _, destination));
        return destination;
      }

      function binTo(day, destination){
        var rangeIndex = Math.floor(day / BINSIZE);
        var label = (rangeIndex)* BINSIZE + ' - ' + (rangeIndex + 1) * BINSIZE;

        destination[label] = destination[label]? destination[label] : 0;

        destination[label] ++;
      }
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


    function drawBarChart(chartCtx, dataAsArray, otherDataAsArray){

      var labels = _.keys(dataAsArray);
      var values = _.values(dataAsArray);
      var secondValues = _.values(otherDataAsArray);

      var shapedData = {
        labels: labels,
        datasets: [{
          label: "Days on Market",
          fillColor: "rgba(51,160,44,0.5)",
          strokeColor: "rgba(51,160,44,0.8)",
          highlightFill: "rgba(51,160,44,0.75)",
          highlightStroke: "rgba(51,160,44,1)",
          data: values
        }, {
          label: "Days to Closing",
          fillColor: "rgba(31,120,180,0.5)",
          strokeColor: "rgba(31,120,180,0.8)",
          highlightFill: "rgba(31,120,180,0.75)",
          highlightStroke: "rgba(31,120,180,1)",
          data: secondValues
        }]
      };

      return new Chart(chartCtx).Bar(shapedData);
    }

  });

})();
