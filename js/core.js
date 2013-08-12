/**
 * Some core functionality for minnpost-crime
 */

/**
 * Global variable to handle some things
 * like templates.
 */
var mpApp = mpApp || {};
mpApp['minnpost-crime'] = mpApp['minnpost-crime'] || {};

/**
 * Extend underscore
 */
_.mixin({
  /**
   * Formats number 
   */
  formatNumber: function(num, decimals) {
    decimals = (_.isUndefined(decimals)) ? 2 : decimals;
    var rgx = (/(\d+)(\d{3})/);
    split = num.toFixed(decimals).toString().split('.');
    
    while (rgx.test(split[0])) {
      split[0] = split[0].replace(rgx, '$1' + ',' + '$2');
    }
    return (decimals) ? split[0] + '.' + split[1] : split[0];
  },
  
  /**
   * Formats number into currency
   */
  formatCurrency: function(num) {
    return '$' + _.formatNumber(num, 2);
  },
  
  /**
   * Formats percentage
   */
  formatPercent: function(num) {
    return _.formatNumber(num * 100, 1) + '%';
  },
  
  /**
   * Formats percent change
   */
  formatPercentChange: function(num) {
    return ((num > 0) ? '+' : '') + _.formatPercent(num);
  },
  
  /**
   * Formats percent change with HTML
   */
  formatPercentChangeStyled: function(num) {
    var cClass = (num === 0) ? 'zero' : ((num > 0) ? 'positive' : 'negative');
    return '<span class="per-change per-change-' + cClass + '">' + _.formatPercent(num) + '</span>';
  },
  
  /**
   * Strips formatting from number
   */
  stripNumber: function(text) {
    return text.replace(/[^0-9\.]+/g, '');  
  }
});
  
/**
 * Override Backbone's ajax function to use $.jsonp as it handles
 * errors for JSONP requests
 */
if (_.isFunction(Backbone.$.jsonp)) {
  Backbone.ajax = function() {
    return Backbone.$.jsonp.apply(Backbone.$, arguments);
  };
}

/**
 * Non global
 */
(function(app, $, undefined) {
  app.defaultOptions = {
    dataPath: './data/',
    // Please don't steal/abuse
    mapQuestKey: 'Fmjtd%7Cluub2d01ng%2C8g%3Do5-9ua20a',
    mapQuestQuery: 'http://www.mapquestapi.com/geocoding/v1/address?key=[[[KEY]]]&outFormat=json&callback=?&countrycodes=us&maxResults=1&location=[[[ADDRESS]]]'
  };
  
  /**
   * Template handling.  For development, we want to use
   * the template files directly, but for build, they should be
   * compiled into JS.
   *
   * See JST grunt plugin to understand how templates
   * are compiled.
   *
   * Expects callback like: function(compiledTemplate) {  }
   */
  app.templates = app.templates || {};
  app.getTemplate = function(name, callback, context) {
    var templatePath = 'js/templates/' + name + '.html';
    context = context || app;
    
    if (!_.isUndefined(app.templates[templatePath])) {
      callback.apply(context, [ app.templates[templatePath] ]);
    }
    else {
      $.ajax({
        url: templatePath,
        method: 'GET',
        async: false,
        contentType: 'text',
        success: function(data) {
          app.templates[templatePath] = _.template(data);
          callback.apply(context, [ app.templates[templatePath] ]);
        }
      });
    }
  };
  
  /**
   * Data source handling.  For development, we can call
   * the data directly from the JSON file, but for production
   * we want to proxy for JSONP.
   *
   * `name` should be relative path to dataset minus the .json
   *
   * Returns jQuery's defferred object.
   */
  app.data = app.data || {};
  app.getLocalData = function(name) {
    var proxyPrefix = 'http://mp-jsonproxy.herokuapp.com/proxy?callback=?&url=';
    var useJSONP = false;
    var defers = [];
    
    name = (_.isArray(name)) ? name : [ name ];
    
    // If the data path is not relative, then use JSONP
    if (app.options && app.options.dataPath.indexOf('http') === 0) {
      useJSONP = true;
    }
    
    // Go through each file and add to defers
    _.each(name, function(d) {
      var defer;
      if (_.isUndefined(app.data[d])) {
        
        if (useJSONP) {
          defer = $.jsonp({
            url: proxyPrefix + encodeURI(app.options.dataPath + d + '.json')
          });
        }
        else {
          defer = $.getJSON(app.options.dataPath + d + '.json');
        }
        
        $.when(defer).done(function(data) {
          app.data[d] = data;
        });
        defers.push(defer);
      }
    });
    
    return $.when.apply($, defers);
  };
  
  /**
   * Get remote data.  Provides a wrapper around
   * getting a remote data source, to use a proxy
   * if needed, such as using a cache.
   */
  app.getRemoteData = function(options) {
    if (app.options.remoteProxy) {
      options.url = options.url + '&callback=proxied_jqjsp';
      options.url = app.options.remoteProxy + encodeURIComponent(options.url);
      options.callback = 'proxied_jqjsp';
      options.cache = true;
    }
    else {
      options.url = options.url + '&callback=?';
    }
    
    return $.jsonp(options);
  };
  
  /**
   * Point in polygon search from
   * https://github.com/substack/point-in-polygon
   */
  app.pip = function(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    
    var x = point[0], y = point[1];
    
    var inside = false;
    for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];
      
      var intersect = ((yi > y) != (yj > y)) && 
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    
    return inside;
  };
})(mpApp['minnpost-crime'], jQuery);