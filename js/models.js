/**
 * Models for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Basic model for other crime models
   */
  app.ModelCrimeArea = Backbone.Model.extend({
    // See scraper for why this is needed
    dataCrimeQueryWhere: "notes NOT LIKE 'Added to%'",
    
    // Common initalize
    initialize: function(attrs, options) {
      var thisModel = this;
      
      this.options = options;
      this.set('categories', app.data['crime/categories']);
      this.set('currentYear', app.options.currentYear);
      this.set('currentMonth', app.options.currentMonth);
      this.set('appCategory', this.options.app.category);
      this.setLastMonth();
      this.setPopulationYears();
      
      // Once data is ready, set some stats, and trigger
      // any category changes
      this.on('fetched', function(e) {
        thisModel.setStats();
      });
      
      // If the app level category changes, update
      // the model so that views can react accordingly
      this.options.app.on('change:category', function() {
        thisModel.set('appCategory', thisModel.options.app.category);
      });
      
      // If crimes per month change, update the combined categories
      this.on('crimesByMonth', function(e) {
        thisModel.setCombined();
      });
    },
    
    // Set combined categories
    setCombined: function(data ) {
      data = data || _.clone(this.get('crimesByMonth'));
      var categories = this.get('categories');
      
      _.each(data, function(year, y) {
        _.each(year, function(month, m) {
          _.each(categories, function(cat, c) {
            if (_.isArray(cat.combine) && _.isUndefined(month[c])) {
              data[y][m][c] = _.reduce(cat.combine, function(total, combine) {
                return total + month[combine];
              }, 0);
            }
          });
        });
      });
      
      this.set('crimesByMonth', data);
      return data;
    },
    
    // Get category from argument or from app
    getCategory: function(category) {
      if (_.isUndefined(category)) {
        category = this.options.app.category;
      }
      return category;
    },
    
    // Stats shared across models
    statsSetGlobal: false,
    setStats: function() {
      var thisModel = this;
      var data = _.clone(this.get('crimesByMonth'));
      var stats, city;
      
      // There's no need to do this more than once
      if (this.get('statsSetGlobal') || !_.isObject(data)) {
        return this;
      }
      
      // Put stats into object with each category
      stats = _.clone(this.get('stats'));
      stats = stats || {};
      city = (this.get('city')) ? this.options.app.cities.get(this.get('city')) : null;
      
      // Make stats for each category.
      _.each(this.get('categories'), function(cat, c) {
        stats[c] = stats[c] || {};
        stats[c].incidentsMonth = thisModel.getCrimeByMonth(c);
        stats[c].rateMonth = thisModel.getCrimeRateByMonth(c);
        
        stats[c].incidentsLastMonth = thisModel.getCrimeByMonth(c,
          thisModel.get('lastMonthYear'), thisModel.get('lastMonthMonth'));
        stats[c].incidentsLastYearMonth = thisModel.getCrimeByMonth(c,
          thisModel.get('currentYear') - 1, thisModel.get('currentMonth'));
        
        stats[c].changeLastMonth = thisModel.getMonthChange(c, 
          thisModel.get('lastMonthYear'), thisModel.get('lastMonthMonth'));
        stats[c].changeMonthLastYear = thisModel.getMonthChange(c, 
          thisModel.get('currentYear') - 1, thisModel.get('currentMonth'));
        
        if (city) {
          stats[c].rateCity = city.getCrimeRateByMonth(c);
        }
      });
      
      this.set('stats', stats);
      this.set('statsSetGlobal', true);
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
    
    // Gets years data relative to current month
    getLastYearData: function(category, years) {
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
    getMonthChange: function(category, year1, month1, year2, month2) {
      year2 = year2 || this.get('currentYear');
      month2 = month2 || this.get('currentMonth');
      category = this.getCategory(category);
    
      var crime1 = this.getCrimeByMonth(category, year1, month1);
      var crime2 = this.getCrimeByMonth(category, year2, month2);
      
      // Can't divide by zero, so percentage difference from
      // zero is actually subjective, we choose a value so that a 1
      // change would be 100%
      return (crime2 - crime1) / ((crime1 === 0) ? 1 : crime1);
    },
    
    // Get crime inciendents for a specific month and year
    getCrimeByMonth: function(category, year, month) {
      year = year || this.get('currentYear');
      month = month || this.get('currentMonth');
      category = this.getCategory(category);
      return this.get('crimesByMonth')[year][month][category];
    },
    
    // Get total crime inciendents for a specific year
    getCrimeByYear: function(category, year) {
      year = year || this.get('currentYear');
      category = this.getCategory(category);
      
      return _.reduce(this.get('crimesByMonth')[year], function(memo, month) {
        return memo + month[category];
      }, 0);
    },
    
    // Get crime rate (crimes / population / 1000) for a specific year
    getCrimeRateByYear: function(category, year) {
      year = year || this.get('currentYear');
      var population = this.get('population')[year];
      var crimes = this.getCrimeByYear(category, year);
      population = (!population) ? 1 : population;
      
      return (crimes / (population / 1000));
    },
    
    // Get crime rate (crimes / population / 1000) for a specific month
    getCrimeRateByMonth: function(category, year, month) {
      year = year || this.get('currentYear');
      month = month || this.get('currentMonth');
      var population = this.get('population')[year];
      var crimes = this.getCrimeByMonth(category, year, month);
      population = Math.max((!population) ? 0 : population, 500);
      
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
          data.push([y.toString(), thisModel.getCrimeRateByYear(category, y)]);
        }
      });
      
      return data;
    },
    
    // Get dataset of 12 month intervals per years
    get12MonthIntervalsPerYear: function(category) {
      var thisModel = this;
      var data = [];
      var monthData = _.clone(this.get('crimesByMonth'));
      var cYear = this.get('currentYear');
      var cMonth = this.get('currentMonth');
      var cDate = moment(cYear + '-' + cMonth + '-01', 'YYYY-MM-DD');
      var months = 0;
      var intervals = 0;
      var i, m, iS, iE, rate, date, count, x, dS, dE;
      
      // Find number of months in data and get intervals
      _.each(this.get('crimesByMonth'), function(year, y) {
        months += _.size(year);
      });
      intervals = Math.floor(months / 12);
      
      // Make sure there are intervals
      if (intervals <= 0) {
        return data;
      }
      
      // Go through intervals.  moment.month is 0 based!!!
      for (i = intervals; i >= 1; i--) {
        iS = (i * 12) - 1;
        iE = (i * 12) - 12;
        rate = 0;
        count = 0;
        
        // Go through months to get an average
        for (m = iS; m >= iE; m--) {
          date = moment(cDate);
          date.subtract('months', m);
          
          // Check if data is there, as there are some holes here and there
          if (_.isObject(monthData[date.year()]) && !_.isUndefined(monthData[date.year()][date.month() + 1])) {
            rate += this.getCrimeRateByMonth(category, date.year(), date.month() + 1);
            count++;
          }
        }
        rate = rate / count;
        dS = moment(cDate).subtract('months', iS);
        dE = moment(cDate).subtract('months', iE);
        x = '' + (dS.month() + 1) + '/' + dS.format('YY') + '-' + (dE.month() + 1) + '/' + dE.format('YY');
        data.push([x, rate]);
      }
      
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
    setStats: function() {
      app.ModelCity.__super__.setStats.apply(this, arguments);
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
          
          thisModel.setCombined(data);
          thisModel.set('crimesByMonth', data);
          thisModel.set('fetched', true);
          thisModel.trigger('fetched');
          
          done.apply(context, []);
        });
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
        if (!_.isArray(category.combine)) {
          query.push(", SUM(" + c + ") AS " + c);
        }
      });
      query.push(" FROM swdata WHERE " + this.dataCrimeQueryWhere);
      query.push(" GROUP BY year, month ORDER BY year DESC, month DESC");
      
      var defer = app.getRemoteData({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
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
        if (!_.isArray(category.combine)) {
          query.push(", SUM(" + c + ") AS " + c);
        }
      });
      query.push(" FROM swdata WHERE " + this.dataCrimeQueryWhere);
      query.push(" AND ((year = " + year + " AND month <= " + month + ") ");
      if (years > 1) {
        query.push(" OR (year < " + year + " AND year > " + (year - years) + ")");
      }
      query.push(" OR (year = " + (year - years) + " AND month >= " + month + "))");
      query.push(" GROUP BY year, month ORDER BY year DESC, month DESC");
      
      var defer = app.getRemoteData({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
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
    statsSet: false,
    setStats: function() {
      app.ModelCity.__super__.setStats.apply(this, arguments);
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
          
          thisModel.setCombined(data);
          thisModel.set('crimesByMonth', data);
          thisModel.set('fetched', true);
          thisModel.trigger('fetched');
          
          done.apply(context, []);
        });
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
      
      var defer = app.getRemoteData({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
  
      if (_.isFunction(done)) {
        $.when(defer).done(function(data) {
          done.apply(context, [data[0]]);
        });
      }
      return defer;
    }
  });


})(mpApp['minnpost-crime'], jQuery);