/**
 * This is a script to convert combine the neighborhood profiles,
 * the shape data, and the demographic data.
 * 
 * Inputs:
 * data/demographics/2010/twin-cities-neighborhood-demographics-2010.json
 * data/neighborhoods/minneapolis/minneapolis-neighborhods-2012.json
 * data/neighborhoods/minneapolis/minneapolis-neighborhods.geo.json
 * 
 * Output:
 * data/neighborhoods/minneapolis/minneapolis-neighborhods.topo.json
 *
 * Due to the amount of columns and data in the column headings
 * we actually make a key system so that we do not repeat so much data.
 */
var path = require('path');
var fs = require('fs');
var _ = require('underscore');
var topojson = require('topojson');

// Inputs 
var inputDemographics = require(path.resolve(__dirname, '../data/demographics/2010/twin-cities-neighborhood-demographics-2010.json'));
var inputSource = require(path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json'));
var inputShapes = require(path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods.geo.json'));

// Output
var output = path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods.topo.json');

// Manual translation of shapefile name to neighborhood key
var translateShapeToSource = {
  'Prospect Park - East River Road': 'Prospect Park - East River',
  'Steven\'s Square - Loring Heights': 'Stevens Square - Loring Heights'
};

// Get Minneapolis demographics
var inputMplsDemograpics = {};
_.each(inputDemographics.data, function(d, n) {
  if (n.indexOf('minneapolis') === 0 &&
    n.indexOf('minneapolis_city_of_minneapolis') !== 0 &&
    n.indexOf('minneapolis_community') !== 0) {
    inputMplsDemograpics[n.replace('minneapolis_', '')] = d;
  }
});

// Check counts
if (_.size(inputShapes.features) === _.size(inputSource) && _.size(inputSource) === _.size(inputMplsDemograpics)) {
  // Same size,
}
else {
  console.log('Different amount of records: ' + 
    _.size(inputShapes.features) + ', ' + _.size(inputSource) + 
    ', ' + _.size(inputMplsDemograpics));
}

// Process.  Start with GeoJSON and add on data
var finalJSON = _.clone(inputShapes);
_.each(inputShapes.features, function(neighborhood, n) {
  var key, sourceFound;
  
  // Get the name that we will match on.
  var shapeName = neighborhood.properties.BDNAME;
  
  // Reset properties as the shapefiles properties are not useful
  finalJSON.features[n].properties = {};
  finalJSON.features[n].properties.city = 'minneapolis';
  
  // Match up name from shapefile to source
  shapeName = (!_.isUndefined(translateShapeToSource[shapeName])) ? 
    translateShapeToSource[shapeName] : shapeName;
  sourceFound = _.find(inputSource, function(source, k) {
    return (source.neighborhood == shapeName);
  });
  if (!sourceFound) {
    console.log('Source not found for: ' + shapeName);
  }
  
  // Set neighborhood key
  key = sourceFound.neighborhood_key;
  finalJSON.features[n].properties.key = key;
  finalJSON.features[n].properties.title = sourceFound.neighborhood;
  
  // Get some Demographics.
  // k-5: Total population 2010
  finalJSON.features[n].properties.population2010 = inputMplsDemograpics[key]['k-5'];
});


// Create topojson
var topoInput = { collection: finalJSON };
var topology = topojson.topology(topoInput, {
  id: function(f) {
    f.properties.key
  },
  'property-transform': function(properties, key, value) {
    properties[key] = value;
    return true;
  }
});
fs.writeFile(output, JSON.stringify(topology), function(err) {
  if (err) {
    console.log('Issue writing file: ' + err);
  }
  else {
    console.log('TopoJSON file saved to: ' + output);
  }
}); 