var MARKET = 'DAYSONMARKET';
var CLOSING = 'DAYSTOCLOSING';

(function(){
  var canvasElement = document.getElementById("myChart");
  var breakdownElement = document.getElementById("breakdown");
  var ctx = canvasElement.getContext("2d");
  var breakdownCtx = breakdownElement.getContext("2d");

  $.getJSON('./data-as-json/sales.json', function( data ) {

    var daysOnMarketBySub = _(data).groupBy(function(house){
        return house.LEGALSUBDIVISION;
      })
      .mapValues(function(sub){
        var daysOnMarket = _.pluck(sub, MARKET);
        return daysOnMarket;
      })
      .value();

    var daysToClosingBySub = _(data).groupBy(function(house){
        return house.LEGALSUBDIVISION;
      })
      .mapValues(function(sub){
        var daysOnMarket = _.pluck(sub, CLOSING);
        return daysOnMarket;
      })
      .value();

    var myBarChart = plotMain();

    canvasElement.onclick = function(evt){
      var activeBars = myBarChart.getBarsAtEvent(evt);
      var breakdownChart = plotBreakdown(_.first(activeBars).label);
    };

    function plotMain(){

      var averageDaysOnMarketBySub = _.mapValues(daysOnMarketBySub, function(sub){
          return _.sum(sub)/sub.length;
        });

      var averageDaysToClosingBySub = _.mapValues(daysToClosingBySub, function(sub){
          return _.sum(sub)/sub.length;
        });

      return drawBarChart(ctx, averageDaysOnMarketBySub, averageDaysToClosingBySub);
    }

    function plotBreakdown(subdivision){
      var marketDaysInBins = binArray(daysOnMarketBySub[subdivision]);
      var closingDaysInBins = binArray(daysToClosingBySub[subdivision]);

      return drawBarChart(breakdownCtx, marketDaysInBins, closingDaysInBins);

      function binArray(days){
        var destination = {};

        var days = _.sortBy(days, function(day){
          return day * 1;
        });

        _.each(days, _.partial(binTo, _, destination));
        return destination;
      }

      function binTo(day, destination){
        var twentyRange = Math.floor(day/20);
        var label = (twentyRange)* 20 + ' - ' + (twentyRange + 1) * 20;

        destination[label] = destination[label]? destination[label] : 0;

        destination[label] ++;
      }
    }

    function drawBarChart(chartCtx, dataAsArray, otherDataAsArray){

      var labels = _.keys(dataAsArray);
      var values = _.values(dataAsArray);
      var secondValues = _.values(otherDataAsArray);

      var shapedData = {
        labels: labels,
        datasets: [{
          label: "Days on Market",
          fillColor: "rgba(151,187,205,0.5)",
          strokeColor: "rgba(151,187,205,0.8)",
          highlightFill: "rgba(151,187,205,0.75)",
          highlightStroke: "rgba(151,187,205,1)",
          data: values
        }, {
          label: "Days to Closing",
          fillColor: "rgba(220,220,220,0.5)",
          strokeColor: "rgba(220,220,220,0.8)",
          highlightFill: "rgba(220,220,220,0.75)",
          highlightStroke: "rgba(220,220,220,1)",
          data: secondValues
        }]
      };

      return new Chart(chartCtx).Bar(shapedData);
    }

  });

})();
