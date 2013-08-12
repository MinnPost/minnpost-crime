/**
 * Main application container for the MinnPost crime
 */
(function(app, $, undefined) {

  app.Application = Backbone.Router.extend({
    routes: {
      'city/:city(/:category)': 'routeCity',
      'neighborhood/:city/:neighborhood(/:category)': 'routeNeighborhood',
      '*defaultR': 'routeDefault'
    },
    
    defaultData: [
      'neighborhoods/minneapolis.topo',
      'crime/categories',
      'cities/cities'
    ],
    
    // Default category
    defaultCategory: 'total',
  
    initialize: function(options) {
      var thisRouter = this;
      this.category = this.defaultCategory;
      
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
    
    // General error handler
    appError: function(message) {
      var thisRouter = this;
      
      return function(error) {
        if (_.isObject(console) && _.isFunction(console.log)) {
          console.log(error);
        }
        
        thisRouter.applicationView.renderErrorMessage(message);
      };
    },
    
    // Get initial data
    fetchData: function(done) {
      var thisRouter = this;
    
      // Get the compiled data
      app.getLocalData(this.defaultData).done(function() {
        thisRouter.fetchRecentMonth(function(year, month) {
          app.options.currentYear = year;
          app.options.currentMonth = month;
        })
        .done(done)
        .fail(thisRouter.appError('Issue retrieving current year and month data.'));
      })
      .fail(thisRouter.appError('Issue retrieving base data.'));
    },
    
    // Get most recent month and year as this will
    // be used throught the application
    fetchRecentMonth: function(done, context) {
      context = context || this;
      var thisRouter = this;
      var dataCrimeQueryBase = 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&query=[[[QUERY]]]';

      var query = "SELECT month, year FROM swdata ORDER BY year || '-' || month DESC LIMIT 1";
      var defer = app.getRemoteData({ url: dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query)) });
      
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          if (_.isObject(data) && !_.isUndefined(data.error)) {
            thisRouter.appError('Issue retrieving current year and month data.')();
          }
          
          done.apply(context, [data[0].year, data[0].month]);
        })
        .fail(thisRouter.appError('Issue retrieving current year and month data.'));
      }
      return defer;
    },
    
    // Parse initial data
    parseData: function() {
      var thisRouter = this;
      
      // Add cities to collections
      _.each(app.data['cities/cities'], function(c, id) {
        c.id = id;
        thisRouter.cities.add(new app.ModelCity(c, {
          app: thisRouter
        }));
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
          thisRouter.neighborhoods.add(new app.ModelNeighborhood(model, {
            app: thisRouter
          }));
        }
      );
      
      return this;
    },
    
    // Create data structures
    createDataStructures: function() {
      this.cities = new app.CollectionCities([], {
        app: this
      });
      this.neighborhoods = new app.CollectionNeighborhoods([], {
        app: this
      });
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
    
    // Set category
    setCategory: function(category) {
      var oldCat = _.clone(this.category);
      this.category = category;
      
      if (oldCat != category) {
        this.trigger('change:category');
      }
      this.applicationView.updateCategory(category);
    },
  
    // Default route
    routeDefault: function() {
      this.navigate('/city/minneapolis/total', { trigger: true, replace: true });
    },
  
    // City route
    routeCity: function(city, category) {
      category = category || this.category || this.defaultCategory;
      var thisRouter = this;
      
      // Load up city
      this.applicationView.renderGeneralLoading();
      city = this.cities.get(city);
      if (_.isUndefined(city)) {
        this.routeDefault();
      }
      else {
        this.city = this.currentModel = city;
        this.setCategory(category);
        this.navigate('/city/' + this.city.id + '/' + this.category, { replace: true });
        
        // Render
        this.applicationView.renderCity(this.city);
        this.city.fetchData(function() {
          // We also need to get recent neighborhood data
          this.neighborhoods.fetchRecentData(function() {
            this.applicationView.renderStopGeneralLoading();
          }, this);
        }, this);
      }
    },
  
    // Neightborhood route
    routeNeighborhood: function(city, neighborhood, category) {
      category = category || this.category || this.defaultCategory;
      var thisRouter = this;
      
      // Load up city
      this.applicationView.renderGeneralLoading();
      city = this.cities.get(city);
      if (_.isUndefined(city)) {
        this.routeDefault();
      }
      else {
        this.city = city;
        this.setCategory(category);
        
        // Load up neighborhood
        neighborhood = this.neighborhoods.get(this.city.id + '/' + neighborhood);
        if (!neighborhood) {
          this.routeDefault();
        }
        this.neighborhood = this.currentModel = neighborhood;
        this.navigate('/neighborhood/' + this.neighborhood.id + '/' + this.category, { replace: true });
        
        // Render and get both the city and the neighborhood data.
        // The city data will be used for some comparisons
        this.applicationView.renderNeighborhood(this.neighborhood, this.city);
        this.city.fetchData(function() {
          this.neighborhood.fetchData(function() {
            // We also need to get recent neighborhood data
            this.neighborhoods.fetchRecentData(function() {
              this.applicationView.renderStopGeneralLoading();
            }, this);
          }, this);
        }, this);
      }
    },
    
    // Route based on geolocation
    routeGeolocate: function(done, context) {
      var thisRouter = this;
    
      this.applicationView.renderGeneralLoading();
      navigator.geolocation.getCurrentPosition(function(position) {
        if (_.isObject(position.coords)) {
          thisRouter.routeGeoCoordinate([position.coords.longitude, position.coords.latitude], 
            done, context);
        }
      }, function(err) {
        thisRouter.appError('Issue retrieving current position.')(err);
      });
    },
    
    // Route based on address
    routeAddress: function(address, done, context) {
      var thisRouter = this;
      var latlng;
      var url = app.options.mapQuestQuery.replace('[[[KEY]]]', app.options.mapQuestKey)
        .replace('[[[ADDRESS]]]', encodeURI(address));
        
      this.applicationView.renderGeneralLoading();
      $.jsonp({ url: url })
        .done(function(response) {
          latlng = response.results[0].locations[0].latLng;
          if (latlng) {
            thisRouter.routeGeoCoordinate([latlng.lng, latlng.lat], done, context);
          }
          else {
            thisRouter.appError('Issue retrieving position from address.')(response);
          }
        })
        .fail(thisRouter.appError('Issue retrieving position from address.'));
    },
    
    // Route based on geo point
    routeGeoCoordinate: function(lonlat, done, context) {
      if (!_.isArray(lonlat)) {
        return;
      }
      var map, found;
      
      // Not sure which map has rendered, so try both
      view = (!_.isUndefined(this.cityMapView.map)) ? this.cityMapView :
        ((!_.isUndefined(this.neighborhoodMapView.map)) ? this.neighborhoodMapView : false);
      if (_.isObject(view)) {
        // Find neighborhood layer
        found = this.neighborhoods.find(function(n) {
          return app.pip(lonlat, n.get('geoJSON').geometry.coordinates[0]);
        });
        if (found) {
          this.navigate('/neighborhood/' + found.id + 
            '/' + this.category, { trigger: true });
        }
        else {
          this.appError('Could not find your location on the map.')(found);
        }
      }
    }
  });
  
  // Wrapper function to start application
  app.start = function(options) {
    app.router = new app.Application(options);
    return app;
  };
})(mpApp['minnpost-crime'], jQuery);