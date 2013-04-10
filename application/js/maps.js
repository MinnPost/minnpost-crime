var DATAPATH = DATAPATH || '../data/';
var mapper = {};

(function($, undefined) {
  var crimeURLBase = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=';
  var crimeQuery = "SELECT * FROM `swdata` WHERE year = '2011'";
  var seriesTypes = ['homicide', 'rape', 'robbery', 'agg_assault', 
    'burglary', 'larceny', 'auto_theft', 'arson', 'total'];
  var crimes = {};
  var neighborhoods = {};
  var geojson;
  
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
    var map1 = SimpleMapD3({
      container: '#crime-map',
      data: geojson,
      colorOn: true,
      colorProperty: type
    });
  };

  
  mapper = function(dataPath) {
    var dataPath = dataPath || '../data/';
  
    // Get data
    $.jsonp({
      url: crimeURLBase + encodeURI(crimeQuery),
      success: function(data) {
        crimes = data;
        
        console.log(dataPath);
        // *********************
        
        var neighborhoodTopoJSON = dataPath + 'neighborhoods/minneapolis/minneapolis-neighborhoods-2012-keyed.topo.json';
        d3.json(neighborhoodTopoJSON, function(error, data) {
          neighborhoods = data;
          
          drawMap();
        });
      }
    });
    
    
    $('#crime-type-select').on('change', function(e) {
      drawMap($(this).val() || 'total');
    });
  }
  
})(jQuery);