/**
 * Highcharts
 */
(function($, w, undefined) {
  $(document).ready(function() {
    var neighborhoodListURL = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=SELECT%20DISTINCT%20neighborhood_key%20FROM%20swdata%20ORDER%20BY%20neighborhood_key&callback=?";
    var neighborhoodURL = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=SELECT * FROM `swdata` WHERE neighborhood_key = '[[[NEIGHBORHOOD]]]'&callback=?";
    var neighbothoodURLYear = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=SELECT year, 1 AS month, [[[COLUMNS]]] FROM `swdata` WHERE neighborhood_key = '[[[NEIGHBORHOOD]]]' AND YEAR NOT IN (2002, 2013) GROUP BY year&callback=?";
    
    // Compiling templates to be efficient
    var templates = {
      loading: _.template($('#template-loading').html())
    };
    
    // Mark as loading while getting data
    $('#chart-example').html(templates.loading({ }));
    
    // Handle new neighborhood
    var updateChart = function(neighborhood, max, by) {
      $('#chart-example').html(templates.loading({ }));
      
      var url = neighborhoodURL;
      var seriesTypes = ['total', 'homicide', 'rape', 'robbery', 'agg_assault', 
        'burglary', 'larceny', 'auto_theft', 'arson'];
      
      if (by === 'year') {
        var columns = [];
        _.each(seriesTypes, function(s) {
          columns.push('SUM(' + s + ') AS ' + s);
        });
        url = neighbothoodURLYear.replace('[[[COLUMNS]]]', columns.join(', '));
      }
      
      url = encodeURI(url.replace('[[[NEIGHBORHOOD]]]', neighborhood));
      
      max = (max == 'auto') ? null : parseInt(max, 10);
      
      $.jsonp({
        url: url,
        success: function(data) {
          var series = [];
          
          _.each(seriesTypes, function(t) {
            series.push({
              name: t,
              data: _.map(data, function(d) {
                return [
                  Date.UTC(d.year, d.month, 1),
                  parseInt(d[t], 10)
                ];
              })
            });
          });
          
          var exampleChart = new Highcharts.Chart({
            chart: {
              renderTo: 'chart-example',
              type: 'spline'
            },
            title: {
              text: 'Neighborhood crime data'
            },
            xAxis: {
              type: 'datetime'
            },
            yAxis: {
              min: 0,
              max: max
            },
            plotOptions: {
              column: {
                stacking: 'normal'
              }
            },
            series: series
          });
          
        },
        error: function(e) {
          console.log('error');
        }
      });
    };
    
    // Get list
    $.jsonp({
      url: neighborhoodListURL,
      success: function(data) {
        _.each(data, function(d) {
          $('#neighborhood-select').append($('<option value="' + d.neighborhood_key + '">' + d.neighborhood_key + '</option>'));
        });
        $('#chart-example').html('<p><br /><br />Select neighborhood...</p>');
        
        var updateChartAction = function(e) {
          e.preventDefault();
          updateChart($('#neighborhood-select').val(), $('#max-select').val() || 50, $('#chart-by-select').val());
        };
        
        $('#neighborhood-select').on('change', function(e) {
          updateChartAction(e);
        });
        $('.update-chart').on('click', function(e) {
          updateChartAction(e);
        });
      }
    });
    
    
    
  });
})(jQuery, window);