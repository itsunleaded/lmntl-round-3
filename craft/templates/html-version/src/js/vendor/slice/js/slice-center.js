/* global jQuery */

/**
 * Slice Center View Plugin
 * Working only with carousel view
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

    $.fn.sliceSlider.setPluginName('center');

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        requirements = {
            centerView : true,
            single : false
        }
    ;

    var pluginDefaults = {
        centerView : false // Enable/disable centered view
    };

    /**
     * Normilize slide position in carousel.
     * @param {number} position - position.
     * @param {number} last - last position.
     * @param {number} lastCentered - last centered position.
     * @param {number} displace - slides displace.
     * @return {number} - normalized position.
     */
    function normalizePosition(position, last, lastCentered, displace){
        var normalized = position;
        normalized += displace;

        // check if moved to far
        if (normalized >= last && position < lastCentered){
            normalized = last - 1;
        }
        return normalized;
    }

    /**
     * Center plugin.
     * @class The Slice Center
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceCenter(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     */
    SliceCenter.prototype.setup = function (){
        var settings = this.slice.settings;
        if (settings.centerView){
            settings.workers.centerView = true;
            settings.workers.displace = true;
        }
        return this;
    };


    $.fn.sliceSlider.addRequirement(requirements);

    /*
    *   Stage slides workers :
    *   - Set displace position, priority 10
    *   - Set clones count, priority 40 - 45
    *   - Clone slides, priority 45
    *   
    *   Priority 0 - 50
    */
    addWorker('setDisplaceActive', ['slides', 'settings'], function(stage){
        stage.displaceActive = Math.ceil(((stage.slidesToShow || 1) - 1) / 2);
    }, 10, 'fixedslides');
    addWorker('setDisplacePosition', ['slides', 'settings'], function(stage){
        stage.displacePosition = Math.ceil(((stage.slidesStep || 1) - 1) / 2);
    }, 10);
    addWorker('minSlides', ['edges', 'slides', 'settings'], function(stage){
        stage.minSlides -= stage.displaceActive;
    }, 20, {
        fixedslides : true,
        showFit : false
    });
    addWorker('cacheCloneCount', ['size', 'slides', 'settings'], function(stage, cache){
        cache.clonesCount += (stage.workSpace / 2) / cache.slideSize;
    }, 50, {
        fixedsize : true,
        loop : true,
        showFit : false
    });

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('setCoordinatesDisplace', ['size', 'slides', 'settings'], function(stage, cache){
        cache.displace -= (stage.viewSize - cache.slideSize) / 2;
    }, 81, 'fixedsize');

    /*
    *   Calculate start and last slides
    *   Priority 100 - 150
    */
    $.fn.sliceSlider.addRequirement('fixedslides');
    addWorker('adjustLastSlide', ['edges', 'slides', 'settings'], function(stage){
        stage.lastSlide += stage.displacePosition;
    }, 101, {
        showFit : false
    });
    addWorker('adjustStartLastSlides', ['edges', 'slides', 'settings'], function(stage){
        stage.startSlide += stage.displaceActive;
        stage.lastSlide += stage.displaceActive;
    }, 101, {
        showFit : true,
        loop : false
    });
    addWorker('adjustStartLastSlidesLoop', ['edges', 'slides', 'settings'], function(stage){
        stage.startSlide += stage.displacePosition;
        stage.lastSlide += stage.displacePosition;
    }, 101, {
        showFit : true,
        loop : true
    });
    $.fn.sliceSlider.removeRequirement('fixedslides');

    /*
    *   Calculate last centered slide
    *   Priority 110
    */
    addWorker('setLastCenteredSlide', ['edges', 'slides', 'settings'], function(stage){
        stage.lastSlideCentered = stage.startSlide + stage.slidesStep * (Math.ceil((stage.lastSlide - stage.startSlide) / stage.slidesStep) - 1) + stage.displacePosition +1;
        if (stage.lastSlideCentered > stage.lastSlide){
            stage.lastSlideCentered = stage.lastSlide;
        }
    }, 111);

    /*
    *   Calculate start, last dots
    *   Priority 110 - 120
    */
    addWorker('adjustLastDot', ['edges', 'slides', 'settings'], function(stage, cache){
        stage.dotsDisplace = Math.floor(((cache.dotsStep || 1) - 1) / 2);
        cache.dotsLast += stage.dotsDisplace;
    }, 111, 'dots');
    addWorker('adjustStartDot', ['edges', 'slides', 'settings'], function(stage, cache){
        cache.dotsStart += stage.dotsDisplace;
    }, 112, {
        dots : true,
        showFit : true
    });

    /*
    *   Calculate last centered dot
    *   Priority 130
    */
    addWorker('setLastCenteredDot', ['edges', 'slides', 'settings'], function(stage){
        if (this.settings.dotsSlideToScroll) {
            stage.dotsLastCentered = stage.dotsStart + stage.dotsStep * (Math.ceil((stage.dotsLast - stage.dotsStart) / stage.dotsStep) - 1) + stage.dotsDisplace +1;
            if (stage.dotsLastCentered > stage.dotsLast){
                stage.dotsLastCentered = stage.dotsLast;
            }
        } else {
            stage.dotsLastCentered = stage.lastSlideCentered;
        }
    }, 130, 'dots');

    /*
    *   Calculate slide movement workers:
    *   - Calculate current/active positions, priority 250 - 280
    *   - Calculate normilized positions, priority 250 - 270
    *   
    *   Priority 200 - 299
    */
    addWorker('normalizedPosition', ['reset', 'move'], function(stage, cache){
        cache.normilizedPosition = normalizePosition(cache.normilizedPosition, stage.lastSlide, stage.lastSlideCentered, stage.displacePosition);
    }, 259);
    addWorker('activePosition', ['move', 'reset'], function(stage, cache){
        cache.activePosition -= stage.displaceActive;
        cache.activePositionEnd -= stage.displaceActive;
        if (cache.activePosition < 1){
            cache.activePosition = 1;
        }
    }, 275, 'fixedslides');

    /*
    *   Set active dot worker.
    *   Priority 300 - 310
    */
    addWorker('activeDot', ['move', 'reset'], function(stage, cache){
        cache.activeDot = normalizePosition(cache.activeDot, stage.dotsLast, stage.dotsLastCentered, stage.dotsDisplace);
    }, 301, 'dots');

    /*
    *   Get next/previous position runnable:
    *   - set position, priority 0 - 10
    *   
    *   Priority 0 - 40
    */
    $.fn.sliceSlider.setRunnableType('slidePosition');
    $.fn.sliceSlider.addRunnable('normalizePosition', true, ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        cache.position = normalizePosition(cache.position, stage.lastSlide, stage.lastSlideCentered, stage.displacePosition);
    }, 9);
    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement(requirements);

    $.fn.sliceSlider.Plugins.SliceCenter = SliceCenter;
    $.fn.sliceSlider.resetPluginName();
}));