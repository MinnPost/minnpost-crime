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
      app.options.originalTitle = document.title;
      
      // Create data structures and views
      this.createDataStructures();
      this.createApplicationView();
      
      // Render applciation view and mark as loading
      this.applicationView.render().renderGeneralLoading();

      // Fetch and parse initial data
      this.fetchData(function() {
        thisRouter.parseData();
        thisRouter.createViews();
        thisRouter.applicationView.renderStopGeneralLoading();
        thisRouter.applicationView.renderParts();
        thisRouter.start();
      });
    },
    
    // Get initial data
    fetchData: function(done) {
      var thisRouter = this;
    
      // Get the compiled data
      app.getLocalData(this.defaultData).done(function() {
        thisRouter.fetchRecentMonth(function(year, month) {
          app.options.currentYear = year;
          app.options.currentMonth = month;
        }).done(done);
      });
    },
    
    // Get most recent month and year as this will
    // be used throught the application
    fetchRecentMonth: function(done, context) {
      context = context || this;
      var dataCrimeQueryBase = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=[[[QUERY]]]';

      var query = "SELECT month, year FROM swdata ORDER BY year || '-' || month DESC LIMIT 1";
      var defer = $.jsonp({ url: dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query)) });
      
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0].year, data[0].month]);
        });
      }
      return defer;
    },
    
    // Parse initial data
    parseData: function() {
      var thisRouter = this;
      
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
      
      return this;
    },
    
    // Create data structures
    createDataStructures: function() {
      this.cities = new app.CollectionCities();
      this.neighborhoods = new app.CollectionNeighborhoods();
    },
    
    // Create main view
    createApplicationView: function() {
      this.applicationView = new app.ViewContainer({
        el: app.options.el,
        app: this
      });
    },
    
    // Create sub views
    createViews: function() {
      this.applicationView = new app.ViewContainer({
        el: app.options.el,
        app: this
      });
      this.cityView = new app.ViewCity({
        model: this.city,
        app: this,
        el: '.mc-city-view-container'
      });
      this.neighborhoodView = new app.ViewNeighborhood({
        model: this.neighborhood,
        collection: this.neighborhoods,
        app: this,
        el: '.mc-neighborhood-view-container'
      });
      this.cityMapView = new app.ViewNeighborhoodMap({
        collection: this.neighborhoods,
        el: '#city-map',
        app: this
      });
      this.neighborhoodMapView = new app.ViewNeighborhoodMap({
        collection: this.neighborhoods,
        el: '#neighborhood-map',
        app: this
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
      else {
        this.city = city;
        
        // Render
        this.applicationView.renderCity(this.city);
        this.city.fetchData(function() {
          thisRouter.applicationView.renderStopGeneralLoading();
        });
      }
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
      else {
        this.city = city;
        
        // Load up neighborhood
        neighborhood = this.neighborhoods.get(this.city.id + '/' + neighborhood);
        if (!neighborhood) {
          this.routeDefault();
        }
        this.neighborhood = neighborhood;
        
        // Render
        this.applicationView.renderNeighborhood(this.neighborhood, this.city);
        this.neighborhood.fetchData(function() {
          thisRouter.applicationView.renderStopGeneralLoading();
        });
      }
    }
  });
  
  // Wrapper function to start application
  app.start = function(options) {
    app.router = new app.Application(options);
    return app;
  };
})(mpApp['minnpost-crime'], jQuery);