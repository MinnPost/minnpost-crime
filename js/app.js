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
    
    defaultData: [
      'neighborhoods/minneapolis.topo',
      'crime/categories',
      'cities/cities'
    ],
  
    initialize: function(options) {
      var thisRouter = this;
      _.bindAll(this);
      
      // Set app options
      app.options = _.extend(app.defaultOptions, options);
      
      // Create main container view
      this.applicationView = new app.ViewContainer({
        el: app.options.el
      }).render().renderGeneralLoading();
      
      // Create collections and views (we use one view
      // for multiple models to handle transition
      // values.
      this.cities = new app.CollectionCities();
      this.neighborhoods = new app.CollectionNeighborhoods();
      this.cityView = new app.ViewCity({ app: this });
      this.neighborhoodView = new app.ViewNeighborhood({ app: this });
      
      // Get the compiled data
      app.getLocalData(this.defaultData).done(function() {
        // Add cities to collections
        _.each(app.data['cities/cities'], function(c, id) {
          c.id = id;
          thisRouter.cities.add(new app.ModelCity(c));
        });
      
        // Add neighborhoods to collection
        _.each(topojson.feature(app.data['neighborhoods/minneapolis.topo'], 
          app.data['neighborhoods/minneapolis.topo'].objects.neighborhoods).features,
          function(feature, i) {
            var model = _.clone(feature.properties);
            model.id = model.city + '/' + model.key;
            
            // Take out properties as we will store them in the
            // the model, not in the geoJSON
            delete feature.properties;
            model.geoJSON = feature;
            model.geoJSON.id = model.id;
            
            // Make id based on city as well
            thisRouter.neighborhoods.add(new app.ModelNeighborhood(model));
          }
        );
        
        thisRouter.start();
      });
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
      
      // Load up city
      this.applicationView.renderGeneralLoading();
      city = this.cities.get(city);
      if (_.isUndefined(city)) {
        this.routeDefault();
      }
      this.city = city;
      
      // Render
      this.applicationView.renderContent(this.cityView, this.city, this.neighborhoods);
      this.city.fetchData(function() {
        thisRouter.applicationView.renderStopGeneralLoading();
      });
    },
  
    // Neightborhood route
    routeNeighborhood: function(city, neighborhood) {
      var thisRouter = this;
      
      // Load up city
      this.applicationView.renderGeneralLoading();
      city = this.cities.get(city);
      if (_.isUndefined(city)) {
        this.routeDefault();
      }
      this.city = city;
      
      // Load up neighborhood
      neighborhood = this.neighborhoods.get(this.city.id + '/' + neighborhood);
      if (!neighborhood) {
        this.routeDefault();
      }
      this.neighborhood = neighborhood;
      
      // Render
      /*
      this.applicationView.renderContent(this.neighborhoodView, this.neighborhood, this.neighborhoods);
      this.neighborhood.fetchData(function() {
        thisRouter.applicationView.renderStopGeneralLoading();
      });
      */
    }
  });
  
  // Wrapper function to start application
  app.start = function(options) {
    app.router = new app.Application(options);
    return app;
  };
})(mpApp['minnpost-crime'], jQuery);