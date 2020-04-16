/* global jQuery */

/**
 * Slice Slide Plugin
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

    $.fn.sliceSlider.setPluginName('slide');

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        addRunnable = $.fn.sliceSlider.addRunnable,
        setRunnableType = $.fn.sliceSlider.setRunnableType,
        cssProps = $.fn.sliceSlider.cssProps,
        requirement = 'fixedsize';

    var pluginDefaults = {
        // allowed units %, px
        currentSlideSize : false, // current slide size responding to other slides
        stickSlides : true, // don't allow extra space between slides
        slideAlign : 'center', // slide align of non sticked slides
        currentSlideAlign : false, // current slide align of non sticked slides, false - same as 'slideAlign'
        slideEasing : 'swing', // current slide align in case of it's smaller than other slides
        currentResizedClass : 'slice-current-resized', // class for current resized element
        slideRatio : false // slides aspect ration
    };

    /**
     * Count height by ratio.
     * @param {number} val - width
     * @param {number} ratio - ratio
     * @return {number} height
     */
    function countHeightRatio(val, ratio){
        return val * ratio;
    }

    /**
     * Count width by ratio.
     * @param {number} val - height
     * @param {number} ratio - ratio
     * @return {number} width
     */
    function countWidthRatio(val, ratio){
        return val / ratio;
    }

    /**
     * Animate slide.
     * @param {jQuery} $slide - slide element
     * @param {object} settings - slider settings
     * @param {object} stage - slider stage
     * @param {number} size - slide size
     * @param {number} spacing - slide spacing
     * @param {number} align - slide align
     * @param {number} speed - animation speed
     * @param {number} delay - animation delay
     */
    function animateSlide($slide, settings, stage, size, spacing, align, speed, delay){
        var animate = speed && speed > 0,
            animateProps = {}
        ;
        spacing = spacing || 0;
        animateProps[stage.sizeProp] = size;
        if (stage.slideRatio){
            animateProps[stage.revSizeProp] = stage.ratioFn(size, stage.slideRatio);
        }
        switch (align){
            case 'prev':
                animateProps[stage.spacingProps[1]] = spacing;
                break;
            case 'next':
                animateProps[stage.spacingProps[0]] = spacing + (stage.slideSpacing || 0);
                break;
            default :
                var sideSpacing = spacing / 2;
                animateProps[stage.spacingProps[0]] = sideSpacing + (stage.slideSpacing || 0);
                animateProps[stage.spacingProps[1]] = sideSpacing;
                break;
        }

        $slide.finish();
        if (animate) {
            if (delay){
                $slide.delay(delay);
            }
            $slide.animate(animateProps, speed, settings.slideEasing);
        } else {
            $slide.css(animateProps);
        }
    }

    /**
     * Slide plugin.
     * @class The Slice Slide
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceSlide(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     */
    SliceSlide.prototype.setup = function (){
        var settings = this.slice.settings,
            stage = this.slice.stage,
            ratioType = typeof settings.slideRatio,
            ratio;
        settings.workers.currentSlideSize = !!settings.currentSlideSize;
        settings.workers.stickSlides = !!settings.stickSlides;

        switch (ratioType){
            case 'number':
                ratio = settings.slideRatio;
                break;
            case 'string':
                ratio = settings.slideRatio.split('by');
                if (ratio.length === 2){
                    ratio = parseInt(ratio[1]) / parseInt(ratio[0]);
                }
                break;
        }
        if (ratio && !isNaN(ratio)){
            stage.slideRatio = ratio;
            stage.ratioFn = countHeightRatio;
            settings.workers.slideRatio = true;
        }

        return this;
    };


    $.fn.sliceSlider.addRequirement(requirement);

    $.fn.sliceSlider.addRequirement('slideRatio');

    /*
    *   Set 'vertical' ratio function workers
    *   Priority 0
    */
    addWorker('verticalRatio', ['settings'], function(stage){
        stage.ratioFn = countWidthRatio;
    }, 0, 'vertical');

    /*
    *   Set slides ratio
    *   Priority 70
    */
    addWorker('resizeSlides', ['size', 'slides', 'settings'], function(stage){
        stage.$slides.css(stage.revSizeProp, stage.ratioFn(stage.slideSize, stage.slideRatio));
    }, 70);

    $.fn.sliceSlider.removeRequirement('slideRatio');

    $.fn.sliceSlider.addRequirement('currentSlideSize');

    /*
    *   Stage slides workers :
    *   - Calculate slide size, priority 30 - 40
    *   - Calculate stage size, priority 60
    *   
    *   Priority 0 - 50
    */
    addWorker('cacheSlideUnits', ['size', 'slides', 'settings'], function(stage){
        stage.currentSlideUnits = $.fn.sliceSlider.toUnitType(this.settings.currentSlideSize);
        stage.currentSlideSpacing = false;
        stage.extraSlideSpacing = false;
    });
    addWorker('setCurrentSlideSize', ['size', 'slides', 'settings'], function(stage, cache){
        switch (stage.currentSlideUnits.type){
            case '%':
                var scale = stage.currentSlideUnits.scale;
                if (scale < 1) {
                    stage.currentSlideSize = cache.slideSize * scale;
                    stage.currentSlideSpacing = cache.slideSize - stage.currentSlideSize;
                } else {
                    stage.currentSlideSize = cache.slideSize;
                    cache.slideSize = cache.slideSize / scale;
                    stage.extraSlideSpacing = Math.max(stage.currentSlideSize - cache.slideSize, 0);
                }
                break;
            case 'px':
                stage.currentSlideSize = stage.currentSlideUnits.value > stage.workSpace ? stage.workSpace : stage.currentSlideUnits.value;
                stage.currentSlideSpacing = Math.max(cache.slideSize - stage.currentSlideSize, 0);
                if (stage.slidesToShow && stage.currentSlideSize > cache.slideSize ){
                    cache.slideSize = (stage.workSpace - stage.currentSlideSize) / (stage.slidesToShow - 1);
                }
                break;
        }
    }, 31, {
        stickSlides : false
    });
    addWorker('setSlidesSpacing', ['size', 'slides', 'settings'], function(stage){
        if (!stage.extraSlideSpacing){
            return;
        }
        var props = {},
            spacing = stage.extraSlideSpacing;
        switch (this.settings.slideSpacing){
            case 'prev':
                props[stage.spacingProps[1]] = spacing;
                break;
            case 'next':
                props[stage.spacingProps[0]] = spacing + (stage.slideSpacing || 0);
                break;
            default :
                var sideSpacing = spacing / 2;
                props[stage.spacingProps[0]] = sideSpacing + (stage.slideSpacing || 0);
                props[stage.spacingProps[1]] = sideSpacing;
                break;
        }
        stage.$slides.css(props);
        stage.size += spacing * (stage.$slides.length - 1);
    }, 61, {
        stickSlides : false
    });

    // calculate sticked slides sizes
    $.fn.sliceSlider.addRequirement('stickSlides');
    addWorker('setCurrentSlideSizeSingle', ['size', 'slides', 'settings'], function(stage, cache){
        switch (stage.currentSlideUnits.type){
            case '%':
                var scale = stage.currentSlideUnits.scale;
                if (scale < 1) {
                    stage.currentSlideSize = cache.slideSize * scale;
                } else {
                    stage.currentSlideSize = cache.slideSize;
                    cache.slideSize = cache.slideSize / scale;
                }
                break;
            case 'px':
                stage.currentSlideSize = stage.currentSlideUnits.value > stage.workSpace ? stage.workSpace : stage.currentSlideUnits.value;
                break;
        }
    }, 31, 'single');
    addWorker('setCurrentSlideSizeCarousel', ['size', 'slides', 'settings'], function(stage, cache){
        switch (stage.currentSlideUnits.type){
            case '%':
                var scale = stage.currentSlideUnits.scale;
                cache.slideSize = stage.workSpace / (stage.slidesToShow + scale - 1);
                stage.currentSlideSize = scale * cache.slideSize;
                break;
            case 'px':
                stage.currentSlideSize = stage.currentSlideUnits.value;
                cache.slideSize = (stage.workSpace - stage.currentSlideSize) / (stage.slidesToShow - 1);
                break;
        }
    }, 31, 'carousel');
    $.fn.sliceSlider.removeRequirement('stickSlides');

    addWorker('adjustStageSizeCurrent', ['size', 'slides', 'settings'], function(stage){
        var diff = stage.currentSlideSize - stage.slideSize - (stage.currentSlideSpacing || 0);
        if (diff > 0){
            stage.size += diff;
        }
    }, 61);

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('setCoordinatesDisplaceSingle', ['size', 'slides', 'settings'], function(stage, cache){
        var displace = stage.currentSlideSize - stage.slideSize;
        if ( displace < 0 ){
            cache.displace += displace / 2;
        }
    }, 81, {
        stickSlides : true,
        single : true
    });
    addWorker('setCoordinatesDisplaceCarousel', ['size', 'slides', 'settings'], function(stage, cache){
        if ( stage.extraSlideSpacing ){
            cache.displacePerSlide += stage.extraSlideSpacing;
        }
    }, 81, {
        stickSlides : false
    });

    /*
    *   Animate slider:
    *   - Calculate move animation, priority 300 - 340
    *   - Animate from slide, priority 349
    *   - Animate current slide, priority 349
    *   
    *   Priority 300 - 350
    */
    addWorker('adjustMovePosition', ['reset', 'move'], function(stage, cache){
        cache.moveToCoordinate -= (stage.currentSlideSize + (stage.currentSlideSpacing || 0) - stage.slideSize) / 2;
    }, 310, 'centerView');
    addWorker('animateFromSlide', ['reset', 'move'], function(stage, cache){
        var context = this,
            currentResizedClass = context.settings.currentResizedClass,
            $slide = stage.$slides.filter('.' + currentResizedClass).removeClass(currentResizedClass)
        ;
        if (cache.currentPosition === stage.$slides.index($slide) + 1){
            return;
        }
        animateSlide( $slide, context.settings, stage,
            stage.slideSize,
            stage.extraSlideSpacing,
            context.settings.slideAlign,
            cache.baseSpeed
        );
    }, 349);
    addWorker('animateCurrentSlide', ['reset', 'move'], function(stage, cache){
        var context = this,
            $slide = stage.$slides.eq(cache.currentPosition - 1).addClass(context.settings.currentResizedClass)
        ;
        animateSlide( $slide, context.settings, stage,
            stage.currentSlideSize,
            stage.currentSlideSpacing,
            context.settings.currentSlideAlign || context.settings.slideAlign,
            cache.baseSpeed,
            (cache.moveSpeed || 0) - (cache.baseSpeed || 0) // delay
        );
    }, 349);

    /*
    *   Get view height
    *   
    *   Priority 0 - 100
    */
    setRunnableType('size');
    addRunnable('cacheSlides', ['viewHeight'], function(stage, cache){
        cache.$current = stage.$slides;
    });
    addRunnable('cacheCurrentSlide', ['inViewHeight'], function(stage, cache){
        cache.$current = cache.$slides.filter('.' + this.settings.currentClass);
        cache.$slides = cache.$slides.not(cache.$current);
    });
    addRunnable('maxSlidesHeight', ['viewHeight', 'inViewHeight'], function(stage, cache){
        var context = this,
            settings = context.settings,
            removeClasses = settings.currentResizedClass + ' ' + settings.currentClass + ' ' + settings.activeClass;
        cache.$slides.each(function(i, el){
            var $slide = $(el),
                classes = $slide.attr('class'),
                storeWidth,
                width, size;
            $slide.removeClass(removeClasses);
            if (settings.workers.vertical){
                $slide.css(cssProps.width, '');
                width = $slide[cssProps.width]();
            } else {
                storeWidth = $slide.css(cssProps.width);
                $slide.css(cssProps.width, stage.slideSize);
                width = stage.slideSize;
            }
            size = stage.slideRatio ? countHeightRatio(width, stage.slideRatio) : $slide[cssProps.height]();
            $slide.attr('class', classes);
            if (storeWidth){
                $slide.css(cssProps.width, storeWidth);
            }
            cache.slideSizes.push(size);
        });
        cache.$slides = $([]);
    }, 5);
    addRunnable('currentMaxSlideHeight', ['viewHeight', 'inViewHeight'], function(stage, cache){
        var context = this,
            settings = context.settings,
            addClasses = settings.currentResizedClass + ' ' + settings.currentClass + ' ' + settings.activeClass;
        cache.$current.each(function(i, el){
            var $slide = $(el),
                classes = $slide.attr('class'),
                storeWidth = $slide.css(cssProps.width),
                width, size;
            $slide.addClass(addClasses);
            $slide.css(cssProps.width, stage.currentSlideSize);
            width = stage.currentSlideSize;
            size = stage.slideRatio ? countHeightRatio(width, stage.slideRatio) : $slide[cssProps.height]();
            $slide
                .attr('class', classes)
                .css(cssProps.width, storeWidth);
            cache.slideSizes.push(size);
        });
    }, 5, 'horizontal');
    addRunnable('currentMaxSlideHeightVertical', ['viewHeight', 'inViewHeight'], function(stage, cache){
        switch (stage.currentSlideUnits.type){
            case '%':
                var scale = stage.currentSlideUnits.scale;
                if (scale < 1) {
                    cache.currentSlideSize = cache.slideSize * scale;
                } else {
                    cache.currentSlideSize = cache.slideSize;
                    cache.slideSize = cache.slideSize / scale;
                }
                break;
            case 'px':
                cache.currentSlideSize = stage.currentSlideUnits.value;
                break;
        }
    }, 10, {
        vertical : true
    });
    addRunnable('currentMaxSlideHeightVertical', ['viewHeight', 'inViewHeight'], function(stage, cache){
        cache.slideSize = Math.max(cache.currentSlideSize, cache.slideSize);
    }, 10, {
        vertical : true,
        carousel : false
    });
    addRunnable('currentMaxSlideHeightVertical', ['viewHeight', 'inViewHeight'], function(stage, cache){
        cache.slideSize = Math.max(cache.currentSlideSize, cache.slideSize);
    }, 10, {
        vertical : true,
        carousel : true,
        stickSlides : false
    });
    addRunnable('cacheViewSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.viewSize += cache.currentSlideSize - cache.slideSize;
    }, 21, {
        vertical : true,
        carousel : true,
        stickSlides : true
    });

    /*
    *   Get closest slide position runnable:
    *   - set/calculate coordinate, priority 0 - 10
    *   
    *   Priority 0 - 30
    */
    setRunnableType('slidePosition');
    addRunnable('adjustCoordinate', ['closest', 'closestNext', 'closestPrev'], function(stage, cache){
        cache.coordinate += (stage.currentSlideSize + (stage.currentSlideSpacing || 0) - stage.slideSize) / 2;
    }, 10, 'centerView');

    /*
    *   Move/get stage coordinate runnable:
    *   - set/calculate coordinate, priority 10
    *   - set/calculate move distance, priority 20 - 29
    *   - move stage, priority 30
    *   
    *   Priority 0 - 30
    */
    setRunnableType('move');
    addRunnable('moveEdgeFriction', ['edgeFriction'], function(stage, cache){
        var diff = (stage.currentSlideSize + (stage.currentSlideSpacing || 0) - stage.slideSize) / 2,
            distance = cache.result + diff;
        if (distance >= stage.coordinates[this.currentPosition] || distance < stage.coordinates[stage.lastSlide]){
            cache.extraDistance = (cache.extraDistance || 0) + diff;
        }
    }, 21, {
        centerView : true,
        loop : false
    });

    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement('currentSlideSize');

    $.fn.sliceSlider.removeRequirement(requirement);

    $.fn.sliceSlider.Plugins.SliceSlide = SliceSlide;
    $.fn.sliceSlider.resetPluginName();
}));