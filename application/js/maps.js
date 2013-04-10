

(function($, undefined) {
  var neighborhoodTopoJSON = '../data/neighborhoods/minneapolis/minneapolis-neighborhoods-2012-keyed.topo.json';
  var $mapContainer = $('#crime-map');
  var width = $mapContainer.width();
  var height = $mapContainer.height();
  
  // Canvas  
  var svg = d3.select('#crime-map').append('svg')
    .attr('width', width)
    .attr('height', height);
    
  // Handle incoming data
  function drawMap(error, neighborhoods) {
    var geojson = topojson.feature(neighborhoods, neighborhoods.objects['minneapolis-neighborhoods-2012-keyed.geo']);
    var projOptions = boundsProjection(geojson, width, height, svg);
  
    var path = d3.geo.path()
      .projection(projOptions.projection);
  
    svg
      .selectAll('path')
        .data(geojson.features)
      .enter().append('path')
        .attr('d', path)
        .attr('class', 'crime-map-boundary')
        .attr('transform', 'translate(' + projOptions.offsetxd + ', ' + projOptions.offsetyd + ')');
  };
  
  // Get data
  d3.json(neighborhoodTopoJSON, drawMap);
  
})(jQuery);


// Fits data into the canvas.
boundsProjection = function(data, w, h, canvas) {
  var proj = d3.geo.mercator().scale(1).translate([0,0]);
  var projOptions = {};
  
  var margin = w * 0.02;
  var bounds0 = d3.geo.bounds(data);
  var bounds = bounds0.map(proj);
  var xscale = (w - 2 * margin) / Math.abs(bounds[1][0] - bounds[0][0]);
  var yscale = (h - 2 * margin) / Math.abs(bounds[1][1] - bounds[0][1]);
  var pscale = Math.min(xscale, yscale);
  var wscale = pscale;
  var d, widthd, heightd;
  
  // Handle projection
  proj.scale(pscale);
  proj.translate(proj([-bounds0[0][0], -bounds0[1][1]]));
  projOptions.path = d3.geo.path().projection(proj);
  
  // Handle svg canvas, dpeneding on orientation
  if (xscale > yscale) {
    d = xscale * Math.abs(bounds[1][0] - bounds[0][0]) - yscale * Math.abs(bounds[1][0] - bounds[0][0]);
    canvas.attr('transform', 'translate(' + d / 2 + ', 0)');
  }
  else {
    d = yscale * Math.abs(bounds[1][1] - bounds[0][1]) - xscale * Math.abs(bounds[1][1] - bounds[0][1]);
    canvas.attr('transform', 'translate(0, ' + d / 5 + ')');
  }
  
  // Handle offset, depending on orientation
  widthd = proj(bounds0[0])[1];
  heightd = proj(bounds0[1])[0];
  if (xscale > yscale) {
    projOptions.offsetxd = (w / 2 - widthd / 2);
    projOptions.offsetyd = margin;
  }
  else {
    projOptions.offsetxd = margin;
    projOptions.offsetyd = (h / 2 - heightd / 2);
  }
  
  projOptions.projection = proj;
  return projOptions;
};