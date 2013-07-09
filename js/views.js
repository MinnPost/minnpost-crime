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
      // Render container
      app.getTemplate('template-application-container', function(template) {
        $(this.el).html(template({ }));
      }, this);
      return this;
    },
    
    // Render sub parts
    renderParts: function() {
      // Render city and neighborhood view
      this.options.app.cityView.render();
      this.options.app.cityMapView.render();
      this.options.app.neighborhoodView.render();
      this.options.app.neighborhoodMapView.render();
      return this;
    },
    
    // Render City view
    renderCity: function(cityModel) {
      var thisView = this;
      var stickit = false;
      
      if (!_.isUndefined(this.options.app.cityView.model) && 
        this.options.app.cityView.model.cid != cityModel.cid) {
        stickit = true;
      }
      
      this.options.app.cityView.model = cityModel;
      this.options.app.cityView.$el.slideDown(function() {
        thisView.options.app.cityMapView.model = cityModel;
        thisView.options.app.cityMapView.renderMap();
      });
      this.options.app.neighborhoodView.$el.slideUp();
      
      // If the model has changed or if the model had not been stuck
      if (!_.isObject(this.options.app.cityView._modelBindings) || stickit) {
        this.options.app.cityView.stickit();
      }
      
      return this;
    },
    
    // Render Neighborhood view
    renderNeighborhood: function(neighborhoodModel, cityModel) {
      var thisView = this;
      var stickit = false;
      
      this.options.app.cityView.model = cityModel;
      if (!_.isUndefined(this.options.app.neighborhoodView.model) && 
        this.options.app.neighborhoodView.model.cid != neighborhoodModel.cid) {
        stickit = true;
      }
      
      this.options.app.neighborhoodView.model = neighborhoodModel;
      this.options.app.neighborhoodView.$el.slideDown(function() {
        thisView.options.app.neighborhoodMapView.model = neighborhoodModel;
        thisView.options.app.neighborhoodMapView.renderMap(false);
        thisView.options.app.neighborhoodMapView.mapFocusNeighborhood(neighborhoodModel);
      });
      this.options.app.cityView.$el.slideUp();
      
      // If the model has changed or if the model had not been stuck
      if (!_.isObject(this.options.app.neighborhoodView._modelBindings) || stickit) {
        this.options.app.neighborhoodView.stickit();
      }
      
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
      this.renderLoading('.messaging-container .column');
      return this;
    },
    
    // Stop general loading
    renderStopGeneralLoading: function() {
      this.$el.find('.messaging-container .loading').fadeOut(function() {
        $(this).remove();
      });
      return this;
    }
  });

  /**
   * View that holds common binding functions
   */
  app.ViewBinding = Backbone.View.extend({
  
    commonBindings: {
      '.section-title': { observe: 'title', update: 'bindUpdateDocumentTitle' },
      '.population-numbers': { observe: 'population', update: 'bindUpdatePopulation' },
      '.current-month': { observe: 'currentMonth', update: 'bindUpdateSlide', onGet: 'bindSetFormatMonth' },
      '.current-year': { observe: 'currentYear', update: 'bindUpdateSlide' },
      // Categories
      '.category-title': { observe: 'currentCategoryTitle', update: 'bindUpdateSlide' },
      '.category-select': { observe: 'currentCategory' },
      // Stats
      '.stat-change-last-month .stat-value': { observe: 'statChangeLastMonth', update: 'bindUpdateCount' },
      '.stat-change-month-last-year .stat-value': { observe: 'statChangeMonthLastYear', update: 'bindUpdateCount' },
      '.stat-incidents-month .stat-value': {
        observe: 'statIncidentsMonth', 
        update: 'bindUpdateCount',
        options: { formatter: 'formatNumber', argument: 0 }
      },
      '.stat-rate-month .stat-value': {
        observe: 'statRateMonth',
        update: 'bindUpdateCount',
        options: { formatter: 'formatNumber' }
      },
      '.category-stats': { observe: 'crimesByMonth', update: 'bindUpdateCategoryCrime' }
    },
    
    // Format month
    bindSetFormatMonth: function(val, options) {
      return (val) ? moment(val.toString(), 'MM').format('MMMM') : '';
    },
    
    // Animate count to value
    bindUpdateCount: function($el, val, model, options) {
      if (_.isNumber(val)) {
        var number = (_.isNaN(parseInt($el.text(), 10))) ? 0 : 
          (parseInt($el.text(), 10) / 100);
        var formatOption = (_.isObject(options.options)) ? options.options.formatter : 'formatPercentChange';
        var formatArgument = (_.isObject(options.options)) ? options.options.argument : undefined;
        var formatter = (_.isFunction(formatOption)) ? formatOption :
          ((_.isFunction(_[formatOption])) ? _[formatOption] : function(v) { return v; } );
        var interval, intervalID, greaterThan;
        
        if (_.isNumber(val) && val != number) {
          greaterThan = (val > number);
          interval = (val - number) / 40;
          
          intervalID = setInterval(function() {
            number = number + interval;
            $el.html(formatter(number, formatArgument));
            
            if ((greaterThan && number >= val) || (!greaterThan && number <= val)) {
              $el.html(formatter(val, formatArgument));
              clearInterval(intervalID);
            }
          }, 20);
        }
        else {
          $el.html(formatter(val, formatArgument));
        }
      }
    },
    
    // Update current month
    bindUpdateCurrentMonthDisplay: function($el, val, model, options) {
      var month = (val) ? moment(val.toString(), 'MM').format('MMMM') : '';
      var year = model.get('currentYear');
      this.bindUpdateFade($el, (month && year) ? month + ', ' + year : '', model, options);
    },
    
    // Fade out then in
    bindUpdateFade: function($el, val, model, options) {
      if ($el.text() !== val && $el.html() !== val) {
        $el.fadeOut('fast', function() {
          $el.html(val).fadeIn('fast');
        });
      }
    },
    
    // Slide up, slide down
    bindUpdateSlide: function($el, val, model, options) {
      if ($el.text() !== val && $el.html() !== val) {
        $el.slideUp('fast', function() {
          $el.html(val).slideDown('fast');
        });
      }
    },
    
    // Update document title as well
    bindUpdateDocumentTitle: function($el, val, model, options) {
      this.bindUpdateFade($el, val, model, options);
      document.title = app.options.originalTitle + ' | ' + val;
    },
    
    // Update crime categories based on last month
    bindUpdateCategoryCrime: function($el, val, model, options) {
      if (!_.isUndefined(model.get('crimesByMonth'))) {
        var incidentOptions = _.extend(_.clone(options), 
          { options: { formatter: 'formatNumber', argument: 0 }});
          
        _.each(model.get('categories'), function(cat, c) {
          var stat, $statEl;
          
          // Incidents
          stat = model.getCrimeByMonth(model.get('currentYear'), model.get('currentMonth'), c);
          $statEl = $el.find('.category-stat-' + c + ' .stat-incidents');
          this.bindUpdateCount($statEl, stat, model, incidentOptions);
        
          // Change
          stat = model.getMonthChange(model.get('lastMonthYear'), model.get('lastMonthMonth'), c);
          $statEl = $el.find('.category-stat-' + c + ' .stat-change');
          this.bindUpdateCount($statEl, stat, model, options);
        }, this);
      }
    },
    
    // Update populations numbers
    bindUpdatePopulation: function($el, val, model, options) {
      var population = model.get('population');
      options.options = { formatter: 'formatNumber', argument: 0 };
      
      if (_.isObject(population) && !_.isUndefined(population[2010])) {
        this.bindUpdateCount($el.find('.population-2010'), population[2010], model, options);
        this.bindUpdateCount($el.find('.population-2000'), population[2000], model, options);
      }
    },
    
    // Default chart options
    plotOptions: {
      seriesColors: ['#10517F'],
      grid: {
        drawBorder: false,
        background: '#fafafa',
        gridLineColor: '#dddddd',
        shadow: false
      },
      seriesDefaults: {
        shadow: false,
        markerOptions: {
          size: 6,
          shadow: false
        },
        rendererOptions: {
          barPadding: 0,
          barMargin: 2 
        }
      },
      axes: {
        xaxis: {
          renderer: $.jqplot.CategoryAxisRenderer
        },
        yaxis: {
          min: 0,
          tickOptions: {
            formatter: function(format, value) { return _.formatNumber(value, 0); } 
          }
        }
      },
      highlighter: {
        show: true,
        sizeAdjust: 7,
        tooltipAxes: 'y'
      }
    },
    
    // Chart showing last 12 months
    bindUpdateChartLast12Months: function($el, val, model, options) {
      var data1 = model.getLastYearData(1);
      var data2 = model.getLastYearData(2);
      var plotOptions = _.clone(this.plotOptions);
      plotOptions.seriesColors = ['#BCBCBC', '#10517F'];

      if (_.isArray(data1) && data1.length > 0 && _.isArray(data2) && data2.length > 0) {
        $.jqplot($el.attr('id'), [data2, data1], plotOptions).redraw();
      }
    },
    
    // Chart to show how many incidents this year with history
    bindUpdateIncidentsThisYearHistory: function($el, val, model, options) {
      var data = model.getIncidentsThisYearHistory();
      
      if (_.isArray(data) && data.length > 0) {
        $.jqplot($el.attr('id'), [data], this.plotOptions).redraw();
      }
    },
    
    bindUpdateChartIncidentRatePerYear: function($el, val, model, options) {
      var data = model.getIncidentRatesPerYear();
      var plotOptions = _.clone(this.plotOptions);
      plotOptions.axes.yaxis.tickOptions = {};
      
      if (_.isArray(data) && data.length > 0) {
        $.jqplot($el.attr('id'), [data], plotOptions).redraw();
      }
    },
    
    // Update the coloring of the map based on category
    updateMapVisualization: function(category, mapView) {
      if (!this.options.app.neighborhoods.fetchedRecentData || _.isUndefined(this.model)) {
        return;
      }
      
      mapView = mapView || 'cityMapView';
      category = category || this.model.get('currentCategory');
      categoryObject = this.model.get('categories')[category];
    
      // Since we use the same neighborhood models
      // for city view and individual eighborhood view,
      // we don't want to step on toes and set
      // the category, unnecessarily
      this.options.app.neighborhoods.each(function(n) {
        n.set('cityMapValue', n.getCrimeRateByMonth(undefined, undefined, category));
      });
      this.options.app[mapView].mapVisualizeNeighborhoods(
        'cityMapValue', categoryObject.title + ' incident rate');
      
      return this;
    }
  });

  /**
   * View for city
   */
  app.ViewCity = app.ViewBinding.extend({
    model: app.ModelCity,
    
    initialize: function() {
      var thisView = this;
      this.bindings = this.bindings || {};
      this.bindings = _.extend(this.commonBindings, this.bindings);
      
      // Trigger color change
      this.options.app.neighborhoods.on('fetchedRecentData', function(e) {
        thisView.updateMapVisualization(undefined, 'cityMapView');
      });
    },
  
    bindings: {
      // Charts
      '#chart-city-last-year': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateChartLast12Months' },
      '#chart-city-incidents-this-year-history': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateIncidentsThisYearHistory' },
      '#chart-city-incident-rate-per-year': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateChartIncidentRatePerYear' },
      // Map
      '#city-map': { observe: 'currentCategory', update: 'bindUpdateMapVisualization' }
    },
    
    // Main render container
    render: function() {
      var data = (_.isObject(this.model)) ? this.model.toJSON() : 
        { categories: app.data['crime/categories'] };
    
      app.getTemplate('template-city', function(template) {
        this.$el.html(template(data));
      }, this);
      return this;
    },
    
    // Binder for map visulization update
    bindUpdateMapVisualization: function($el, val, model, options) {
      this.updateMapVisualization(val, 'cityMapView');
    }
  });

  /**
   * View for neighborhood
   */
  app.ViewNeighborhood = app.ViewBinding.extend({
    model: app.ModelNeighborhood,
    
    initialize: function() {
      var thisView = this;
      this.bindings = this.bindings || {};
      this.bindings = _.extend(this.commonBindings, this.bindings);
      
      // Trigger color change when all neighborhood data comes in
      this.options.app.neighborhoods.on('fetchedRecentData', function(e) {
        thisView.updateMapVisualization(undefined, 'neighborhoodMapView');
      });
    },
  
    bindings: {
      '.city-link': { observe: 'city', update: 'bindUpdateCityLink' },
      // Charts
      '#chart-neighborhood-last-year': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateChartLast12Months' },
      '#chart-neighborhood-incident-rate-per-year': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateChartIncidentRatePerYear' },
      '#chart-neighborhood-incidents-this-year-history': { 
        observe: ['crimesByMonth', 'currentCategory'], update: 'bindUpdateIncidentsThisYearHistory' },
      // Map
      '#neighborhood-map': { observe: 'currentCategory', update: 'bindUpdateMapVisualization' }
    },
    
    bindUpdateCityLink: function($el, val, model, options) {
      var city = this.options.app.cities.get(val);
      if (_.isObject(city)) {
        $el.attr('href', '#city/' + city.id);
        this.bindUpdateFade($el, city.get('title'), model, options);
      }
    },
    
    // Binder for map visulization update
    bindUpdateMapVisualization: function($el, val, model, options) {
      this.updateMapVisualization(val, 'neighborhoodMapView');
    },
    
    render: function() {
      var data = (_.isObject(this.model)) ? this.model.toJSON() : 
        { categories: app.data['crime/categories'] };
      
      app.getTemplate('template-neighborhood', function(template) {
        this.$el.html(template(data));
      }, this);
      return this;
    }
  
  });

  /**
   * View for neighborhood map
   */
  app.ViewNeighborhoodMap = app.ViewBinding.extend({
    collection: app.CollectionNeighborhoods,
    
    styleDefault: {
      stroke: true,
      color: '#424242',
      weight: 1,
      opacity: 0.8,
      fill: true,
      fillColor: '#DFDFDF', //#107F3E
      fillOpacity: 0.7
    },
    
    initialize: function() {
      this.mapRendered = false;
      this.templates = this.templates || {};
      
      // Get hover template.  This should be use
      // with a callback
      app.getTemplate('template-map-label', function(template) {
        this.templates = this.templates || {};
        this.templates['template-map-label'] = template;
      }, this);
      
      // Get legend template.
      app.getTemplate('template-map-legend', function(template) {
        this.templates['template-map-legend'] = template;
      }, this);
      
      // Set legend element
    },
     
    // Get legend element
    getLegendEl: function() {
      if (_.isUndefined(this.$legendEl) || !_.isObject(this.$legendEl) || 
        this.$legendEl.length === 0) {
        this.$legendEl = this.$el.parent().find('.map-legend');
      }
      return this.$legendEl;
    },
    
    // Renders out collection
    render: function() {
      return this;
    },
    
    // Render map
    renderMap: function(fitGroup) {
      fitGroup = (!_.isUndefined(fitGroup)) ? fitGroup : true;
      var thisView = this;
      var baseLayer = new L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png');
      
      if (_.isUndefined(this.el)) {
        this.setElement(this.$el.selector);
      }
      
      // Only render the map once
      if (this.mapRendered === false) {
        this.map = new L.Map(this.el);
        this.map.setView([44.9800, -93.2636], 12);
        this.map.addLayer(baseLayer);
        this.map.attributionControl.setPrefix(false);
        this.renderLabelContainer();
        
        this.featureGroup = new L.featureGroup();
        
        this.collection.each(function(n) {
          var layer = new L.geoJson(n.get('geoJSON'));
          
          layer.setStyle(thisView.styleDefault);
          thisView.featureGroup.addLayer(layer);
          
          layer.on('mouseover', thisView.bindMapFeatureMouseover, thisView);
          layer.on('mouseout', thisView.bindMapFeatureMouseout, thisView);
          layer.on('click', thisView.bindMapFeatureClick, thisView);
          thisView.map.addLayer(layer);
        });
        
        if (fitGroup) {
          this.map.fitBounds(this.featureGroup.getBounds());
        }
        this.mapRendered = true;
      }
      
      return this;
    },
    
    // Render/visualize neighborhoods based on a property
    mapVisualizeNeighborhoods: function(property, label, formatter, exceptions) {
      var thisView = this;
      exceptions = exceptions || ['northeast_park', 'mid_city_industrial', 'camden_industrial', 'humboldt_industrial_area', 'downtown_west'];
      this.visualProperty = property || 'statRateMonth';
      this.visualLabel = label || 'Incident rate';
      this.visualFormatter = formatter || _.formatNumber;
      var legend = [];
      var data, colorScale;
      
      if (_.isUndefined(this.featureGroup)) {
        return;
      }
      
      // Remove any exceptions from data range
      data = this.collection.filter(function(n) {
        return (exceptions.indexOf(n.get('key')) === -1);
      });
      data = _.map(data, function(e) { return e.get(thisView.visualProperty); });
      
      // Create color scale.  k-means minus exceptions seems to be the best
      // visual
      colorScale = chroma.scale('YlGnBu')  //['#107F3E', '#B61673'] ['#107F3E', '#76107F']
        .domain(data, 9, 'k-means')
        .mode('lab');
      
      // Create legend data
      _.each(chroma.limits(data, 'k-means', 9), function(l) {
        legend.push({ value: l, color: colorScale(l).hex() });
      });
      this.getLegendEl().html(this.templates['template-map-legend']({ legend: legend }));
      
      // Color each layer
      this.collection.each(function(m) {
        var layer = thisView.getLayerByModel(m);
        var options = layer.options;
        options.fillColor = colorScale(m.get(thisView.visualProperty)).hex();
        layer.setStyle(options);
      });
    },
    
    // Focus on neighnorhood
    mapFocusNeighborhood: function(model) {
      this.model = (_.isObject(model)) ? model : this.model;
      var layer, options;
      
      // If model is set, show specific neighborhood.
      // TODO: Need to reset weight on other layers
      if (_.isObject(this.model)) {
        this.featureGroup.setStyle({ weight: this.styleDefault.weight });
        layer = this.getLayerByModel();
        options = layer._layers[layer._leaflet_id - 1].options;
        options.weight = options.weight + 8;
        layer.setStyle(options);
        layer.bringToFront();
        this.map.fitBounds(layer.getBounds());
      }
      
      return this;
    },
    
    // Make hover container
    renderLabelContainer: function() {
      this.LabelControl = this.LabelControl || L.Control.extend({
        options: {
          position: 'topright'
        },

        onAdd: function (map) {
          var container = L.DomUtil.create('div', 'map-label-container');
          return container;
        }
      });

      this.map.addControl(new this.LabelControl());
      this.$el.find('.map-label-container').hide();
      return this;
    },
    
    // How to handle mouseover events
    bindMapFeatureMouseover: function(e) {
      // Is this the best way to get this
      var layer = e.layer._layers[e.layer._leaflet_id - 1];
      var options = layer.options;
      var neighborhood = this.collection.get(layer.feature.id);
      options.fillOpacity = options.fillOpacity * 4;
      layer.setStyle(options);
      
      // Label
      this.$el.find('.map-label-container').html(
        this.templates['template-map-label']({
          title: neighborhood.get('title'),
          property: neighborhood.get(this.visualProperty),
          label: this.visualLabel,
          formatter: this.visualFormatter
        })
      ).show();
    },
    
    // How to handle mouseout events
    bindMapFeatureMouseout: function(e) {
      var layer = e.layer._layers[e.layer._leaflet_id - 1];
      var options = layer.options;
      options.fillOpacity = options.fillOpacity / 4;
      layer.setStyle(options);
      
      // Label
      this.$el.find('.map-label-container').hide();
    },
    
    // How to handle click events
    bindMapFeatureClick: function(e) {
      var layer = e.layer._layers[e.layer._leaflet_id - 1];
      this.options.app.navigate('/neighborhood/' + layer.feature.id, { trigger: true });
    },
    
    // Get layer by nieghborhod id
    getLayerByModel: function(model) {
      var searchModel = model || this.model;
      var topLayer = _.find(this.featureGroup._layers, function(l, i) {
        return (l._layers[l._leaflet_id - 1].feature.id == searchModel.id);
      });
      return topLayer;
    }
  });


})(mpApp['minnpost-crime'], jQuery);