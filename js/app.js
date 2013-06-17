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
      }).render();
      
      // Create collections and views (we use one view
      // for multiple models to handle transition
      // values.
      this.cities = new app.CollectionCities();
      this.neighborhoods = new app.CollectionNeighborhoods();
      this.cityView = new app.ViewCity();
      this.neighborhoodView = new app.ViewNeighborhood();
      
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
      var thisRouter = this;
      
      // Check if valid city
      if (_.indexOf(app.options.validCities, city) === -1) {
        this.routeDefault();
      }
      
      // Load up city
      this.applicationView.renderGeneralLoading();
      this.city = this.cities.get(city);
      if (_.isUndefined(this.city)) {
        this.city = new app.ModelCity({ id: city });
        this.cities.add(this.city);
      }
      
      this.applicationView.renderContent(this.cityView, this.city);
      this.city.fetchData(function() {
        thisRouter.applicationView.renderStopGeneralLoading();
      });
    },
  
    // Neightborhood route
    routeNeighborhood: function(city, neighborhood) {
    }
  });
  
  // Wrapper function to start application
  app.start = function(options) {
    app.router = new app.Application(options);
    return app;
  };
})(mpApp['minnpost-crime'], jQuery);