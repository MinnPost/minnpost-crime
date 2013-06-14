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