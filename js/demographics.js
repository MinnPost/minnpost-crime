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
      
      console.log(demoData.data);
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
    dataPath = dataPath || './data/';
    
    // Get data
    var method = 'json';
    if (dataPath.indexOf('proxy') > 0) {
      method = 'jsonp';
    }
    var url = dataPath + 'demographics/2010/twin-cities-neighborhood-demographics-2010.json';
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