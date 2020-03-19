/* global jQuery */

/**
 * Slice Autosize Plugin
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

    $.fn.sliceSlider.setPluginName('autosize');

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        requirements = 'autosize'
    ;

    var pluginDefaults = {
        autosize : false, // enable/disable automatic slide size calculation,
        carousel : true
    };

    /**
     * Autosize plugin.
     * @class The Slice Autosize
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceAutosize = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    };

    /**
     * Setup settings.
     */
    SliceAutosize.prototype.setup = function (){
        var settings = this.slice.settings;
        // check if carousel plugin is loaded and enable it with autosize
        if (settings.autosize && $.fn.sliceSlider.Plugins.SliceCarousel) {
            settings.workers.autosize = true;
            settings.workers.fixedsize = false;
            settings.workers.fixedslides = false;
            settings.workers.single = false;
            settings.workers.carousel = true;
        }
        return this;
    };

    function getFitCount(size, sizes, max, spacing, reverse){
        var i = reverse ? max : 1,
            start = i,
            end = reverse ? 1 : max,
            step = reverse ? -1 : 1,
            count = 0,
            expanded = 0;
        size += spacing;
        size = Math.max(size, 0);
        while (expanded < size) {
            expanded += sizes[i] + spacing;
            ++count;
            if (i === end){
                if (expanded === 0){
                    return sizes.length;
                }
                i = start;
            }else{
                i += step;
            }
        }
        return count;
    }


    $.fn.sliceSlider.addRequirement(requirements);

    addWorker('addInvalidate', ['size'], function(stage, cache){
        var context = this;
        if (cache.invalidated.all){
            return;
        }
        if (!cache.invalidated.edges){
            context.invalidate('edges');
            cache.reUpdate = true;
        }
    }, -100, {
        fixedslides : false
    });

    /*
    *   Stage slides workers :
    *   - Set slides to show, step 0 - 10
    *   - Set minimum slides, priority 30
    *   - Set clones count, priority 10 - 45
    *   - Calculate slides sizes, priority 30
    *   - Calculate stage size, priority 50
    *   - Set slides sizes, priority 60
    *   
    *   Priority 0 -
    */
    addWorker('slidesToShow', ['settings'], function(stage){
        stage.slidesToShow = stage.slidesToShow || 1;
        stage.slidesStep = stage.slidesStep || stage.slidesToShow;
    }, 1, 'carousel');
    addWorker('slidesSizes', ['size', 'slides', 'settings'], function(stage, cache){
        cache.slidesSizes = {};
        var $slides = cache.$slides || stage.$originalSlides || stage.$slides,
            workers = this.settings.workers,
            canResize = workers.horizontal || workers.fixedheight || !workers.adaptiveHeight,
            $slide, slideSize;
        for (var i = 0; i < $slides.length; i++) {
            // don't allow slide size exceed work space size
            $slide = $slides.eq(i).data('sliceSizeIndex', i + 1);
            slideSize = stage.getSize($slide);
            if (canResize && slideSize > stage.workSpace){
                slideSize = stage.workSpace;
                stage.setSize($slide, slideSize);
            }
            cache.slidesSizes[i + 1] = slideSize;
        }
    }, 30);
    addWorker('minSlides', ['edges', 'slides', 'settings'], function(stage, cache){
        var size = cache.minViewSize || stage.viewSize,
            slidesCount = (cache.$slides || stage.$originalSlides|| stage.$slides).length;
        stage.minSlides = getFitCount(size, cache.slidesSizes, slidesCount, stage.slideSpacing || 0);
    }, 30, {
        carousel : true,
        fixedslides : false
    });
    addWorker('setClonesCount', ['size', 'slides', 'settings'], function(stage, cache){
        var clonesCountPrev = stage.minSlides,
            clonesCountNext = getFitCount(stage.viewSize * 2, cache.slidesSizes, stage.$originalSlides.length, stage.slideSpacing || 0, true) + 1;
        stage.clonesCount = clonesCountPrev > clonesCountNext ? clonesCountPrev : clonesCountNext;
    }, 40, 'loop');
    addWorker('stageSize', ['size', 'slides', 'settings'], function(stage){
        var size = 0;
        stage.$slides.each(function(i, el){
            size += stage.getSize($(el));
        });
        stage.size = size;
    }, 50);

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('setCoordinates', ['size', 'slides', 'settings'], function(stage, cache){
        var size = stage.$slides.length,
            iterator = 0,
            coordinates = {};

        coordinates[1] = 0 - cache.displace;
        while (++iterator < size) {
            coordinates[iterator + 1] = coordinates[iterator] - stage.getSize(stage.$slides.eq(iterator - 1)) -  + cache.displacePerSlide;
        }

        stage.coordinates = coordinates;
    }, 85);

    /*
    *   Calculate start and last slides
    *   Priority 100 - 150
    */
    addWorker('setLastSlide', ['edges', 'slides', 'settings'], function(stage){
        if (!stage.enoughSlides){
            stage.lastSlide = stage.startSlide;
            return;
        }
        var lastCoordinates = stage.viewSize - stage.size,
            lastSlide = 1;
        while (stage.coordinates[lastSlide + 1] > lastCoordinates){
            ++lastSlide;
        }
        if (stage.coordinates[lastSlide] !== lastCoordinates && stage.slidesCount > lastSlide){
            ++lastSlide;
        }
        stage.coordinates[lastSlide] = lastCoordinates;
        stage.lastSlide = lastSlide;
    }, 110, {
        carousel : true,
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
        var endPos = cache.activePosition,
            endCoords = stage.coordinates[cache.activePosition] - stage.viewSize;
        while (stage.$slides.length > endPos && stage.coordinates[endPos + 1] > endCoords){
            ++endPos;
        }
        cache.activePositionEnd = endPos;
    }, 270, {
        carousel : true,
        displace : false,
        fixedslides : false
    });

    /*
    *   Get stage height
    *   
    *   Priority 0 - 100
    */
    $.fn.sliceSlider.setRunnableType('size');
    $.fn.sliceSlider.addRunnable('cacheViewSize', ['viewHeight'], function(stage, cache){
        cache.slideSizes.sort(function(a, b){
            return b - a;
        });
        cache.viewSize = 0;
        var count = stage.slidesToShow;
        for (var i = 0; i < cache.slideSizes.length && i < count; i++) {
            cache.viewSize += cache.slideSizes[i];
        }
    }, 20, {
        carousel : true,
        vertical : true
    });
    $.fn.sliceSlider.addRunnable('cacheInViewSize', ['inViewHeight'], function(stage, cache){
        cache.viewSize = 0;
        var count = stage.slidesToShow;
        cache.$slides.each(function(i, el){
            cache.viewSize += $(el)[$.fn.sliceSlider.cssProps.height]();
            --count;
            if (!count){
                return;
            }
        });
    }, 20, {
        carousel : true,
        vertical : true
    });

    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement(requirements);

    $.fn.sliceSlider.Plugins.SliceAutosize = SliceAutosize;
    $.fn.sliceSlider.fn.getFitCount = getFitCount;
    $.fn.sliceSlider.resetPluginName();
}));