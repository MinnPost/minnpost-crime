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
    renderContent: function(contentView, model) {
      var rerender = false;
      var el = this.el + ' .mc-content col';
      
      if (this.contentViewCID !== contentView.cid) {
        rerender = true;
      }
      
      // Update view
      contentView.setElement($(this.el).find('.mc-content'));
      contentView.model = model;
      
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
        observe: 'crimeData',
        update: 'bindUpdateChartOne'
      },
      '.section-title': 'title',
      '.city-category-stats': {
        observe: 'crimeData',
        update: 'bindUpdateCategoryCrime'
      }
    },
    
    bindUpdateCurrentMonthDisplay: function($el, val, model, options) {
      var month = (val) ? moment(val.toString(), 'MM').format('MMMM') : '';
      var year = model.get('currentYear');
      this.bindUpdateFade($el, (month && year) ? month + ', ' + year : '', model, options);
    },
    
    bindUpdateChartOne: function($el, val, model, options) {
      data = model.getLastYearData();
      if (_.isArray(data) && data.length > 0) {
        $.jqplot('chart-one', [data], this.cityPlotOptions);
      }
    },
    
    bindUpdateCategoryCrime: function($el, val, model, options) {
      if (!_.isUndefined(model.get('crimeData'))) {
        _.each(model.get('categories'), function(cat, c) {
          var stat = model.getMonthChange(model.get('lastMonthYear'), model.get('lastMonthMonth'), c);
          var $statEl = $el.find('.city-category-stat-' + c + ' .stat-value');
          this.bindUpdateCount($statEl, stat, model, options);
        }, this);
      }
    },
    
    cityPlotOptions: {
      seriesColors: [ '#10517F' ],
      grid: {
        drawBorder: false,
        background: '#fafafa',
        gridLineColor: '#dddddd',
        shadow: false
      },
      series: {
        renderer: $.jqplot.BarRenderer,
        lineWidth: 1.5,
        shadow: false,
        markerOptions: {
          size: 0,
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
          //tickOptions: {
          //  formatString: '%b \'%y'
          //}
        }
      }
    },
    
    render: function() {
      app.getTemplate('template-city', function(template) {
        this.$el.html(template(this.model.toJSON()));
      }, this);
      return this;
    }
  });

  /**
   * View for neighborhood
   */
  app.ViewNeighborhood = app.ViewBinding.extend({
  
  });


})(mpApp['minnpost-crime'], jQuery);