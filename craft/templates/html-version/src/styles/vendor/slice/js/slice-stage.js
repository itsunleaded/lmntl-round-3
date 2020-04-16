/* global jQuery */

/**
 * Slice Stage Plugin
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

    $.fn.sliceSlider.setPluginName('stage');

    var addWorker = $.fn.sliceSlider.addWorker,
        addRunnable = $.fn.sliceSlider.addRunnable,
        requirement = 'stagePadding';
    
    var pluginDefaults = {
        // allowed units %, px
        stagePadding : false, // size padding
        stageMaxSize : false // stage maximum size to distribute between shown slides 
    };

    /**
     * Stage plugin.
     * @class The Slice Stage
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceStage(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     */
    SliceStage.prototype.setup = function (){
        var settings = this.slice.settings;
        settings.workers.stagePadding = !!(settings.stagePadding || settings.stageMaxSize);
        settings.workers.stageMaxSize = !!settings.stageMaxSize;
        return this;
    };

    $.fn.sliceSlider.addRequirement(requirement);

    /*
    *   View sizes workers :
    *   1. Calculate stage padding, priority 10 - 15
    *   2. Calculate view size, priority 10 - 20
    *   3. Calculate work space size, priority 20 - 30
    *   
    *   Priority 10 - 30
    */
    addWorker('setStagePadding', ['size', 'settings'], function(stage){
        stage.padding = $.fn.sliceSlider.toPx(this.settings.stagePadding || 0, stage.viewportSize);
    }, 10);
    addWorker('checkStageMaxSize', ['size', 'slides', 'settings'], function(stage, cache){
        var size = $.fn.sliceSlider.toPx(this.settings.stageMaxSize, stage.viewportSize);
        if (cache.viewSize > size){
            size = Math.ceil((cache.viewSize - size) / 2);
            if (size > stage.padding){
                stage.padding = size;
            }
        }
    }, 11, 'stageMaxSize');
    addWorker('adjustViewportSize', ['size', 'slides', 'settings'], function(stage, cache){
        cache.viewSize -= stage.padding * 2;
    }, 15);

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('setCoordinatesDisplace', ['size', 'slides', 'settings'], function(stage, cache){
        if (stage.padding > 0) {
            cache.displace -= stage.padding;
        }
    }, 81);

    /*
    *   Get stage height
    *   
    *   Priority 0 - 100
    */
    $.fn.sliceSlider.setRunnableType('size');
    addRunnable('stagePadding', ['viewHeight', 'inViewHeight'], function(stage, cache){
        cache.padding = $.fn.sliceSlider.revPx(this.settings.stagePadding || 0, cache.viewSize);
    }, 29, 'vertical');
    addRunnable('checkStageMaxSize', ['stagePadding'], function(stage, cache){
        var size = $.fn.sliceSlider.revPx(this.settings.stageMaxSize, cache.viewSize);
        if (cache.viewSize > size){
            size = Math.ceil((cache.viewSize - size) / 2);
            if (size > stage.padding){
                stage.padding = size;
            }
        }
    }, 29, {
        stageMaxSize : true,
        vertical : true
    });
    addRunnable('stagePadding', ['viewHeight', 'inViewHeight'], function(stage, cache){
        cache.viewSize += cache.padding * 2;
    }, 29, 'vertical');
    
    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement(requirement);

    $.fn.sliceSlider.Plugins.SliceStage = SliceStage;
    $.fn.sliceSlider.resetPluginName();
}));