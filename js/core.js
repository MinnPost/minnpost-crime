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
   * Formats number into currency
   */
  formatNumber: function(num, decimals) {
    decimals = decimals || 2;
    var rgx = (/(\d+)(\d{3})/);
    
    split = num.toFixed(decimals).toString().split('.');
    while (rgx.test(split[0])) {
      split[0] = split[0].replace(rgx, '$1' + ',' + '$2');
    }
    return split[0] + '.' + split[1];
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
    return (num * 100).toFixed(1).toString() + '%';
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
    dataCrimeQueryBase: 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=[[[QUERY]]]',
    // See scraper for why this is needed
    dataCrimeQueryWhere: "notes NOT LIKE 'Added to%'"
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
      
      if (_.isUndefined(app.data[name])) {
        
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
})(mpApp['minnpost-crime'], jQuery);