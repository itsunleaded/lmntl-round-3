/* global jQuery */

/**
 * Slice Verical Plugin
 * @author shininglab
 */

(function (fn) {
    "use strict";

    if (typeof jQuery === 'undefined') {
        throw 'Requires jQuery to be loaded first';
    }
    fn(jQuery, window, document);
}(function ($, window, document, undefined) {
    "use strict";

    var pluginName = 'vertical';
    $.fn.sliceSlider.setPluginName(pluginName);
    var addWorker = $.fn.sliceSlider.addWorker,
        cssProps = $.fn.sliceSlider.cssProps;
    
    var pluginDefaults = {
        vertical : false, // Vertical slide direction
        verticalClass : 'slice-slider-vertical' // slider class for vertical mode
    };

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceVerical = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    };

    /**
     * Setup settings.
     */
    SliceVerical.prototype.setup = function (){
        var settings = this.slice.settings;
        this.slice.$element.toggleClass(settings.verticalClass, settings.vertical);
        settings.workers.vertical = settings.vertical;
        settings.workers.horizontal = !settings.vertical;
        return this;
    };
    
    $.fn.sliceSlider.addRequirement(pluginName);

    // set dimension
    addWorker('setDimension', ['settings'], function(stage){
        stage.revSizeProp = cssProps.width;
        stage.sizeProp = cssProps.height;
        stage.spacingProps = ['marginTop', 'marginBottom'];
        stage.getSize = function($el){
            return $el.innerHeight();
        };
        stage.setSize = function($el, size){
            $el.innerHeight(size);
        };

        stage.positionProp = 'top';
        stage.getPosition = function($el, position){
            if (position){
                return position.top || 0;
            }
            return $el.position().top;
        };
    });

    /*
    *   View sizes workers :
    *   1. Calculate viewport size, priority 10
    *   
    *   Priority 10 - 30
    */
    addWorker('viewportSize', ['size', 'slides', 'settings'], function(stage, cache){
        this.$viewport[cssProps.height](this.run('getViewMaxHeight'));
        stage.viewportSize = this.$viewport[cssProps.height]();
        cache.viewSize = stage.viewportSize;
    }, 10, {
        fixedheight : false
    });
    addWorker('viewportWidth', ['size', 'slides', 'settings'], function(stage){
        stage.viewportWidth = this.$viewport[cssProps.width]();
    }, 10);

    /*
    *   Check viewport width
    *   Priority 197-198
    */
    addWorker('checkViewportSize', true, function(stage, cache){
        cache.resizeRequired = cache.resizeRequired || Math.ceil(stage.viewportWidth) !== Math.ceil(this.$viewport[cssProps.width]());
    }, 197);

    $.fn.sliceSlider.removeRequirement(pluginName);

    $.fn.sliceSlider.Plugins.SliceVerical = SliceVerical;
    $.fn.sliceSlider.resetPluginName();
}));