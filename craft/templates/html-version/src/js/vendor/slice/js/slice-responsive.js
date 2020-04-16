/* global jQuery */

/**
 * Slice Responsive Plugin
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

    $.fn.sliceSlider.setPluginName('responsive');
    var pluginDefaults = {
        responsive : false
    };

    function getResponsiveOptions($element, optionsProvider){
        var strLen = optionsProvider.length;
        if (!optionsProvider){
            return false;
        }
        var data = $element.data(),
            list = [];
        $.each(data, function(key, val){
            var keyStr = key + '';
            if (keyStr.lastIndexOf(optionsProvider, 0) === 0){
                var opts = $.fn.sliceSlider.parseOptions(val),
                    breakpoint = opts.hasOwnProperty('breakpoint') ? opts.breakpoint : parseInt(keyStr.slice(strLen));
                if (!isNaN(breakpoint)){
                    opts.breakpoint = Math.abs(breakpoint);
                    list.push(opts);
                }
            }
        });
        return list.length ? list : false;
    }

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceResponsive = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
        var responsiveSettings = getResponsiveOptions(slice.$element, slice.options.optionsProvider || slice.defaults.optionsProvider);
        if (responsiveSettings){
            slice.options.responsive = $.extend(slice.options.responsive || {}, responsiveSettings);
        }
    };

    /**
     * Creat breakpoint.
     * @param {integer} breakpoint - The breakpoint value
     * @param {Array} settings - Raw breakpoint settings
     * @return {Array} - Breakpoint settings
     */
    var createBreakpoint = function (breakpoint, options){
        var opt = $.extend({}, options || {});
        if (opt.responsive){
            delete opt.responsive;
        }
        opt.breakpoint = breakpoint;
        return {
            breakpoint : breakpoint,
            options : opt
        };
    };

    /**
     * Create breakpoints.
     * @param {Array} options - options
     * @param {Array} responsive - responsive options
     * @return {Array} - List of settings for different breakpoints
     */
    var createBreakpoints = function (options, responsive){
        var breakpoints = {};

        // add basic breakpoint
        breakpoints[0] = createBreakpoint(0, options);

        if (responsive){
            $.each(responsive, function(i, breakpointSettings){
                if( !breakpointSettings.hasOwnProperty('breakpoint') || breakpointSettings.breakpoint !== parseInt(breakpointSettings.breakpoint, 10) ){
                    return;
                }
                breakpoints[breakpointSettings.breakpoint] = createBreakpoint(breakpointSettings.breakpoint, breakpointSettings);
            });
        }

        // create array of breakpoints sorted by 'breakpoint'
        breakpoints = Object.keys(breakpoints)
            .map(function(key) {
                return breakpoints[key];
            })
            .sort(function(item1, item2){
                return item1.breakpoint - item2.breakpoint;
            });

        return breakpoints;
    };

    function buildBreakPoint (breakpoints, index, resolution, currentBreakpoint){
        var ind = index || 0,
            breakpoint = breakpoints[ind];
        if (!breakpoint.builtOptions){
            if (ind && !breakpoint.defaults){
                for (var i = 1; i <= ind; i++) {
                    if (!breakpoints[i].defaults){
                        breakpoints[i].defaults = $.extend({}, breakpoints[i - 1].defaults, breakpoints[i - 1].options);
                    }
                }
            }
            breakpoint.builtOptions = $.extend({}, breakpoint.defaults, breakpoint.options);
        }
        var builtOptions = breakpoint.builtOptions,
            breakpointValue = breakpoint.builtOptions.breakpoint,
            theme = builtOptions.theme,
            themeBreakpoint;
        theme = $.fn.sliceSlider.getTheme(theme);
        if (theme){
            if (!theme.breakpoints){
                theme.breakpoints = createBreakpoints(theme.defaults, theme.defaults.responsive);
                theme.breakpoints[0].defaults = {};
            }
            themeBreakpoint = getBreakpoint(theme.breakpoints, resolution || 0, currentBreakpoint);
            breakpointValue = themeBreakpoint && breakpointValue < themeBreakpoint.breakpoint ? themeBreakpoint.breakpoint : breakpointValue;
        }
        return currentBreakpoint === breakpointValue ? false : $.extend({},
            themeBreakpoint || {},
            breakpoint.builtOptions,
            {
                breakpoint : breakpointValue
            }
        );
    }

    /**
     * Get breakpoint.
     * @param {integer} resolution - The resolution
     * @return {Array} breakpoints - List of settings for different breakpoints
     */
    function getBreakpoint (breakpoints, resolution, currentBreakpoint){
        var res = resolution || 0;
        for (var i = breakpoints.length - 1; i >= 0; i--) {
            if (res >= breakpoints[i].breakpoint){
                return buildBreakPoint(breakpoints, i, res, currentBreakpoint);
            }
        }
        return buildBreakPoint(breakpoints, 0, res, currentBreakpoint);
    }

    /**
     * Setup responsive settings.
     * @param {Array} settings - The slice slider settings
     */
    SliceResponsive.prototype.preSetup = function (){
        var context = this,
            slice = context.slice,
            responsive = slice.options.hasOwnProperty('responsive') ? slice.options.responsive : slice.defaults.responsive || false;
        context.breakpoints = createBreakpoints(slice.options, responsive);
        context.breakpoints[0].defaults = {
            theme : slice.defaults.theme || false
        };

        context.checkBreak();
        context.slice.leave('setup');
        return context;
    };

    /**
     * Check slider for current resolution.
     */
    SliceResponsive.prototype.checkBreak = function (){
        var context = this;
        context.resolution = $(window).width();
        var breakpoint = getBreakpoint(context.breakpoints, context.resolution, context.breakpoint && context.breakpoint);
        if( !context.breakpoint || context.breakpoint.breakpoint !== breakpoint.breakpoint ){
            context.breakpoint = $.extend({}, context.slice.defaults, breakpoint);
            context.slice.setup(context.breakpoint);
        }
        return breakpoint;
    };

    /*
    *   Resize/Re-check slider size
    *   
    *   Priority 0 - 100
    */
    $.fn.sliceSlider.setRunnableType('resize');
    $.fn.sliceSlider.addRunnable('checkResponsive', ['resize'], function(){
        var responsive = this.plugins.sliceResponsive;
        if ($(window).width() !== responsive.resolution) {
            responsive.checkBreak();
        }
    });
    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.Plugins.SliceResponsive = SliceResponsive;
    $.fn.sliceSlider.resetPluginName();

}));