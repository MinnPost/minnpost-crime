/**
 * Views for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Main application view
   */
  app.ViewContainer = Backbone.View.extend({
    initialize: function() {
      this.templates = this.templates || {};
    },
    
    events: {
      'click .location-geolocate': 'handleGeolocate',
      'submit .location-search-form': 'handleAddressSearch',
      'change #category-select': 'handleCategoryChange',
      'click .category-stat': 'handleCategoryChoice'
    },
    
    // Main template render
    render: function() {
      // Render container
      app.getTemplate('template-application-container', function(template) {
        this.templates['template-application-container'] = template;
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
      
      // Render category select
      app.getTemplate('template-category-select', function(template) {
        this.templates['template-category-select'] = template;
        $(this.el).find('.category-select-container').html(template({
          categories: app.data['crime/categories'],
          currentCategory: this.options.app.category
        }));
      }, this);
      
      return this;
    },
    
    // Render City view
    renderCity: function(cityModel) {
      var thisView = this;
      
      // Render map
      this.options.app.cityMapView.model = cityModel;
      this.options.app.cityMapView.renderMap();
      
      // Set model for view
      this.options.app.cityView.model = cityModel;
      
      // Animate transition
      this.options.app.cityView.$el.slideDown(function() {
        thisView.options.app.cityMapView.updateMapView();
      });
      this.options.app.neighborhoodView.$el.slideUp();
      
      this.options.app.cityView.unstickit();
      this.options.app.cityView.stickit();
      
      return this;
    },
    
    // Render Neighborhood view
    renderNeighborhood: function(neighborhoodModel, cityModel) {
      var thisView = this;
      
      // Render/update mao
      thisView.options.app.neighborhoodMapView.model = neighborhoodModel;
      thisView.options.app.neighborhoodMapView.renderMap(false);
      
      // Set model
      this.options.app.neighborhoodView.model = neighborhoodModel;
      
      // Animate
      this.options.app.neighborhoodView.$el.slideDown(function() {
        thisView.options.app.neighborhoodMapView.updateMapView(false);
        thisView.options.app.neighborhoodMapView.mapFocusNeighborhood(neighborhoodModel);
      });
      this.options.app.cityView.$el.slideUp();
      
      this.options.app.neighborhoodView.unstickit();
      this.options.app.neighborhoodView.stickit();
      
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
      this.renderLoading('.messaging-container');
      return this;
    },
    
    // Stop general loading
    renderStopGeneralLoading: function() {
      this.$el.find('.messaging-container .loading').fadeOut(function() {
        $(this).remove();
      });
      return this;
    },
    
    // Update category change.  This is needed as we don't have
    // a two way connection between the select and the category
    // value
    updateCategory: function(category) {
      var $catFound = $('div.category-stat[data-category=' + category + ']');
      
      // Update dropdown
      this.$el.find('#category-select').val(category);
      
      // Update category stats.  If the category is total or
      // otherwise not in the list, then reset, otherwise,
      // highlight the right one
      if ($catFound.size() > 0) {
        $('.category-stat').each(function() {
          var $this = $(this);
          
          if ($this.data('category') === category) {
            $this.removeClass('not-selected');
          }
          else {
            $this.addClass('not-selected');
          }
        });
      }
      else {
        $('.category-stat').removeClass('not-selected');
      }
    },
    
    // Handle if category select changes
    handleCategoryChange: function(e) {
      e.preventDefault();
      this.changeCategory($(e.currentTarget).val());
    },
    
    // Handle choosing category
    handleCategoryChoice: function(e) {
      e.preventDefault();
      this.changeCategory($(e.currentTarget).data('category'));
    },
    
    // Change category
    changeCategory: function(category) {
      var prefix = (Backbone.history) ? Backbone.history.fragment : false;
      var model = this.options.app.currentModel;
      
      if (category && prefix && model) {
        this.options.app.navigate(prefix.split('/')[0] + '/' + 
          model.id + '/' + category, { trigger: true });
      }
    },
    
    // Handle geolocation event.  The map needs to be loaded 
    handleGeolocate: function(e) {
      e.preventDefault();
      this.options.app.routeGeolocate();
    },
    
    // Handle address search event
    handleAddressSearch: function(e) {
      e.preventDefault();
      var val = this.$el.find('.address-search').val();
      
      if (val) {
        this.options.app.routeAddress(val);
      }
    }
  });

  /**
   * View that holds common binding functions
   */
  app.ViewBinding = Backbone.View.extend({
    
    // Default chart options
    chartOptions: {
      chart: {
        type: 'line',
        style: {
          fontFamily: '"HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif',
          color: '#BCBCBC'
        }
      },
      colors: ['#225ea8', '#BCBCBC'],
      credits: {
        enabled: false
      },
      title: {
        enabled: false,
        text: ''
      },
      legend: {
        borderWidth: 0
      },
      plotOptions: {
        line: {
          lineWidth: 4,
          states: {
            hover: {
              lineWidth: 5
            }
          },
          marker: {
            fillColor: '#ffffff',
            lineWidth: 2,
            lineColor: null,
            symbol: 'circle',
            enabled: false,
            states: {
              hover: {
                enabled: true
              }
            }
          }
        }
      },
      xAxis: {
        title: { },
        type: 'category'
      },
      yAxis: {
        title: {
          enabled: false,
          text: 'Incident rate<br />(per 1,000 residents)',
          margin: 40,
          style: {
            color: 'inherit',
            fontWeight: 'normal'
          }
        },
        min: 0,
        gridLineColor: '#BCBCBC'
      },
      tooltip: {
        //shadow: false,
        //borderRadius: 0,
        //borderWidth: 0,
        style: {},
        useHTML: true,
        formatter: function() {
          return '<strong>' + this.series.name +'</strong><br/>' + _.formatNumber(this.y, 2);
        }
      }
    },
  
    commonBindings: {
      '.section-title': {
        observe: 'title', 
        update: 'bindUpdateFade'
      },
      '.document-title': {
        observe: ['title', 'appCategory'], 
        update: 'bindUpdateDocumentTitle'
      },
      '.population-numbers': {
        observe: 'population', 
        update: 'bindUpdatePopulation'
      },
      '.current-month': {
        observe: 'currentMonth', 
        update: 'bindUpdateSlide', 
        onGet: 'bindSetFormatMonth'
      },
      '.current-year': {
        observe: 'currentYear', 
        update: 'bindUpdateSlide'
      },
      
      // Categories
      '.category-title': {
        observe: 'appCategory', 
        update: 'bindUpdateSlide',
        onGet: 'bindSetFormatCategoryTitle'
      },
      '.category-stats': {
        observe: 'crimesByMonth', 
        update: 'bindUpdateCategoryCrime'
      },
      
      // Stats
      '.stat-incidents-month .stat-value': {
        observe: ['stats', 'appCategory'], 
        update: 'bindUpdateStat',
        options: { 
          stat: 'incidentsMonth',
          formatter: 'formatNumber', 
          argument: 0
        }
      },
      '.stat-rate-month > .stat-value': {
        observe: ['stats', 'appCategory'], 
        update: 'bindUpdateStat',
        options: { 
          stat: 'rateMonth',
          formatter: 'formatNumber'
        }
      },
      '.stat-change-last-month .stat-value': {
        observe: ['stats', 'appCategory'], 
        update: 'bindUpdateStat',
        options: { stat: 'changeLastMonth' }
      },
      '.stat-change-month-last-year .stat-value': {
        observe: ['stats', 'appCategory'], 
        update: 'bindUpdateStat',
        options: { stat: 'changeMonthLastYear' }
      }
    },
    
    // Format month
    bindSetFormatMonth: function(val, options) {
      return (val) ? moment(val.toString(), 'MM').format('MMMM') : '';
    },
    
    // Format category title
    bindSetFormatCategoryTitle: function(val, options) {
      return (val && _.isObject(this.model)) ? this.model.get('categories')[val].title : '';
    },
    
    // Animate count to value
    bindUpdateCount: function($el, val, model, options) {
      if (_.isNumber(val)) {
      
        // Determine number and formatting
        var parsed = parseFloat(_.stripNumber($el.text()));
        var number = (_.isNaN(parsed)) ? 0 : parsed;
        var formatOption = (_.isObject(options.options) && options.options.formatter) ? 
          options.options.formatter : 'formatPercentChange';
        var formatArgument = (_.isObject(options.options)) ? options.options.argument : undefined;
        var formatter = (_.isFunction(formatOption)) ? formatOption :
          ((_.isFunction(_[formatOption])) ? _[formatOption] : function(v) { return v; } );
        var interval, intervalID, greaterThan;
        
        // Hackery for percents
        if (formatOption.indexOf('Percent') > 0) {
          number = number / 100;
        }
        
        // If different, start counting
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
    
    // Update document title
    bindUpdateDocumentTitle: function($el, val, model, options) {
      var cat = model.get('categories')[model.get('appCategory')].title;
      document.title = app.options.originalTitle + ' | ' + 
        model.get('title') + ' | ' + cat;
    },
    
    // Update crime categories based on last month
    bindUpdateCategoryCrime: function($el, val, model, options) {
      if (!_.isUndefined(model.get('crimesByMonth'))) {
        var incidentOptions = _.extend(_.clone(options), 
          { options: { formatter: 'formatNumber', argument: 0 }});
          
        _.each(model.get('categories'), function(cat, c) {
          var stat, $statEl;
          
          // Incidents
          stat = model.getCrimeByMonth(c, model.get('currentYear'), model.get('currentMonth'));
          $statEl = $el.find('.category-stat-' + c + ' .stat-incidents');
          this.bindUpdateCount($statEl, stat, model, incidentOptions);
        
          // Change
          stat = model.getMonthChange(c, model.get('lastMonthYear'), model.get('lastMonthMonth'));
          $statEl = $el.find('.category-stat-' + c + ' .stat-change');
          this.bindUpdateCount($statEl, stat, model, options);
        }, this);
      }
    },
    
    // Update a stat value
    bindUpdateStat: function($el, val, model, options) {
      var stat = (_.isObject(options.options)) ? options.options.stat : false;
      var stats = model.get('stats');
      
      if (stat && stats && _.isNumber(stats[model.get('appCategory')][stat])) {
        this.bindUpdateCount($el, stats[model.get('appCategory')][stat], model, options);
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
    
    // Chart showing last 12 months
    bindUpdateChartLast12Months: function($el, val, model, options) {
      var data1 = model.getLastYearData(model.get('appCategory'), 1);
      var data2 = model.getLastYearData(model.get('appCategory'), 2);
      var chartOptions = _.clone(this.chartOptions);
      
      chartOptions.seriesColors = ['#BCBCBC', '#10517F'];
      this.drawGraph($el.attr('id'), [data2, data1], chartOptions);
    },
    
    // Chart to show how many incidents this year with history
    bindUpdateIncidentsThisYearHistory: function($el, val, model, options) {
      var data = model.getIncidentsThisYearHistory();
      this.drawGraph($el.attr('id'), [data], this.chartOptions);
    },
    
    // Show incident rate per full year
    bindUpdateChartIncidentRatePerYear: function($el, val, model, options) {
      var data = model.getIncidentRatesPerYear();
      var chartOptions = _.clone(this.chartOptions);
      chartOptions.axes.yaxis.tickOptions = {};
      this.drawGraph($el.attr('id'), [data], chartOptions);
    },
    
    // Show incident rate for 12 month intervals
    bindUpdateChart12MonthHistory: function($el, val, model, options) {
      var series = [{
        name: model.get('title'),
        data: model.get12MonthIntervalsPerYear()
      }];
      var chartOptions = _.clone(this.chartOptions);
      var city;
      
      // Get city line as well
      if (model.get('city')) {
        city = model.options.app.cities.get(model.get('city'));
        series.push({
          name: city.get('title'),
          data: city.get12MonthIntervalsPerYear()
        });
      }
      
      if (series[0].data && _.size(series[0].data) > 0) {
        this.drawGraph($el.attr('id'), series, chartOptions);
      }
    },
    
    // Update the coloring of the map based on category
    updateMapVisualization: function(category, mapView) {
      if (!this.options.app.neighborhoods.fetchedRecentData || _.isUndefined(this.model)) {
        return;
      }
      
      mapView = mapView || 'cityMapView';
      category = this.model.getCategory();
      categoryObject = this.model.get('categories')[category];
    
      // Since we use the same neighborhood models
      // for city view and individual eighborhood view,
      // we don't want to step on toes and set
      // the category, unnecessarily
      this.options.app.neighborhoods.each(function(n) {
        n.set('cityMapValue', n.getCrimeRateByMonth(category));
      });
      this.options.app[mapView].mapVisualizeNeighborhoods(
        'cityMapValue', categoryObject.title + ' incident rate');
      
      return this;
    },
    
    // Abstract draw graph
    drawGraph: function(id, data, options) {
      var dataPresent = true;
      var plot;
      
      // Check data
      _.each(data, function(dataSet) {
        if (!_.isObject(dataSet) || !_.isArray(dataSet.data) || dataSet.data.length <= 0) {
          dataPresent = false;
        }
      });
      
      // If data present element exists
      if (dataPresent && $('#' + id).length > 0) {
        options.series = data;
        $('#' + id).highcharts(options);
      }
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
      '#chart-city-incidents-12-month-history': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateChart12MonthHistory'
      },
      '#chart-city-last-year': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateChartLast12Months'
      },
      '#chart-city-incidents-this-year-history': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateIncidentsThisYearHistory'
      },
      '#chart-city-incident-rate-per-year': { 
        observe: ['crimesByMonth', 'appCategory'],
        update: 'bindUpdateChartIncidentRatePerYear'
      },
      // Map
      '#city-map': {
        observe: 'appCategory', 
        update: 'bindUpdateMapVisualization'
      }
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
      this.updateMapVisualization(model.getCategory(), 'cityMapView');
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
      '.city-link': {
        observe: 'city', 
        update: 'bindUpdateCityLink'
      },
      '.stat-rate-city .stat-value': {
        observe: ['stats', 'appCategory'], 
        update: 'bindUpdateStat',
        options: { 
          stat: 'rateCity',
          formatter: 'formatNumber'
        }
      },
      // Charts
      '#chart-neighborhood-incidents-12-month-history': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateChart12MonthHistory'
      },
      '#chart-neighborhood-last-year': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateChartLast12Months'
      },
      '#chart-neighborhood-incident-rate-per-year': { 
        observe: ['crimesByMonth', 'appCategory'], 
        update: 'bindUpdateChartIncidentRatePerYear'
      },
      '#chart-neighborhood-incidents-this-year-history': { 
        observe: ['crimesByMonth', 'appCategory'],
        update: 'bindUpdateIncidentsThisYearHistory'
      },
      // Map
      '#neighborhood-map': {
        observe: 'appCategory', 
        update: 'bindUpdateMapVisualization'
      }
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
    
    // Initial render (probably won't have fetched data)
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
      var baseLayer = new L.tileLayer('//{s}.tiles.mapbox.com/v3/minnpost.map-wi88b700/{z}/{x}/{y}.png');
      
      if (_.isUndefined(this.el)) {
        this.setElement(this.$el.selector);
      }
      
      // Only render the map once
      if (this.mapRendered === false) {
        this.map = new L.Map(this.el, {
          scrollWheelZoom: false
        });
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
        this.mapRendered = true;
      }
        
      if (fitGroup) {
        this.map.fitBounds(this.featureGroup.getBounds());
      }
      
      return this;
    },
    
    // Update the map view
    updateMapView: function(fitGroup) {
      fitGroup = (_.isUndefined(fitGroup)) ? true : false;
    
      if (!_.isUndefined(this.map)) {
        this.map.invalidateSize({ pan: false });
        
        if (!_.isUndefined(this.featureGroup) && fitGroup) {
          this.map.fitBounds(this.featureGroup.getBounds());
        }
      }
    },
    
    // Render/visualize neighborhoods based on a property
    mapVisualizeNeighborhoods: function(property, label, formatter, exceptions) {
      var thisView = this;
      exceptions = exceptions || ['northeast_park', 'mid_city_industrial', 'camden_industrial', 'humboldt_industrial_area', 'downtown_west'];
      this.visualProperty = property || 'statRateMonth';
      this.visualLabel = label || 'Incident rate';
      this.visualFormatter = formatter || _.formatNumber;
      var legend = [];
      var data, colorScale, currentValue;
      
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
      
      // Create legend data, mark the current part we are looking at
      currentValue = colorScale(this.model.get(this.visualProperty));
      _.each(chroma.limits(data, 'k-means', 9), function(l, i) {
        legend.push({
          value: l,
          color: colorScale(l).hex()
        });
      });
      this.getLegendEl().html(this.templates['template-map-legend']({
        legend: legend,
        display: currentValue.hex()
      }));
      
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