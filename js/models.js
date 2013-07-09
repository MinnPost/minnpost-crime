/**
 * Models for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Basic model for other crime models
   */
  app.ModelCrimeArea = Backbone.Model.extend({
    dataCrimeQueryBase: 'https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict&name=minneapolis_aggregate_crime_data&callback=?&query=[[[QUERY]]]',
    // See scraper for why this is needed
    dataCrimeQueryWhere: "notes NOT LIKE 'Added to%'",
    
    // Common initalize
    initialize: function() {
      this.set('categories', app.data['crime/categories']);
      this.set('currentYear', app.options.currentYear);
      this.set('currentMonth', app.options.currentMonth);
      this.setLastMonth();
      this.setPopulationYears();
      this.setCategory(this.get('currentCategory'));
      this.on('change:crimesByMonth', function(e) {
        this.setStats();
      });
      this.on('change:currentCategory', function(e) {
        this.setCategory(this.getCategory());
        this.setStats();
      });
    },
    
    // We have population data from 2000 and 2010, so we abstract
    // that out to fill in years
    setPopulationYears: function() {
      var baseData = this.get('population');
      var popData = {};
      var rate = (baseData[2010] - baseData[2000]) / 10;
      var year = 2000;
      var estimate;
      
      for (year; year <= 2020; year++) {
        // Estimate population based on year, but don't go below 0
        estimate = baseData[2000] + (rate * (year - 2000));
        popData[year] = (estimate < 0) ? 0 : estimate;
      }
      
      this.set('population', popData);
      return this;
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
    
    // Set category
    setCategory: function(category) {
      if (_.isObject(this.get('categories')[category])) {
        this.set('currentCategory', category);
        this.set('currentCategoryTitle', this.get('categories')[category].title);
      }
      
      if (_.isUndefined(this.get('currentCategory'))) {
        this.setCategory('total');
      }
      return this;
    },
    
    // Category can be defined a few ways
    getCategory: function(category) {
      return category || this.get('currentCategory') || 'total';
    },
    
    // Gets years data relative to current month
    getLastYearData: function(years, category) {
      years = years || 1;
      category = this.getCategory(category);
      
      var data = [];
      var count = 0;
      
      if (_.isObject(this.get('crimesByMonth'))) {
        var filtered = this.getFilteredCrimesByMonth(
          this.get('currentYear') - years, this.get('currentMonth'),
          this.get('currentYear') - (years - 1), this.get('currentMonth'));

        _.each(filtered, function(year, y) {
          _.each(year, function(month, m) {
            data.push([moment(m.toString(), 'MM').format('MMM'), month[category]]);
          });
        });
      }
      
      return data;
    },
  
    // Determine change between two months
    getMonthChange: function(year1, month1, category, year2, month2) {
      year2 = year2 || this.get('currentYear');
      month2 = month2 || this.get('currentMonth');
      category = this.getCategory(category);
    
      var crime1 = this.getCrimeByMonth(year1, month1, category);
      var crime2 = this.getCrimeByMonth(year2, month2, category);
      
      // Can't divide by zero, so percentage difference from
      // zero is actually subject, we choose a value so that a 1
      // change would be 100%
      // (1 - x) / x = 1
      return (crime2 - crime1) / ((crime1 === 0) ? 0.5 : crime1);
    },
    
    // Get crime inciendents for a specific month and year
    getCrimeByMonth: function(year, month, category) {
      year = year || this.get('currentYear');
      month = month || this.get('currentMonth');
      category = this.getCategory(category);
      return this.get('crimesByMonth')[year][month][category];
    },
    
    // Get total crime inciendents for a specific year
    getCrimeByYear: function(year, category) {
      year = year || this.get('currentYear');
      category = this.getCategory(category);
      
      return _.reduce(this.get('crimesByMonth')[year], function(memo, month) {
        return memo + month[category];
      }, 0);
    },
    
    // Get crime rate (crimes / population / 1000) for a specific year
    getCrimeRateByYear: function(year, category) {
      year = year || this.get('currentYear');
      var population = this.get('population')[year];
      var crimes = this.getCrimeByYear(year, category);
      population = (!population) ? 1 : population;
      
      return (crimes / (population / 1000));
    },
    
    // Get crime rate (crimes / population / 1000) for a specific month
    getCrimeRateByMonth: function(year, month, category) {
      year = year || this.get('currentYear');
      month = month || this.get('currentMonth');
      var population = this.get('population')[year];
      var crimes = this.getCrimeByMonth(year, month, category);
      population = (!population) ? 1 : population;
      
      return (crimes / (population / 1000));
    },
    
    // Filter crimes
    getFilteredCrimesByMonth: function(year1, month1, year2, month2) {
      year2 = year2 || this.get('currentYear');
      month2 = month2 || this.get('currentMonth');
      var filtered = {};
      
      _.each(this.get('crimesByMonth'), function(year, y) {
        _.each(year, function(month, m) {
          if ((y == year1 && m > month1) ||
            (y == year2 && m <= month2) ||
            ((year2 - year1) > 1 && y > year1 && y < year2)
          ) {
            filtered[y] = filtered[y] || {};
            filtered[y][m] = month;
          }
        });
      });
      
      return filtered;
    },
    
    // Get series of incidents so far this year going back
    // each year
    getIncidentsThisYearHistory: function(category) {
      category = this.getCategory(category);
      var cMonth = this.get('currentMonth');
      var data = [];
      var minYear = 9999;
      
      // Find the minimum year that has a full years
      // worth of data
      _.each(this.get('crimesByMonth'), function(year, y) {
        minYear = (_.size(year) === 12 && y < minYear) ? y : minYear;
      });
      
      _.each(this.get('crimesByMonth'), function(year, y) {
        var incidents = 0;
        
        if (y >= minYear) {
          // Get incidents for previous months
          _.each(year, function(month, m) {
            incidents += (m <= cMonth) ? month[category] : 0;
          });
          data.push([y.toString(), incidents]);
        }
      });
      
      return data;
    },
    
    // Get incident rate per year
    getIncidentRatesPerYear: function(category) {
      category = this.getCategory(category);
      var thisModel = this;
      var data = [];
      var minYear = 9999;
      var maxYear = this.get('currentYear') - 1;
      
      // Find the minimum year that has a full years
      // worth of data
      _.each(this.get('crimesByMonth'), function(year, y) {
        minYear = (_.size(year) === 12 && y < minYear) ? y : minYear;
      });
      
      // Unless its December, use last year as max
      maxYear = (this.get('currentMonth') === 12) ? this.get('currentYear') : maxYear;
      
      _.each(this.get('crimesByMonth'), function(year, y) {
        if (y >= minYear && y <= maxYear) {
          data.push([y.toString(), thisModel.getCrimeRateByYear(y, category)]);
        }
      });
      
      return data;
    }
  });

  /**
   * Model for city level data
   */
  app.ModelCity = app.ModelCrimeArea.extend({
  
    initialize: function() {
      app.ModelCity.__super__.initialize.apply(this, arguments);
    },
  
    // Set stats values
    setStats: function(category) {
      category = this.getCategory(category);
      
      // Check if there are indeed data available
      var data = this.get('crimesByMonth');
      if (!_.isObject(data)) {
        return this;
      }
      
      // Incidents and rate
      this.set('statIncidentsMonth', this.getCrimeByMonth());
      this.set('statRateMonth', this.getCrimeRateByMonth());
      
      // Change from last month and last year
      this.set('statChangeLastMonth', this.getMonthChange(
        this.get('lastMonthYear'), this.get('lastMonthMonth'), category));
      this.set('statChangeMonthLastYear', this.getMonthChange(
        this.get('currentYear') - 1, this.get('currentMonth'), category));
        
      // Stats that are not dependent on category
      
      
      return this;
    },
  
    // Get all that sweet, sweet data
    fetchData: function(done, context) {
      context = context || this;
      var thisModel = this;
      var defers = [];
      var lastMonth;
      
      if (!this.get('fetched')) {
        // Get data for various months (current, last, and last year)
        defers.push(this.fetchAllDataByMonth());
        $.when.apply($, defers).done(function() {
          var data = _.clone(thisModel.get('crimesByMonth')) || {};
          _.each(arguments[0], function(r) {
            data[r.year] = data[r.year] || {};
            data[r.year][r.month] = r;
          });
          thisModel.set('crimesByMonth', data);
          done.apply(context, []);
        });
        this.set('fetched', true);
        this.trigger('fetched');
      }
      else {
        done.apply(context, []);
      }
      return this;
    },
    
    // Get all data aggregated
    fetchAllDataByMonth: function(done, context) {
      var query = [];
      
      query.push("SELECT year, month");
      _.each(this.get('categories'), function(category, c) {
        query.push(", SUM(" + c + ") AS " + c);
      });
      query.push(" FROM swdata WHERE " + this.dataCrimeQueryWhere);
      query.push(" GROUP BY year, month ORDER BY year DESC, month DESC");
      
      var defer = $.jsonp({ url: this.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0]]);
        });
      }
      return defer;
    },
    
    // Get data aggregate by month for previous years
    fetchDataPreviousYearsByMonth: function(year, month, years, done, context) {
      years = (_.isNumber(years)) ? years : 1;
      var query = [];
      
      query.push("SELECT year, month");
      _.each(this.get('categories'), function(category, c) {
        query.push(", SUM(" + c + ") AS " + c);
      });
      query.push(" FROM swdata WHERE " + this.dataCrimeQueryWhere);
      query.push(" AND ((year = " + year + " AND month <= " + month + ") ");
      if (years > 1) {
        query.push(" OR (year < " + year + " AND year > " + (year - years) + ")");
      }
      query.push(" OR (year = " + (year - years) + " AND month >= " + month + "))");
      query.push(" GROUP BY year, month ORDER BY year DESC, month DESC");
      
      var defer = $.jsonp({ url: this.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
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
  app.ModelNeighborhood = app.ModelCrimeArea.extend({
  
    initialize: function() {
      app.ModelNeighborhood.__super__.initialize.apply(this, arguments);
    },
  
  
    // Set stats values
    setStats: function(category) {
      category = this.getCategory(category);
      
      // Check if there are indeed data available
      var data = this.get('crimesByMonth');
      if (!_.isObject(data)) {
        return this;
      }
      
      // Incidents and rate
      this.set('statIncidentsMonth', this.getCrimeByMonth());
      this.set('statRateMonth', this.getCrimeRateByMonth());
      
      // Change from last month and last year
      if (_.isObject(data[this.get('lastMonthYear')]) && 
        _.isObject(data[this.get('lastMonthYear')][this.get('lastMonthMonth')])) {
        this.set('statChangeLastMonth', this.getMonthChange(
          this.get('lastMonthYear'), this.get('lastMonthMonth'), category));
      }
      if (_.isObject(data[this.get('currentYear') - 1]) && 
        _.isObject(data[this.get('currentYear') - 1][this.get('lastMonthMonth')])) {
        this.set('statChangeMonthLastYear', this.getMonthChange(
          this.get('currentYear') - 1, this.get('currentMonth'), category));
      }
        
      // Stats that are not dependent on category
      
      return this;
    },
  
    // Get all that sweet, sweet data
    fetchData: function(done, context) {
      context = context || this;
      var thisModel = this;
      var defers = [];
      
      if (!this.get('fetched')) {
        defers.push(this.fetchDataAllData());
        $.when.apply($, defers).done(function() {
          var data = _.clone(thisModel.get('crimesByMonth')) || {};
          _.each(arguments[0], function(r) {
            data[r.year] = data[r.year] || {};
            data[r.year][r.month] = r;
          });
          thisModel.set('crimesByMonth', data);
          done.apply(context, []);
        });
        this.set('fetched', true);
        this.trigger('fetched');
      }
      else {
        done.apply(context, []);
      }
      return this;
    },
    
    // Get all data for neighborhood
    fetchDataAllData: function(done, context) {
      var query = [];
      
      query.push("SELECT * FROM swdata WHERE " + this.dataCrimeQueryWhere);
      query.push(" AND neighborhood_key = '" + this.get('key') + "' ");
      query.push(" ORDER BY year DESC, month DESC");
      
      var defer = $.jsonp({ url: this.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0]]);
        });
      }
      return defer;
    }
  });


})(mpApp['minnpost-crime'], jQuery);