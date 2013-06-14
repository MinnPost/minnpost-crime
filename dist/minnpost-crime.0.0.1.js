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
  formatCurrency: function(num) {
    var rgx = (/(\d+)(\d{3})/);
    split = num.toFixed(2).toString().split('.');
    while (rgx.test(split[0])) {
      split[0] = split[0].replace(rgx, '$1' + ',' + '$2');
    }
    return '$' + split[0] + '.' + split[1];
  },
  
  /**
   * Formats percentage
   */
  formatPercentage: function(num) {
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
    dataPath: './'
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
  app.getData = function(name) {
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
      
      if (useJSONP) {
        defer = $.jsonp({
          url: proxyPrefix + encodeURI(app.options.dataPath + d + '.json')
        });
      }
      else {
        defer = $.getJSON(app.options.dataPath + d + '.json');
      }
      
      defers.push(defer);
    });
    
    return $.when.apply($, defers);
  };
})(mpApp['minnpost-crime'], jQuery);

/**
 * Main application container for the MinnPost crime
 */
(function(app, $, undefined) {

  app.Application = Backbone.Router.extend({
    routes: {
      'city/:city': 'routeCity',
      'neighborhood/:city/:neighborhood': 'routeNeighborhood',
      '*defaultR': 'routeDefault'
    },
  
    initialize: function(options) {
      _.bindAll(this);
      
      // Set app options
      app.options = _.extend(app.defaultOptions, options);
      
      // Create main container view
      this.applicationView = new app.ViewContainer({
        el: app.options.el
      }).render().renderGeneralLoading();
      
      this.start();
    },
    
    // Start application (after data has been loaded),
    // specifically start Backbone history
    start: function() {
      Backbone.history.start();
    },
  
    // Default route
    routeDefault: function() {
      this.navigate('/city/minneapolis', { trigger: true, replace: true });
    },
  
    // City route
    routeCity: function(city) {
    },
  
    // Neightborhood route
    neighborhood: function(city, neighborhood) {
    }
  });
  
  // Wrapper function to start application
  app.start = function(options) {
    app.router = new app.Application(options);
    return app;
  };
})(mpApp['minnpost-crime'], jQuery);

/**
 * Models for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Model for city level data
   */
  app.ModelCity = Backbone.Model.extend({
    
  });

  /**
   * Model for neighborhood level data
   */
  app.ModelNeighborhood = Backbone.Model.extend({
    
  });


})(mpApp['minnpost-crime'], jQuery);

/**
 * Collections for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Collection for city models
   */
  app.CollectionCities = Backbone.Collection.extend({
    model: app.ModelCity
    
  });

  /**
   * Collection for neighborhood models
   */
  app.CollectionNeighborhoods = Backbone.Collection.extend({
    model: app.ModelNeighborhood
    
  });


})(mpApp['minnpost-crime'], jQuery);

/**
 * Views for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Main application view
   */
  app.ViewContainer = Backbone.View.extend({
    
    // Main template render
    render: function() {
      app.getTemplate('template-application-container', function(template) {
        $(this.el).html(template({ }));
      }, this);
      return this;
    },
    
    // Display loading
    renderLoading: function(el) {
      var $el = (_.isUndefined(el)) ? $(this.el) : $(this.el).find(el);
    
      app.getTemplate('template-loading', function(template) {
        $el.html(template({ }));
      }, this);
      return this;
    },
    
    // Display loading specifically in the header
    renderGeneralLoading: function() {
      this.renderLoading('.general-loading .col');
      $('.general-loading').slideDown();
      return this;
    },
    
    // Stop general loading
    renderStopGeneralLoading: function() {
      this.$el.find('.general-loading').slideUp();
      return this;
    }
  });


})(mpApp['minnpost-crime'], jQuery);