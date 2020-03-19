/* global jQuery */

/**
 * Slice Carousel Plugin
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

    var pluginName = 'carousel';
    $.fn.sliceSlider.setPluginName(pluginName);

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        addRunnable = $.fn.sliceSlider.addRunnable,
        setRunnableType = $.fn.sliceSlider.setRunnableType,
        resetRunnableType = $.fn.sliceSlider.resetRunnableType;

    var pluginDefaults = {
        slidesToShow : false, // number of slides to show
        carouselClass : 'slice-carousel', // carousel class
        slidesToScroll : false, // if set to false than scroll same ammount of slides as 'slidesToShow'
        slidesToShowFit : false // makes it always show 'slidesToShow' slides at viewport
    };

    /**
     * Normilize slide position in carousel.
     * @param {number} position - slide position.
     * @param {object} stage - stage object.
     * @return {number} - normalized slide position.
     */
    function normalizePosition(position, stage){
        if (position >= stage.lastSlide){
            return stage.lastSlide;
        }else if (position <= stage.startSlide){
            return stage.startSlide;
        }

        var checkPosition = position > stage.startSlide ? position - (stage.startSlide - 1) : 1,
            pagePosition = stage.startSlide + stage.slidesStep * (Math.ceil( checkPosition / stage.slidesStep) - 1);

        if (pagePosition > stage.lastSlide){
            pagePosition = stage.lastSlide;
        } else if (pagePosition < stage.startSlide){
            pagePosition = stage.startSlide;
        }

        return pagePosition;
    }

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceCarousel(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     */
    SliceCarousel.prototype.setup = function (){
        var settings = this.slice.settings;
        if( settings.slidesToShow && settings.slidesToShow > 1 ){
            // carousel is enabled. Replace workers with coresponding carousel workers
            settings.workers.single = false;
            settings.workers.carousel = true;
        }
        this.slice.$element.toggleClass(settings.carouselClass, settings.slidesToShow && settings.slidesToShow > 1);
        settings.workers.showFit = !!settings.slidesToShowFit;
        return this;
    };


    $.fn.sliceSlider.addRequirement(pluginName);

    /*
    *   Calculate work space size
    *   Priority 20 - 30
    */
    addWorker('slideSize', ['size', 'slides', 'settings'], function(stage, cache){
        cache.workSpace -= stage.slideSpacing * (stage.slidesToShow - 1);
    }, 21, {
        fixedslides : true,
        spaced : true
    });


    /*
    *   Stage slides workers :
    *   - Set slides to show, step 0 - 10
    *   - Set minimum slides, priority 0 - 30
    *   - Calculate slide size, priority 30 - 50
    *   
    *   Priority 0 - 50
    */
    addWorker('slidesToShow', ['settings'], function(stage){
        stage.slidesToShow = this.settings.slidesToShow;
        stage.slidesStep = this.settings.slidesToScroll || stage.slidesToShow;
        stage.minSlides = stage.slidesToShow;
    });
    addWorker('slideSize', ['size', 'slides', 'settings'], function(stage, cache){
        cache.slideSize = stage.workSpace / stage.slidesToShow;
    }, 30, 'fixedsize');

    /*
    *   Calculate start and last slides
    *   Priority 100 - 150
    */
    $.fn.sliceSlider.addRequirement('fixedslides');
    addWorker('setLastSlide', ['edges', 'slides', 'settings'], function(stage){
        var checkPosition = stage.lastSlide - stage.startSlide + 1;
        stage.lastSlide = stage.startSlide + stage.slidesStep * (Math.ceil( checkPosition / stage.slidesStep) - 1);
    }, 110, {
        showFit : false
    });
    addWorker('setLastSlideFit', ['edges', 'slides', 'settings'], function(stage){
        stage.lastSlide = stage.lastSlide - stage.slidesToShow + 1;
    }, 110, {
        showFit : true,
        loop : false
    });
    addWorker('setLastSlideFitLoop', ['edges', 'slides', 'settings'], function(stage){
        stage.lastSlide = stage.lastSlide - stage.slidesStep + 1;
    }, 110, {
        showFit : true,
        loop : true
    });
    $.fn.sliceSlider.removeRequirement('fixedslides');

    /*
    *   Calculate slide movement workers :
    *   - Calculate current/active positions, priority 250 - 280
    *   - Calculate normilized positions, priority 250 - 270
    *   
    *   Priority 200 - 299
    */
    addWorker('normalizedPosition', ['reset', 'move'], function(stage, cache){
        cache.normilizedPosition = normalizePosition(cache.normilizedPosition, stage);
    }, 260);
    addWorker('activePosition', ['move', 'reset'], function(stage, cache){
        cache.activePosition = cache.normilizedPosition;
        cache.activePositionEnd = cache.normilizedPosition + stage.slidesToShow - 1;
    }, 270, 'fixedslides');

    /*
    *   Get stage height
    *   
    *   Priority 0 - 100
    */
    setRunnableType('size');
    addRunnable('cacheViewSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.viewSize = cache.slideSize * stage.slidesToShow;
    }, 20, {
        fixedsize : true,
        vertical : true
    });
    addRunnable('addSpacingSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.viewSize += stage.slideSpacing * (stage.slidesToShow - 1);
    }, 21, {
        fixedslides : true,
        spaced : true,
        vertical : true
    });

    // slide relative runnables
    setRunnableType('slidePosition');

    /*
    *   Get next/previous position runnable:
    *   - set position, priority 0 - 10
    *   - calculate next/previous position, priority 20 - 40
    *   
    *   Priority 0 - 40
    */
    addRunnable('normilizePosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        cache.position = normalizePosition(cache.position, stage);
    }, 10);
    addRunnable('calculateNextPosition', ['getNextPosition'], function(stage, cache){
        cache.result = cache.position + stage.slidesStep;
        // check if next position crossed last slide position
        if (cache.result > stage.lastSlide && cache.position < stage.lastSlide){
            cache.result = stage.lastSlide;
        }
    }, 20);
    addRunnable('calculatePrevPosition', ['getPrevPosition'], function(stage, cache){
        if (cache.position === stage.lastSlide){
            cache.result = cache.position - 1;
        } else {
            cache.result = cache.position - stage.slidesStep;
        }
    }, 20);
    addRunnable('normilizeResultPosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        cache.result = normalizePosition(cache.result, stage);
    }, 40);

    /*
    *   Get closest slide position runnable:
    *   - set/calculate coordinate, priority 0 - 10
    *   - set closest calculation function, priority 10
    *   - calculate closest position, priority 20 - 40
    *   
    *   Priority 0 - 40
    */
    addRunnable('nextOffset', ['closestNext', 'closestPrev'], function(stage, cache){
        cache.nextSlideOffset = stage.slidesStep;
    }, 5);
    addRunnable('normalizeClosestNext', ['closestNext'], function(stage, cache){
        var current = stage.position,
            normilized = normalizePosition(cache.result, stage);
        if (current === normilized && cache.result > current && (cache.ignoreLast || normilized !== stage.lastSlide)){
            cache.result = this.run('getNextPosition', {position : current});
        }else{
            cache.result = normilized;
        }
    }, 40);
    addRunnable('normalizeClosestPrev', ['closestPrev'], function(stage, cache){
        var current = stage.position,
            normilized = normalizePosition(cache.result, stage);
        if (cache.result < current && current === normilized){
            cache.result = this.run('getPrevPosition', {position : current});
        }else{
            cache.result = normilized;
        }
    }, 40);

    // cleanup runnable type
    resetRunnableType();

    $.fn.sliceSlider.removeRequirement(pluginName);

    $.fn.sliceSlider.Plugins.SliceCarousel = SliceCarousel;
    $.fn.sliceSlider.resetPluginName();
}));