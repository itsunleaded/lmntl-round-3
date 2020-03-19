/* global jQuery */

/**
 * Slice Navigation Plugin
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

    $.fn.sliceSlider.setPluginName('navigation');
    var addWorker = $.fn.sliceSlider.addWorker;

    var pluginDefaults = {
        navClass : false, // slider navigation class

        arrows : false, // enable/disable arrows navigation
        arrowsLayer : false, // put arrows at some layer
        arrowClass : 'slice-arrow', // arrows navigation
        prevArrow : '<a href="#" class="slice-prev">&lsaquo;</a>', // 'Previous' arrow element
        nextArrow : '<a href="#" class="slice-next">&rsaquo;</a>', // 'Next' arrow element
        arrowsContainer : false, // Element to attach arrows
        arrowsSlidesToScroll : false, // if set to false than scroll default ammount of slides

        dots : false, // enable/disable dots navigation
        dotsLayer : false, // put arrows at some layer
        dotElement : '<a href="#" class="slice-dot"></a>', // 'Dot' element
        dotsContainer : '<div class="slice-dots"></div>', // Element to attach dots
        dotsSlidesToScroll : false // if set to false than scroll default ammount of slides
    };

    /**
     * Normilize slide position in carousel.
     * @param {number} position - position.
     * @param {number} start - start position.
     * @param {number} end - end position.
     * @param {number} step - slides step.
     * @return {number} - normalized position.
     */
    function normalizePosition(position, start, end, step){
        if (position >= end){
            return end;
        }else if (position <= start){
            return start;
        }

        var checkPosition = position > start ? position - (start - 1) : 1,
            pagePosition = start + step * (Math.ceil( checkPosition / step) - 1);

        if (pagePosition > end){
            pagePosition = end;
        } else if (pagePosition < start){
            pagePosition = start;
        }
        
        return pagePosition;
    }

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    function SliceNavigation(slice){
        this.slice = slice;
        this.cache = {};
        $.extend(slice.defaults, pluginDefaults);
    }

    /**
     * Setup settings.
     * @param {array} settings - event object.
     */
    SliceNavigation.prototype.setup = function (){
        var context = this,
            settings = context.slice.settings;
        // if no arrows - disable arrow check worker
        settings.workers.arrows = !!settings.arrows;
        // if no dots navigation - disable dots navigation check worker
        settings.workers.dots = !!settings.dots;
        if (settings.navClass){
            context.slice.stage.sliderClasses.push(settings.navClass);
        }
        return context;
    };

    /**
     * Show/hide navigation arrows.
     * @param {Boolean} value - enable/disable navigation arrows.
     */
    SliceNavigation.prototype.enableArrows = function (value){
        var context = this,
            stage = context.slice.stage,
            hiddenClass = context.slice.settings.hiddenClass
        ;
        context.checkArrows(value);
        if( stage.$arrowsContainer ){
            stage.$arrowsContainer.toggleClass(hiddenClass, !value);
        }
        if( stage.$prevArrow ){
            stage.$prevArrow.toggleClass(hiddenClass, !value);
        }
        if( stage.$nextArrow ){
            stage.$nextArrow.toggleClass(hiddenClass, !value);
        }
        return context;
    };

    /**
     * Check element by 'prop' settings and create it if needed.
     * @param {String} prop - property name to check.
     * @param {SliceNavigation} context - the SliceNavigation instance.
     * @param {Boolean} create - forcefuly create container.
     * @param {jQuerry} $container - container element, if any.
     */
    function checkElement(prop, context, create, $container){
        var $prop = '$' + prop,
            slice = context.slice,
            settings = slice.settings,
            apply = false,
            cache = false,
            $element
        ;

        // hide curent element
        if (context[$prop]){
            context[$prop].addClass(settings.hiddenClass);
            context[$prop] = null;
        }
        if (!settings[prop]){
            return;
        }

        // check cache
        if (context.cache[prop]){
            for (var i = 0; i < context.cache[prop].length; i++) {
                if (context.cache[prop][i].value === settings[prop]){
                    $element = context.cache[prop][i].$element;
                    apply = cache = true;
                }
            }
        }

        // check and create if needed
        if( cache ){
            ($container || context.slice.$element).append($element);
        } else {
            $element = $(settings[prop]);
            if( !(apply = $('body').find($element).length) && create ){
                ($container || context.slice.$element).append($element);
            }
        }

        // store element if created
        if (apply || create){
            // add to cache
            if (!cache){
                if (!context.cache[prop]){
                    context.cache[prop] = [];
                }
                context.cache[prop].push({
                    value : settings[prop],
                    $element : $element
                });
            }
            context[$prop] = $element;
            slice.stage[$prop] = $element;
            return $element;
        }
    }

    /**
     * Check arrow element by 'prop' settings and create it if needed.
     * @param {String} prop - property name to check.
     * @param {SliceNavigation} context - the SliceNavigation instance.
     * @param {Boolean} create - forcefuly create container.
     * @param {Function} handler - click event handler.
     */
    function checkArrow(prop, context, create, handler){
        var slice = context.slice,
            container = slice.stage.$arrowsContainer && slice.stage.$arrowsContainer.length ?
                slice.stage.$arrowsContainer :
                (slice.settings.arrowsLayer ? slice.layers[slice.settings.arrowsLayer].$element : false);
        if( checkElement(prop, context, create, container) ){
            slice.stage['$' + prop]
                .addClass(slice.settings.arrowClass)
                .data('slice.slider', slice)
                .off('.slice.navigation')
                .on('click.slice.navigation', handler);
        }
    }

    /**
     * Check navigation arrows settings and create navigation arrows if needed.
     * @param {Boolean} create - forcefuly create navigation arrows.
     */
    SliceNavigation.prototype.checkArrows = function (create){
        var context = this,
            slice = context.slice,
            settings = slice.settings
        ;
        if( !settings ){
            return context;
        }

        if ( settings.arrowsContainer === true ){
            settings.arrowsContainer = '<div class="slice-arrows"/>';
        }

        checkElement('arrowsContainer', context, create, settings.arrowsLayer ? slice.layers[settings.arrowsLayer].$element : false);

        checkArrow('prevArrow', context, create, function(e){
            e.preventDefault();
            var $el = $(this);
            if( !$el.hasClass(settings.disabledClass) ){
                var slider = $el.data('slice.slider');
                if (slider.settings.arrowsSlidesToScroll){
                    slider.to(slider.currentPosition - slider.settings.arrowsSlidesToScroll);
                }else{
                    slider.prev();
                }
            }
        });
        checkArrow('nextArrow', context, create, function(e){
            e.preventDefault();
            var $el = $(this);
            if( !$el.hasClass(settings.disabledClass) ){
                var slider = $el.data('slice.slider');
                if (slider.settings.arrowsSlidesToScroll){
                    slider.to(slider.currentPosition + slider.settings.arrowsSlidesToScroll);
                }else{
                    slider.next();
                }
            }
        });
        
        return context;
    };

    /**
     * Show/hide dots navigation.
     * @param {Boolean} value - enable/disable dots navigation.
     */
    SliceNavigation.prototype.enableDots = function (value){
        var context = this,
            stage = context.slice.stage
        ;
        context.checkDots(value);
        if( stage.$dotsContainer ){
            stage.$dotsContainer.toggleClass(context.slice.settings.hiddenClass, !value);
        }
        return context;
    };

    /**
     * Check dots navigation settings and create dots navigation if needed.
     * @param {Boolean} create - forcefuly create dots navigation.
     */
    SliceNavigation.prototype.checkDots = function (create){
        var context = this,
            slice = context.slice,
            settings = slice.settings,
            stage = slice.stage
        ;

        checkElement('dotsContainer', context, create, settings.dotsLayer ? slice.layers[settings.dotsLayer].$element : false);
        if( stage.$dotsContainer ){
            stage.$dotsContainer.data('slice.slider', context.slice);
            stage.$dotElement = $(settings.dotElement).detach();
        }
        return context;
    };

    /*
    *   Setup navigation worker.
    *   Priority 0
    */
    addWorker('setup', ['settings'], function(stage, cache){
        cache.layers = cache.layers || {};
        if (this.settings.arrowsLayer){
            cache.layers['slice-arrows-layer'] = this.settings.arrowsLayer;
        }
        if (this.settings.dotsLayer){
            cache.layers['slice-dots-layer'] = this.settings.dotsLayer;
        }
    }, -10);
    addWorker('setup', ['slides', 'settings'], function(){
        var plugin = this.plugins.sliceNavigation;
        plugin.enableArrows(this.settings.arrows);
        plugin.enableDots(this.settings.dots);
    });   

    /*
    *   Arrows workers
    */
    $.fn.sliceSlider.addRequirement('arrows');
    
    /*
    *   Setup arrows worker.
    *   Priority 90
    */
    addWorker('setupArrows', ['edges', 'slides', 'settings'], function(stage){
        var cssClass = this.settings.disabledClass,
            isDisabled = !stage.enoughSlides;
        stage.$nav = stage.$nav || $([]);
        if( stage.$arrowsContainer ){
            stage.$arrowsContainer.toggleClass(cssClass, isDisabled);
        }
        if( stage.$prevArrow ){
            stage.$nav = stage.$nav.add(stage.$prevArrow);
            stage.$prevArrow.toggleClass(cssClass, isDisabled);
        }
        if( stage.$nextArrow ){
            stage.$nav = stage.$nav.add(stage.$nextArrow);
            stage.$nextArrow.toggleClass(cssClass, isDisabled);
        }
    }, 90);

    /*
    *   Enable/disable arrows worker.
    *   Priority 300
    */
    addWorker('checkArrows', ['reset', 'move'], function(stage){
        var context = this,
            settings = context.settings,
            arrowsSlidesToScroll = settings.arrowsSlidesToScroll;
        if (!stage.enoughSlides){
            return;
        }
        if( stage.$prevArrow ){
            stage.$prevArrow.toggleClass(settings.disabledClass, arrowsSlidesToScroll ? context.currentPosition - arrowsSlidesToScroll <= 0 : stage.isFirstSlide);
        }
        if( stage.$nextArrow ){
            stage.$nextArrow.toggleClass(settings.disabledClass, arrowsSlidesToScroll ? stage.slidesCount < context.currentPosition + arrowsSlidesToScroll : stage.isLastSlide);
        }
    }, 300, 'checkSides');

    $.fn.sliceSlider.removeRequirement('arrows');

    /*
    *   Dots workers
    */
    $.fn.sliceSlider.addRequirement('dots');

    /*
    *   Setup dots container worker
    *   Priority 90
    */
    addWorker('setupDotsContainer', ['settings'], function(stage){
        stage.$nav = (stage.$nav || $([])).add(stage.$dotsContainer);
    }, 90);

    /*
    *   Dots workers:
    *   - calculate start, last dots, priority 110 - 120
    *   - append dots, priority 130
    *   Priority 110 - 130
    */
    addWorker('startLastDots', ['edges', 'slides', 'settings'], function(stage, cache){
        var context = this;
        cache.dotsStep = context.settings.dotsSlidesToScroll || stage.slidesStep || 1;
        cache.dotsStart = 1;
        cache.dotsLast = stage.slidesCount;
    }, 110);
    addWorker('setStartLastDots', ['edges', 'slides', 'settings'], function(stage, cache){
        // check start and last dots
        if (this.settings.dotsSlidesToScroll){
            cache.dotsStart = cache.dotsStart;
            cache.dotsLast = cache.dotsStep * (Math.ceil((cache.dotsLast - cache.dotsStart + 1) / cache.dotsStep) - 1) + cache.dotsStart;
        } else {
            cache.dotsStart = stage.startSlide;
            cache.dotsLast = stage.lastSlide;
        }
        if (cache.dotsStart < 1){
            cache.dotsStart = 1;
        }
        if (cache.dotsLast > stage.slidesCount){
            cache.dotsLast = stage.slidesCount;
        }
        stage.dotsStep = cache.dotsStep;
        stage.dotsStart = cache.dotsStart;
        stage.dotsLast = cache.dotsLast;
    }, 120);
    addWorker('appendDots', ['edges', 'slides', 'settings'], function(stage){
        var context = this,
            $dot = stage.$dotElement,
            cssClass = this.settings.disabledClass,
            isDisabled = !stage.enoughSlides,
            handler = function(e){
                e.preventDefault();
                var $el = $(this);
                if( !$el.hasClass(context.settings.currentClass) ){
                    $el.data('slice.slider').to($el.data('sliceIndex'));
                }
            }
        ;
        stage.$dotsContainer
            .toggleClass(cssClass, isDisabled)
            .empty();

        // create and append dots
        for (var i = stage.dotsStart; i < stage.dotsLast; i += stage.dotsStep) {
            $dot.clone(true, true)
                .attr('data-slice-index', i)
                .data('slice.slider', context)
                .on('click.slice.navigation', handler)
                .appendTo(stage.$dotsContainer);
        }
        $dot.clone(true, true)
            .attr('data-slice-index', stage.dotsLast)
            .data('slice.slider', context)
            .on('click.slice.navigation', handler)
            .appendTo(stage.$dotsContainer);
    }, 130);

    /*
    *   Set active dot worker.
    *   Priority 300 - 310
    */
    addWorker('activeDot', ['reset', 'move'], function(stage, cache){
        cache.activeDot = this.currentPosition;
    }, 300);
    addWorker('setActiveDot', ['reset', 'move'], function(stage, cache){
        cache.activeDot = normalizePosition(cache.activeDot, stage.dotsStart, stage.dotsLast, stage.dotsStep);
        stage.$dotsContainer.find('.' + this.settings.currentClass).removeClass(this.settings.currentClass).trigger('blur');
        stage.$dotsContainer.find('[data-slice-index="' + cache.activeDot + '"]').addClass(this.settings.currentClass);
    }, 310);

    $.fn.sliceSlider.removeRequirement('dots');

    $.fn.sliceSlider.Plugins.SliceNavigation = SliceNavigation;
    $.fn.sliceSlider.resetPluginName();

}));