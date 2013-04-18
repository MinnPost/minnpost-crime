var mapper = {};
var neighborhood2011GeoJSON;

(function($, undefined) {
  var crimeURLBase = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=';
  var crimeQuery = "SELECT * FROM `swdata` WHERE year = '2011'";
  var seriesTypes = ['homicide', 'rape', 'robbery', 'agg_assault', 
    'burglary', 'larceny', 'auto_theft', 'arson', 'total'];
  var crimes = {};
  var neighborhoods = {};
  var geojson;
  var templateTooltip = _.template($('#template-tooltip-crime').html());
  
  // Handle incoming data
  function drawMap(type) {
    type = type || 'total';
    if (!geojson) {
      geojson = topojson.feature(neighborhoods, neighborhoods.objects['minneapolis-neighborhoods-2012-keyed.geo']);
    }
    
    // Add total crimes up
    geojson.features = _.map(geojson.features, function(f) {
      var crimesInNeighborhood = _.where(crimes, { 'neighborhood_key': f.properties.neighbor_1 });
      
      // Get totals of crime groups
      _.each(seriesTypes, function(p) {
        var total = 0;
        _.each(crimesInNeighborhood, function(c) { total += c[p]; });
        f.properties[p] = total;
      });
      
      return f;
    });
    
    $('#crime-map').html('');
    
    neighborhood2011GeoJSON = geojson;
    
    var map1 = SimpleMapD3({
      container: '#crime-map',
      data: geojson,
      colorOn: true,
      colorProperty: type,
      tooltipContent: templateTooltip
    });
  }

  
  mapper = function(dataPath) {
    dataPath = dataPath || './data/neighborhoods/minneapolis/';
  
    // Get data
    $.jsonp({
      url: crimeURLBase + encodeURI(crimeQuery),
      success: function(data) {
        crimes = data;
        
        // hackish
        var method = 'json';
        if (dataPath.indexOf('proxy') > 0) {
          method = 'jsonp';
        }
        var neighborhoodTopoJSON = dataPath + 'minneapolis-neighborhoods-2012-keyed.topo.json';
        $.ajax({
          dataType: method,
          url: neighborhoodTopoJSON,
          success: function(data) {
            neighborhoods = data;
            drawMap();
          }
        });
      }
    });
    
    
    $('#crime-type-select').on('change', function(e) {
      drawMap($(this).val() || 'total');
    });
  };
  
})(jQuery);

/**
 * Highcharts
 */
(function($, w, undefined) {
  $(document).ready(function() {
    var neighborhoodListURL = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=SELECT%20DISTINCT%20neighborhood_key%20FROM%20swdata%20ORDER%20BY%20neighborhood_key&callback=?";
    var neighborhoodURL = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=SELECT%20*%20FROM%20%60swdata%60%20WHERE%20neighborhood_key%20%3D%20'[[[NEIGHBORHOOD]]]'&callback=?";
    
    // Compiling templates to be efficient
    var templates = {
      loading: _.template($('#template-loading').html())
    };
    
    // Mark as loading while getting data
    $('#chart-example').html(templates.loading({ }));
    
    // Handle new neighborhood
    var updateChart = function(neighborhood, max) {
      $('#chart-example').html(templates.loading({ }));
      
      $.jsonp({
        url: neighborhoodURL.replace('[[[NEIGHBORHOOD]]]', neighborhood),
        success: function(data) {
          var seriesTypes = ['homicide', 'rape', 'robbery', 'agg_assault', 
            'burglary', 'larceny', 'auto_theft', 'arson'];
            
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
              spline: {
                marker: {
                  enabled: false
                }
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
        
        $('#neighborhood-select').on('change', function(e) {
          updateChart($(this).val(), parseInt($('#max-select').val(), 10) || 50);
        });
      }
    });
    
    
    
  });
})(jQuery, window);

var demographics = {};


(function($, undefined) {
  var demoData;
  var geojson;
  var tooltipTemplate = $('#template-tooltip-demographics').html();
  var seriesTypes = ['total', 'homicide', 'rape', 'robbery', 'agg_assault', 
    'burglary', 'larceny', 'auto_theft', 'arson'];
  
  // Handle incoming data
  function matchDemographics() {
    if (neighborhood2011GeoJSON && demoData) {
      geojson = neighborhood2011GeoJSON;
      
      _.each(demoData.data, function(d, r) {
        _.each(demoData.data[r], function(c, k) {
          if (demoData.meta[k] && demoData.meta[k].type == '%') {
            demoData.data[r][k] = c / 100;
          }
        });
      });
      
      geojson.features = _.map(geojson.features, function(f) {
        f.properties = _.extend(f.properties, demoData.data['minneapolis_' + f.properties.neighbor_1]);
        return f;
      });
      
      _.each(seriesTypes, function(d) {
        $('#demographics-select-1').append($('<option value="' + d + '">' + d + '</option>'));
        $('#demographics-select-2').append($('<option value="' + d + '">' + d + '</option>'));
      });
      
      _.each(demoData.meta, function(d) {
        if (d.data != 'MARGIN OF ERROR') {
          $('#demographics-select-1').append($('<option value="' + d.key + '">' + 
            d.name + ' (' + d.type + ' ' + d.data + ')</option>'));
          $('#demographics-select-2').append($('<option value="' + d.key + '">' + 
            d.name + ' (' + d.type + ' ' + d.data + ')</option>'));
        }
      });
    }
  }
  
  
  // Draw data
  function drawDemographics(demo1, demo2) {
    if (neighborhood2011GeoJSON && demoData && demo1 && demo2) {
      
      // Draw chart
      
      // Draw maps
      var template = _.template(tooltipTemplate
        .replace('{{{PROP1}}}', demo1)
        .replace('{{{PROP2}}}', demo2)
        .replace('{{{PROP1}}}', demo1)
        .replace('{{{PROP2}}}', demo2));
      
      $('#demographic-map-1').html('');
      var map1 = SimpleMapD3({
        container: '#demographic-map-1',
        data: geojson,
        colorOn: true,
        colorProperty: demo1,
        tooltipContent: template
      });
      $('#demographic-map-2').html('');
      var map2 = SimpleMapD3({
        container: '#demographic-map-2',
        data: geojson,
        colorOn: true,
        colorProperty: demo2,
        tooltipContent: template
      });
    }
  }

  
  demographics = function(dataPath) {
    dataPath = dataPath || './data/demographics/2010/';
    
    // Get data
    var method = 'json';
    if (dataPath.indexOf('proxy') > 0) {
      method = 'jsonp';
    }
    var url = dataPath + 'twin-cities-neighborhood-demographics-2010.json';
    $.ajax({
      dataType: method,
      url: url,
      success: function(data) {
        demoData = data;
        matchDemographics();
      }
    });
    
    $('#demographics-submit').on('click', function(e) {
      e.preventDefault();
      drawDemographics($('#demographics-select-1').val(), $('#demographics-select-2').val());
    });
    
    $('#demographics-load-data').on('click', function(e) {
      e.preventDefault();
      matchDemographics();
    });
  };
  
})(jQuery);