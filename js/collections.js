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
    model: app.ModelNeighborhood,
    comparator: 'id',
    
    initialize: function() {
      this.fetchedRecentData = false;
    },
    
    // Get data for all neighorhoods for the last two months
    fetchRecentData: function(done, context) {
      var thisCollection = this;
      var query = [];
      var model = this.at(0);
      var defer;
      var year = model.get('currentYear');
      var month = model.get('currentMonth');
      
      // Only do this once
      if (!this.fetchedRecentData) {
        query.push("SELECT * ");
        query.push(" FROM swdata WHERE " + model.dataCrimeQueryWhere);
        query.push(" AND ((year = " + model.get('currentYear') + "");
        query.push(" AND month = " + model.get('currentMonth') + ")");
        query.push(" OR (year = " + model.get('lastMonthYear') + "");
        query.push(" AND month = " + model.get('lastMonthMonth') + "))");
        query.push(" ORDER BY year DESC, month DESC");
        defer = $.jsonp({ url: model.dataCrimeQueryBase.replace('[[[QUERY]]]', encodeURI(query.join(''))) });
    
        if (_.isFunction(done)) {
          $.when(defer).done(function(data) {
            // Put data into the models
            thisCollection.each(function(m) {
              var crimesByMonth = m.get('crimesByMonth') || {};
              _.each(data, function(d) {
                if (d.neighborhood_key === m.get('key')) {
                  crimesByMonth[d.year] = crimesByMonth[d.year] || {};
                  crimesByMonth[d.year][d.month] = d;
                }
              });
              
              m.set('crimesByMonth', crimesByMonth);
            });
            
            if (_.isFunction(done)) {
              done.apply(context, [data[0]]);
            }
            thisCollection.fetchedRecentData = true;
            thisCollection.trigger('fetchedRecentData');
          });
        }
        return defer;
      }
      else {
        thisCollection.trigger('fetchedRecentData');
        if (_.isFunction(done)) {
          done.apply(context, []);
        }
        return this;
      }
    }
  });

})(mpApp['minnpost-crime'], jQuery);