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
var input2010Demographics = require(path.resolve(__dirname, '../data/demographics/2010/twin-cities-neighborhood-demographics-2010.json'));
var input2000Demographics = require(path.resolve(__dirname, '../data/demographics/2000/minneapolis-demographics-2000.json'));
var inputSource = require(path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012.json'));
var inputShapes = require(path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods.geo.json'));

// Output
var output = path.resolve(__dirname, '../data/neighborhoods/minneapolis/minneapolis-neighborhoods.topo.json');

// Manual translation of shapefile name to neighborhood key
var translateShapeToSource = {
  'Prospect Park - East River Road': 'Prospect Park - East River',
  'Steven\'s Square - Loring Heights': 'Stevens Square - Loring Heights'
};

// Manually translate some of the 2000 demo
var translateKeyToDemo2000 = {
  'cedar_riverside': 'cedar_riverside_west_bank',
  'prospect_park_east_river': 'prospect_park',
  'university_of_minnesota': 'u_of_mn',
  'jordan': 'jordon',
  'stevens_square_loring_heights': 'stevens_square_loring_hgts_',
  'northrop': 'northrup',
  'mid_city_industrial': 'mid_city_ind_area',
  'nicollet_island_east_bank': 'nicollet_island'
};

// Manual 2000 population numbers (see README about Phillips)
var populations2000Phillips = {
  'phillips_west': 4771,
  'ventura_village': 6769,
  'east_phillips': 4147,
  'midtown_phillips': 4118
};

// Get Minneapolis demographics
var inputMpls2010Demographics = {};
_.each(input2010Demographics.data, function(d, n) {
  if (n.indexOf('minneapolis') === 0 &&
    n.indexOf('minneapolis_city_of_minneapolis') !== 0 &&
    n.indexOf('minneapolis_community') !== 0) {
    inputMpls2010Demographics[n.replace('minneapolis_', '')] = d;
  }
});

// Check counts
if (_.size(inputShapes.features) === _.size(inputSource) && _.size(inputSource) === _.size(inputMpls2010Demographics)) {
  // Same size,
}
else {
  console.log('Different amount of records: ' + 
    _.size(inputShapes.features) + ', ' + _.size(inputSource) + 
    ', ' + _.size(inputMpls2010Demographics));
}

// Process.  Start with GeoJSON and add on data
var finalJSON = _.clone(inputShapes);
_.each(inputShapes.features, function(neighborhood, n) {
  var key, sourceFound, demo2000Search, demo2000Found;
  
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
  demo2000Search = key;
  finalJSON.features[n].properties.key = key;
  finalJSON.features[n].properties.title = sourceFound.neighborhood;
  
  // Get some 2010 Demographics.
  // k-5: Total population 2010
  finalJSON.features[n].properties.population = finalJSON.features[n].properties.population || {};
  finalJSON.features[n].properties.population['2010']= inputMpls2010Demographics[key]['k-5'];
  
  // Get some 2000 demographics
  demo2000Search = (!_.isUndefined(translateKeyToDemo2000[demo2000Search])) ?
    translateKeyToDemo2000[demo2000Search] : demo2000Search;
  demo2000Found = _.find(input2000Demographics, function(demo, k) {
    return (demo.neighborhood_key == demo2000Search);
  });
  if (!demo2000Found && _.isUndefined(populations2000Phillips[demo2000Search])) {
    console.log('Demo 2000 not found for: ' + key);
  }
  finalJSON.features[n].properties.population['2000']= (demo2000Found) ? 
    demo2000Found.total : populations2000Phillips[demo2000Search];
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