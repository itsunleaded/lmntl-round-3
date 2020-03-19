/* global jQuery */

/**
 * Slice Loop Plugin
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

    var pluginName = 'loop';
    $.fn.sliceSlider.setPluginName(pluginName);

    // shortcuts
    var addWorker = $.fn.sliceSlider.addWorker,
        addRunnable = $.fn.sliceSlider.addRunnable;

    var pluginDefaults = {
        loop : false, // enable/disable infinite looping
        forceLoop : false // create loop even when not enought slides
    };

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceLoop(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     * @param {array} settings - event object.
     */
    SliceLoop.prototype.setup = function (){
        var context = this,
            settings = context.slice.settings;
        if( settings.loop ){
            settings.workers.loop = true;
            settings.workers.checkLoop = true;
            settings.workers.forceLoop = settings.forceLoop;
            settings.workers.rewind = false;
            settings.workers.checkSides = false;
        }
        return context;
    };

    /**
     * Get real (non cloned) slide position.
     * @param {number} position - position.
     * @param {number} slidesCount - real slides count position.
     * @param {number} clonesCount - clones count position.
     * @param {number} start - real slides start position.
     * @param {number} end - real slides end position.
     * @return {number} - real slide position.
     */
    function getRealPosition(position, slidesCount, clonesCount, start, end){
        var realPosition = position,
            resetPosition = false;
        if (realPosition < start ){
            resetPosition = realPosition + (slidesCount - clonesCount);
        }else if( realPosition > end ){
            resetPosition = realPosition - (clonesCount + slidesCount);
        }
        if (resetPosition){
            resetPosition = resetPosition % slidesCount;
            if (resetPosition === 0){
                resetPosition = slidesCount;
            }
            realPosition = resetPosition;
        } else {
            realPosition -= clonesCount;
        }
        return realPosition;
    }

    /**
     * Clone slides.
     * @param {jQuery} $slides - slides list.
     * @param {number} start - start position.
     * @param {number} end - end position.
     * @return {jQuery} - cloned slides.
     */
    function cloneSlides($slides, start, end){
        return $slides.slice(start, end).clone(true, true).addClass('slide-clone');
    }

    addWorker('disable', ['settings'], function(){
        this.$stage.find('.slide-clone').remove();
    }, 0, {
        loop : false
    });

    /*
    *   Check if there is enought slides for loop and enabled or disabled it
    *   Priority 190
    */
    addWorker('checkEnoughtSlides', ['size', 'slides', 'settings'], function(stage){
        var settings = this.settings;
        if (stage.enoughSlides !== settings.workers.loop){
            settings.workers.loop = stage.enoughSlides;
            settings.workers.checkSides = !stage.enoughSlides;
            this.workers = $.fn.sliceSlider.getWorkers(settings.workers);
            return 're-update';
        }
    }, 50, {
        forceLoop : false,
        checkLoop : true
    });

    $.fn.sliceSlider.addRequirement(pluginName);

    /*
    *   Stage slides workers :
    *   - Check enought slides, priority 50
    *   - Set clones count, priority 40 - 55
    *   - Clone slides, priority 56
    *   
    *   Priority 10 - 56
    */
    addWorker('storeOriginalSlides', ['slides', 'settings'], function(stage, cache){
        stage.$originalSlides = stage.$slides;
        cache.forceClone = true;
    }, 40);
    $.fn.sliceSlider.addRequirement('fixedsize');
    addWorker('cacheCloneCount', ['size', 'slides', 'settings'], function(stage, cache){
        cache.clonesCount = stage.viewportSize / cache.slideSize;
    }, 40);
    addWorker('checkEnoughtSlides', ['size', 'slides', 'settings'], function(stage, cache){
        if (!stage.slidesCount){
            var settings = this.settings;
            // if not enought slides - disable loop and re-update
            settings.workers.loop = false;
            settings.workers.checkSides = true;
            this.workers = $.fn.sliceSlider.getWorkers(settings.workers);
            return 're-update';
        }
        if (!stage.enoughSlides){
            cache.clonesCount += stage.slidesCount - stage.minSlides;
        }
    }, 50, 'forceLoop');
    addWorker('setClonesCount', ['size', 'slides', 'settings'], function(stage, cache){
        stage.clonesCount = Math.ceil(cache.clonesCount) + 1; // add extra clone
    }, 55);
    $.fn.sliceSlider.removeRequirement('fixedsize');
    addWorker('cloneSlides', ['size', 'slides', 'settings'], function(stage, cache){
        var context = this,
            $stage = context.$stage;
        // check if need to create clones
        if (!cache.forceClone && context.$stage.find('.slide-clone').length === stage.clonesCount * 2){
            return;
        }
        var $originalSlides = stage.$originalSlides;
        // if somehow there is infinite number of clones set it to the number of slides
        if (!isFinite(stage.clonesCount)){
            stage.clonesCount = $originalSlides.length;
        }
        stage.enoughSlides = true;
        stage.clonesStart = stage.clonesCount + 1;
        stage.clonesEnd = stage.slidesCount + stage.clonesCount;
        context.$stage.find('.slide-clone').remove();

        // create prepend clones
        var $slides = $([]),
            count = stage.clonesCount;
        while(count > stage.slidesCount){
            $slides = $slides.add( cloneSlides($originalSlides, 0, stage.slidesCount) );
            count -= stage.slidesCount;
        }
        $slides = cloneSlides($originalSlides, -count).add($slides);
        $slides.each(function(i, el){
            $(el).attr('data-slice-index', i - stage.clonesCount + 1);
        });
        $stage.prepend($slides);
        stage.$slides = $slides.add($originalSlides);

        // add append clones
        $slides = $([]);
        count = stage.clonesCount;
        while(count > stage.slidesCount){
            $slides = $slides.add( cloneSlides($originalSlides, 0, stage.slidesCount) );
            count -= stage.slidesCount;
        }
        $slides = $slides.add( cloneSlides($originalSlides, 0, count) );
        $slides.each(function(i, el){
            $(el).attr('data-slice-index', i + stage.slidesCount + 1);
        });
        $stage.append($slides);
        stage.$slides = stage.$slides.add($slides);
    }, 56);

    /*
    *   Move slider to non-cloned slide position
    *   Priority 190
    */
    addWorker('clonedCheckPosition', ['translated'], function(stage){
        if (stage.resetPosition){
            this.reset(this.currentPosition);
        }
    }, 190);

    /*
    *   Calculate slide movement workers:
    *   - Calculate move to position, priority 200 - 250
    *   - Calculate current/active positions, priority 250 - 280
    *   - Calculate real positions, priority 280 - 290
    *   
    *   Priority 200 - 299
    */
    addWorker('moveToPosition', ['reset', 'move'], function(stage, cache){
        var clonedPosition = stage.clonesCount + cache.moveToPosition;
        cache.moveToPosition = getRealPosition(clonedPosition, stage.slidesCount, stage.clonesCount, stage.clonesStart, stage.clonesEnd);
        cache.clonedDiff = clonedPosition - cache.moveToPosition;
        cache.fromPosition = stage.clonesCount + cache.fromPosition;
    }, 210);
    addWorker('adjustPositions', ['reset', 'move'], function(stage, cache){
        cache.realPosition += cache.clonedDiff;
        cache.currentPosition += cache.clonedDiff;
        cache.activePosition += cache.clonedDiff;
        cache.activePositionEnd += cache.clonedDiff;
        stage.resetPosition = cache.realPosition < stage.clonesStart || cache.realPosition > stage.clonesEnd;
    }, 271);

    // slide relative runnables
    $.fn.sliceSlider.setRunnableType('slidePosition');

    /*
    *   Get next/previous position runnable:
    *   - set position, priority 0 - 10
    *   - calculate next/previous position, priority 20 - 50
    *   
    *   Priority 0 - 30
    */
    addRunnable('normalizePosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        var clonedPosition = stage.clonesCount + cache.position;
        cache.position = getRealPosition(clonedPosition, stage.slidesCount, stage.clonesCount, stage.clonesStart, stage.clonesEnd);
        cache.clonedDiff = clonedPosition - cache.position;
    }, 5);
    addRunnable('checkNext', ['getNextPosition'], function(stage, cache){
        if (cache.position >= stage.lastSlide){
            cache.result = stage.startSlide;
            cache.clonedDiff += stage.slidesCount;
        }
    }, 30);
    addRunnable('checkPrev', ['getPrevPosition'], function(stage, cache){
        if (cache.position <= stage.startSlide){
            cache.result = stage.lastSlide;
            cache.clonedDiff -= stage.slidesCount;
        }
    }, 30);
    addRunnable('normalizePosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        var clonedPosition = stage.clonesCount + cache.result;
        cache.result = getRealPosition(clonedPosition, stage.slidesCount, stage.clonesCount, stage.clonesStart, stage.clonesEnd);
    }, 30);

    /*
    *   Get closest slide position runnable:
    *   - set/calculate coordinate, priority 0 - 9
    *   - set closest calculation function, priority 10
    *   - calculate closest position, priority 20 - 40
    *   
    *   Priority 0 - 30
    */
    addRunnable('normilizeClosest', ['closest', 'closestNext', 'closestPrev'], function(stage, cache){
        var clonedPosition = cache.result;
        cache.result = getRealPosition(clonedPosition, stage.slidesCount, stage.clonesCount, stage.clonesStart, stage.clonesEnd);
        cache.clonedDiff = clonedPosition - cache.result;
        cache.ignoreLast = true;
    }, 30);

    /*
    *   Normilize next/previous/closest position runnable:
    *   Priority 50
    */
    addRunnable('realPosition', ['getNextPosition', 'getPrevPosition', 'closest', 'closestNext', 'closestPrev'], function(stage, cache){
        // exclude cloned slides
        cache.result += cache.clonedDiff - stage.clonesCount;
    }, 50);

    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.removeRequirement(pluginName);

    $.fn.sliceSlider.Plugins.SliceLoop = SliceLoop;
    $.fn.sliceSlider.resetPluginName();
}));