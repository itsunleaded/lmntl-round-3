/* global jQuery */

/**
 * Slice Autosize Center View Plugin
 * Extra script for autosize slides center view
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

    $.fn.sliceSlider.setPluginName('autosizeCenter');

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        requirements = {
            autosize : true,
            centerView : true
        }
    ;

    /**
     * Slice Autosize Center View Plugin.
     * @class The Slice Autozie Center
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceAutosizeCenter(slice){
        this.slice = slice;
    }

    $.fn.sliceSlider.addRequirement(requirements);

    /*
    *   Set min/max view size
    *   Priority 20
    */
    addWorker('checkEnoughtSlides', ['size', 'slides', 'settings'], function(stage, cache){
        cache.minViewSize = stage.viewSize / 2;
    }, 20, {
        showFit : false,
        fixedslides : false
    });

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('adjustCoordinates', ['size', 'slides', 'settings'], function(stage, cache){
        $.each(stage.coordinates, function (key){
            stage.coordinates[key] += (stage.viewSize - cache.slidesSizes[stage.$slides.eq(key - 1).data('sliceSizeIndex')]) / 2;
        });
    }, 86);

    /*
    *   Calculate start and last slides
    *   Priority 100 - 150
    */
    addWorker('setStartSlide', ['edges', 'slides', 'settings'], function(stage, cache){
        var spacing = stage.slideSpacing || 0;
        stage.startSlide = $.fn.sliceSlider.fn.getFitCount(stage.viewSize / 2, cache.slidesSizes, stage.$slides.length, spacing);
        if (stage.startSlide > stage.slidesStep){
            stage.startSlide -= stage.slidesStep;
        }
        if (stage.enoughSlides){
            stage.coordinates[stage.startSlide] = - spacing;
        }
    }, 100, {
        showFit : true,
        loop : false,
        fixedslides : false
    });

    /*
    *   Calculate slide movement workers :
    *   - Calculate current/active positions, priority 250 - 280
    *   
    *   Priority 200 - 299
    */
    addWorker('activePosition', ['move', 'reset'], function(stage, cache){
        var startPos = cache.activePosition,
            startCoords = stage.coordinates[cache.activePosition] + stage.viewSize / 2,
            endPos = cache.activePosition,
            endCoords = stage.coordinates[cache.activePosition] - stage.viewSize / 2;
        while (startPos > 1 && stage.coordinates[startPos - 1] < startCoords){
            --startPos;
        }
        while (stage.$slides.length > endPos && stage.coordinates[endPos + 1] > endCoords){
            ++endPos;
        }
        if (startPos > 1 && (stage.coordinates[startPos] + stage.getSize(stage.$slides.eq(startPos - 1)) / 2) < startCoords){
            --startPos;
        }
        if (stage.$slides.length > endPos && (stage.coordinates[endPos] - stage.getSize(stage.$slides.eq(endPos - 1)) / 2) > endCoords){
            ++endPos;
        }
        cache.activePosition = startPos;
        cache.activePositionEnd = endPos;
    }, 270, {
        fixedslides : false
    });

    $.fn.sliceSlider.removeRequirement(requirements);

    $.fn.sliceSlider.Plugins.SliceAutosizeCenter = SliceAutosizeCenter;
    $.fn.sliceSlider.resetPluginName();
}));