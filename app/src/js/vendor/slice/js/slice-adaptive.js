/* global jQuery */

/**
 * Slice Adaptive Plugin
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

    var pluginName = 'adaptive';
    $.fn.sliceSlider.setPluginName(pluginName);

    var addWorker = $.fn.sliceSlider.addWorker,
        requirement = 'adaptiveHeight';
    var pluginDefaults = {
        adaptiveHeight : false, // enable/disable adaptive height
        adaptiveClass : 'slice-slider-adaptive', // adaptive slider class
        adaptiveEasing : 'swing' // daptive height animation easing function
    };

    /**
     * Adaptive plugin.
     * @class The Slice Adaptive
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceAdaptive = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    };

    /**
     * Setup settings.
     */
    SliceAdaptive.prototype.setup = function (){
        var settings = this.slice.settings;
        this.slice.$element.toggleClass(settings.adaptiveClass, !!settings.adaptiveHeight);
        if (settings.adaptiveHeight){
            settings.workers.adaptiveHeight = true;
            settings.workers.staticHeight = false;
        }
        return this;
    };

    $.fn.sliceSlider.addRequirement(requirement);

    /*
    *   Request rebuild with autosize enabled for vertical sliding
    *   Priority 0
    */
    addWorker('reBuild', true, function(stage, cache){
        cache.rebuild = true;
        var workers = this.settings.workers;
        workers.autosize = true;
        workers.fixedsize = false;
        workers.fixedslides = true;
        workers.autoadaptive = true;
    }, -10, {
        vertical : true,
        autoadaptive : false
    });

    /*
    *   Moving/animating slides workers :
    *   - Animate viewport size, priority 349
    *   
    *   Priority 200 - 350
    */
    addWorker('animateViewport', ['reset', 'move'], function(stage, cache){
        var context = this,
            speed = cache.moveSpeed || 0,
            animate = speed > 0,
            animateProps = {},
            height = context.run('getInViewHeight')
        ;
        animateProps[$.fn.sliceSlider.cssProps.height] = Math.ceil(height);

        context.$viewport.finish();
        if (animate) {
            context.$viewport.animate(animateProps, speed, context.settings.adaptiveEasing);
        } else {
            context.$viewport.css(animateProps);
        }
    }, 349);/*
    *   Get stage height
    *   
    *   Priority 0 - 100
    */
    $.fn.sliceSlider.setRunnableType('size');
    $.fn.sliceSlider.addRunnable('stageHeight', ['viewHeight'], function(stage, cache){
        cache.result = this.run('getInViewHeight');
        return false;
    }, -1);

    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement(requirement);

    $.fn.sliceSlider.Plugins.SliceAdaptive = SliceAdaptive;
    $.fn.sliceSlider.resetPluginName();
}));