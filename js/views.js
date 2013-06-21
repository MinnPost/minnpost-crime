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
    
    // Render content area.  Wrapped here to check if the view
    // is the same
    renderContent: function(contentView, cityModel, neighborhoodsCollection) {
      var rerender = false;
      var el = this.el + ' .mc-content col';
      
      if (this.contentViewCID !== contentView.cid) {
        rerender = true;
      }
      
      // Update view
      contentView.setElement($(this.el).find('.mc-content'));
      if (!_.isUndefined(cityModel)) {
        contentView.model = cityModel;
      }
      if (!_.isUndefined(neighborhoodsCollection)) {
        contentView.collection = neighborhoodsCollection;
      }
      
      // Rerender if needed
      if (rerender) {
        contentView.render();
      }
      contentView.stickit();
      this.contentViewCID = contentView.cid;
      
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
      app.getTemplate('template-city', function(template) {
        this.$el.html(template(this.model.toJSON()));
      }, this);
      
      this.neighborhoodMapView = new app.ViewNeighborhoodMap({
        collection: this.collection,
        el: '#neighborhood-map',
        app: this.options.app
      }).render();
      return this;
    }
  });

  /**
   * View for neighborhood
   */
  app.ViewNeighborhood = app.ViewBinding.extend({
  
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
    
    baseLayer: new L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png'),
    
    initialize: function() {
      this.map = new L.Map(this.el);
      this.map.setView([44.9800, -93.2636], 12);
      this.map.addLayer(this.baseLayer);
      this.map.attributionControl.setPrefix(false);
      this.renderLabelContainer();
      
      // Get hover template.  This should be use
      // with a callback
      app.getTemplate('template-map-label', function(template) {
        this.templates = this.templates || {};
        this.templates['template-map-label'] = template;
      }, this);
    },
    
    // Renders out collection
    render: function() {
      var thisView = this;
      this.FeatureGroup = new L.featureGroup();
      
      this.collection.each(function(n) {
        var layer = n.get('mapLayer');
        
        if (_.isUndefined(layer)) {
          layer = new L.geoJson(n.get('geoJSON'));
          n.set('mapLayer', layer);
        }
        
        layer.setStyle(thisView.styleDefault);
        thisView.FeatureGroup.addLayer(layer);
        thisView.map.addLayer(layer);
        
        layer.on('mouseover', thisView.bindMapFeatureMouseover, thisView);
        layer.on('mouseout', thisView.bindMapFeatureMouseout, thisView);
        layer.on('click', thisView.bindMapFeatureClick, thisView);
      });
      
      this.map.fitBounds(this.FeatureGroup.getBounds());
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
      this.options.app.navigate('/neighborhood/' + layer.feature.id, { trigger: true, replace: true });
    }
  });


})(mpApp['minnpost-crime'], jQuery);