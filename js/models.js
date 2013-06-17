/**
 * Models for MinnPost crime app
 */
(function(app, $, undefined) {

  /**
   * Model for city level data
   */
  app.ModelCity = Backbone.Model.extend({
    // Get all that sweet, sweet data
    fetchData: function(done, context) {
      var thisModel = this;
      context = context || this;
    
      // First get the most recent month/year
      this.fetchRecentMonth(function(year, month) {
        var defers = [];
        this.set('monthCurrent', month);
        this.set('yearCurrent', year);
        
        // Get data for various months
        defers.push(this.fetchDataMonth(year, month - 1));
        defers.push(this.fetchDataMonth(year - 1));
        $.when.apply($, defers).done(function(data) {
          thisModel.set('statsMonthLastMonth', arguments[0][0]);
          thisModel.set('statsMonthLastYear', arguments[0][0]);
          
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
    fetchDataMonth: function(year, month, done, context) {
      var query = "SELECT * FROM swdata WHERE month = " + month + 
        " AND year = " + year + " ORDER BY neighborhood_key";
      var defer = $.jsonp({ url: app.options.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query)) });
      
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