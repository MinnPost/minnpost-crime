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
      this.renderLoading('.general-loading .column');
      $('.general-loading').slideDown();
      return this;
    },
    
    // Stop general loading
    renderStopGeneralLoading: function() {
      this.$el.find('.general-loading').slideUp();
      return this;
    }
  });

  /**
   * View for city
   */
  app.ViewCity = Backbone.View.extend({
    bindings: {
      '.id-test': { observe: 'id', update: 'bindUpdateFade' }
    },
    
    render: function() {
      app.getTemplate('template-city', function(template) {
        this.$el.html(template(this.model.toJSON()));
      }, this);
      return this;
    },
    
    bindUpdateFade: function($el, val, model, options) {
      $el.fadeOut(function() { $el.html(val).fadeIn(); }); 
    }
  });

  /**
   * View for neighborhood
   */
  app.ViewNeighborhood = Backbone.View.extend({
  
  });


})(mpApp['minnpost-crime'], jQuery);