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