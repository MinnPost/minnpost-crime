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
    
      this.options.app.cityView.model = cityModel;
      this.options.app.cityView.$el.slideDown(function() {
        thisView.options.app.cityMapView.renderMap();
      });
      this.options.app.neighborhoodView.$el.slideUp();
      
      if (!_.isObject(this.options.app.cityView._modelBindings)) {
        this.options.app.cityView.stickit();
      }
      
      return this;
    },
    
    // Render Neighborhood view
    renderNeighborhood: function(neighborhoodModel, cityModel) {
      var thisView = this;
      
      this.options.app.neighborhoodView.model = neighborhoodModel;
      this.options.app.neighborhoodView.stickit();
      this.options.app.neighborhoodView.$el.slideDown(function() {
        thisView.options.app.neighborhoodMapView.renderMap(false);
        thisView.options.app.neighborhoodMapView.mapFocusNeighborhood(neighborhoodModel);
      });
      this.options.app.cityView.$el.slideUp();
      
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
    // Animate count to value
    bindUpdateCount: function($el, val, model, options) {
      var number = (_.isNaN(parseInt($el.text(), 10))) ? 0 : parseInt($el.text(), 10);
      var interval, intervalID;
      
      if (_.isNumber(val) && val != number) {
        var greaterThan = (val > number);
        interval = (val - number) / 40;
        intervalID = setInterval(function() {
          number = number + interval;
          $el.html(_.formatPercent(number));
          
          if ((greaterThan && number >= val) || (!greaterThan && number <= val)) {
            $el.html(_.formatPercent(val));
            clearInterval(intervalID);
          }
        }, 20);
      }
      else {
        $el.html(val);
      }
    },
    
    // Fade out then in
    bindUpdateFade: function($el, val, model, options) {
      $el.fadeOut('fast', function() {
        $el.html(val).fadeIn('fast');
      });
    }
  });

  /**
   * View for city
   */
  app.ViewCity = app.ViewBinding.extend({
    model: app.ModelCity,
  
    bindings: {
      '.current-month-display': { 
        observe: ['currentMonth', 'currentYear'], 
        update: 'bindUpdateCurrentMonthDisplay'
      },
      '.stat-last-month .stat-value': { observe: 'lastMonthChange', update: 'bindUpdateCount' },
      '.stat-last-year .stat-value': { observe: 'lastYearMonthChange', update: 'bindUpdateCount' },
      '#chart-one': {
        observe: 'crimesByMonth',
        update: 'bindUpdateChartOne'
      },
      '.section-title': 'title',
      '.city-category-stats': {
        observe: 'crimesByMonth',
        update: 'bindUpdateCategoryCrime'
      }
    },
    
    bindUpdateCurrentMonthDisplay: function($el, val, model, options) {
      var month = (val) ? moment(val.toString(), 'MM').format('MMMM') : '';
      var year = model.get('currentYear');
      this.bindUpdateFade($el, (month && year) ? month + ', ' + year : '', model, options);
    },
    
    bindUpdateChartOne: function($el, val, model, options) {
      var data1 = model.getLastYearData(1);
      var data2 = model.getLastYearData(2);
      
      if (_.isArray(data1) && data1.length > 0) {
        $.jqplot('chart-one', [data2, data1], this.cityPlotOptions);
      }
    },
    
    bindUpdateCategoryCrime: function($el, val, model, options) {
      if (!_.isUndefined(model.get('crimesByMonth'))) {
        _.each(model.get('categories'), function(cat, c) {
          var stat = model.getMonthChange(model.get('lastMonthYear'), model.get('lastMonthMonth'), c);
          var $statEl = $el.find('.city-category-stat-' + c + ' .stat-value');
          this.bindUpdateCount($statEl, stat, model, options);
        }, this);
      }
    },
    
    cityPlotOptions: {
      seriesColors: [ '#BCBCBC','#10517F' ],
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
    
    render: function() {
      var data = (_.isObject(this.model)) ? this.model.toJSON() : {};
    
      app.getTemplate('template-city', function(template) {
        this.$el.html(template(data));
      }, this);
      return this;
    }
  });

  /**
   * View for neighborhood
   */
  app.ViewNeighborhood = app.ViewBinding.extend({
    model: app.ModelNeighborhood,
  
    bindings: {
      '.section-title': 'title'
    },
    
    render: function() {
      var data = (_.isObject(this.model)) ? this.model.toJSON() : {};
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
      color: '#107F3E',
      weight: 1,
      opacity: 0.5,
      fill: true,
      fillColor: '#107F3E',
      fillOpacity: 0.2
    },
    
    initialize: function() {
      // Get hover template.  This should be use
      // with a callback
      app.getTemplate('template-map-label', function(template) {
        this.templates = this.templates || {};
        this.templates['template-map-label'] = template;
      }, this);
      
      this.mapRendered = false;
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
    
    // Focus on neighnorhood
    mapFocusNeighborhood: function(model) {
      this.model = (_.isObject(model)) ? model : this.model;
      var layer, options;
      
      // If model is set, show specific neighborhood.
      // TODO: Need to reset weight on other layers
      if (_.isObject(this.model)) {
        this.featureGroup.setStyle({ weight: this.styleDefault.weight });
        layer = this.getLayerByModelID();
        options = layer._layers[layer._leaflet_id - 1].options;
        options.weight = options.weight + 8;
        layer.setStyle(options);
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
          title: neighborhood.get('title')
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
    getLayerByModelID: function(model) {
      var searchModel = model || this.model;
      var topLayer = _.find(this.featureGroup._layers, function(l, i) {
        return (l._layers[l._leaflet_id - 1].feature.id == searchModel.id);
      });
      return topLayer;
    }
  });


})(mpApp['minnpost-crime'], jQuery);