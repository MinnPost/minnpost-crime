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
  formatNumber: function(num, decimals) {
    decimals = decimals || 2;
    var rgx = (/(\d+)(\d{3})/);
    
    split = num.toFixed(decimals).toString().split('.');
    while (rgx.test(split[0])) {
      split[0] = split[0].replace(rgx, '$1' + ',' + '$2');
    }
    return split[0] + '.' + split[1];
  },
  
  /**
   * Formats number into currency
   */
  formatCurrency: function(num) {
    return '$' + _.formatNumber(num, 2);
  },
  
  /**
   * Formats percentage
   */
  formatPercent: function(num) {
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
    dataPath: './data/',
    dataCrimeQueryBase: 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=[[[QUERY]]]',
    // See scraper for why this is needed
    dataCrimeQueryWhere: "notes NOT LIKE 'Added to%'"
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
  app.getLocalData = function(name) {
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
      
      if (_.isUndefined(app.data[name])) {
        
        if (useJSONP) {
          defer = $.jsonp({
            url: proxyPrefix + encodeURI(app.options.dataPath + d + '.json')
          });
        }
        else {
          defer = $.getJSON(app.options.dataPath + d + '.json');
        }
        
        $.when(defer).done(function(data) {
          app.data[d] = data;
        });
        defers.push(defer);
      }
    });
    
    return $.when.apply($, defers);
  };
})(mpApp['minnpost-crime'], jQuery);

this["mpApp"] = this["mpApp"] || {};
this["mpApp"]["minnpost-crime"] = this["mpApp"]["minnpost-crime"] || {};
this["mpApp"]["minnpost-crime"]["templates"] = this["mpApp"]["minnpost-crime"]["templates"] || {};

this["mpApp"]["minnpost-crime"]["templates"]["js/templates/template-application-container.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="mc-application-container">\n    \n  <div class="flurid mc-header">\n    <div class="row">\n      <div class="column width_1/1">\n      </div>\n    </div>\n    \n    <div class="row messaging-container">\n      <div class="column width_1/1">\n      \n      </div>\n    </div>\n  </div>\n  \n  <div class="mc-content">\n  </div>\n    \n    \n  <div class="flurid mc-footer">\n    <div class="row">\n      <div class="column width_1/1">\n        \n        <p>Footer</p>\n      \n      </div>\n    </div>\n  </div>\n</div>';

}
return __p
};

this["mpApp"]["minnpost-crime"]["templates"]["js/templates/template-city.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class="mc-city-container">\n  <div class="flurid">\n    <div class="row row-space">\n      <div class="column width_1/1">\n        <h2 class="section-title"></h2>\n      </div>\n    </div>\n  \n    <div class="row row-space">\n      <div class="column width_1/2">\n        <div class="inner-column-left">\n          <div class="map placeholder">\n            Map <span class="month-display"></span>\n          </div>\n        </div>\n      </div>\n      \n      <div class="column width_1/2 last">\n        <h3>Current Month</h3>\n        <p class="current-month-display"></p>\n        \n        <h3>Total Crime</h3>\n      \n        <div class="column width_1/2">\n          <div class="inner-column-left">\n            <div class="stat-last-month">\n              <p>Change from last month</p>\n              <span class="stat-value"></span>\n              <span class="stat-symbol"></span>\n            </div>\n          </div>\n        </div>\n      \n        <div class="column width_1/2">\n          <div class="inner-column-left">\n            <div class="stat-last-year">\n              <p>Change from last year</p>\n              <span class="stat-value"></span>\n              <span class="stat-symbol"></span>\n            </div>\n          </div>\n        </div>\n        \n      </div>\n    </div>\n    \n    <div class="row row-space city-category-stats">\n      <h4>Crime changes from last month</h4>\n      ';
 _.each(categories, function(cat, c) { if (c !== 'total') { ;
__p += '\n        <div class="city-category-stat city-category-stat-' +
((__t = ( c )) == null ? '' : __t) +
' column width_1/' +
((__t = ( (_.size(categories) - 1) )) == null ? '' : __t) +
'">\n          <div class="stat-label">' +
((__t = ( cat.title )) == null ? '' : __t) +
'</div>\n          <div class="stat-value"></div>\n        </div>\n      ';
 }}) ;
__p += '\n    </div>\n    \n    <div class="row">\n      <div class="column width_1/1 last">\n        <h4>Crime over the past year</h4>\n        <div id="chart-one"></div>\n      </div>\n    </div>\n  </div>\n</div>';

}
return __p
};

this["mpApp"]["minnpost-crime"]["templates"]["js/templates/template-loading.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="loading-container">\n  <div class="loading"><span>Loading...</span></div>\n</div>';

}
return __p
};

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
      this.cityView = new app.ViewCity();
      this.neighborhoodView = new app.ViewNeighborhood();
      
      // Get some meta data
      app.getLocalData(['crime/categories', 'cities/cities']).done(function() {
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
      
      // Check if valid city
      if (_.isUndefined(app.data['cities/cities'][city])) {
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

/**
 * Models for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Model for city level data
   */
  app.ModelCity = Backbone.Model.extend({
    initialize: function() {
      this.set('categories', app.data['crime/categories']);
      this.set('title', 'Minneapolis profile');
    },
  
    // Set stats values
    setStats: function(stat) {
      stat = stat || 'total';
      
      this.set('lastMonthChange', this.getMonthChange(
        this.get('lastMonthYear'), this.get('lastMonthMonth'), stat));
      this.set('lastYearMonthChange', this.getMonthChange(
        this.get('currentYear') - 1, this.get('currentMonth'), stat));
      return this;
    },
    
    getLastYearData: function(stat) {
      stat = stat || 'total';
      var data = [];
      var count = 0;
      
      if (_.isObject(this.get('crimeData'))) {
        _.each(this.get('crimeData'), function(year, y) {
          _.each(year, function(month, m) {
            data.push([ y + '-' + m, month[stat]]);
          });
        });
      }
      
      return data;
    },
  
    // Determine change between two months
    getMonthChange: function(year1, month1, stat, year2, month2) {
      year2 = year2 || this.get('currentYear');
      month2 = month2 || this.get('currentMonth');
      stat = stat || 'total';
    
      var crime1 = this.getCrimeByMonth(year1, month1, stat);
      var crime2 = this.getCrimeByMonth(year2, month2, stat);
      // Can't divide by zero, so percentage difference from
      // zero is actually subject, we choose, 0.1 so that a 1
      // change would be 100%
      return (crime2 - crime1) / ((crime1 === 0) ? 0.1 : crime1);
    },
    
    // Get a crime state for month
    getCrimeByMonth: function(year, month, stat) {
      stat = stat || 'total';
      return this.get('crimeData')[year][month][stat];
    },
    
    // Get last month, as it could be last year
    setLastMonth: function() {
      var month = this.get('currentMonth');
      var year = this.get('currentYear');
      var response = [year, month - 1];
      
      if (month == 1) {
        response = [year - 1, 12];
      }
      this.set('lastMonthMonth', response[1]);
      this.set('lastMonthYear', response[0]);
      return this;
    },
  
    // Get all that sweet, sweet data
    fetchData: function(done, context) {
      var thisModel = this;
      context = context || this;
    
      // First get the most recent month/year
      this.fetchRecentMonth(function(year, month) {
        var defers = [];
        var lastMonth;
        
        this.set('currentMonth', month);
        this.set('currentYear', year);
        this.setLastMonth();
        
        // Get data for various months (current, last, and last year)
        defers.push(this.fetchDataPreviousYear(year, month));
        $.when.apply($, defers).done(function() {
          var data = thisModel.get('data') || {};
          _.each(arguments[0], function(r) {
            data[r.year] = data[r.year] || {};
            data[r.year][r.month] = r;
          });
          thisModel.set('crimeData', data);
          thisModel.setStats();
          
          // Done and callback
          done.apply(context, []);
        });
      }, this);
      return this;
    },
    
    // Get most recent month and year
    fetchRecentMonth: function(done, context) {
      context = context || this;
      var query = "SELECT month, year FROM swdata ORDER BY year || '-' || month DESC LIMIT 1";
      var defer = $.jsonp({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query)) });
      
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0].year, data[0].month]);
        });
      }
      return defer;
    },
    
    // Get data for month
    fetchDataPreviousYear: function(year, month, done, context) {
      var query = [];
      query.push("SELECT year, month");
      _.each(this.get('categories'), function(category, c) {
        query.push(", SUM(" + c + ") AS " + c);
      });
      query.push(" FROM swdata WHERE " + app.options.dataCrimeQueryWhere);
      query.push(" AND ((year = " + year + " AND month <= " + month + ") ");
      query.push(" OR (year = " + (year - 1) + " AND month >= " + month + "))");
      query.push(" GROUP BY year, month ORDER BY year DESC, month DESC");
      
      var defer = $.jsonp({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0]]);
        });
      }
      return defer;
    }
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