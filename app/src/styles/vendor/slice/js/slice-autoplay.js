/* global jQuery */

/**
 * Slice Autoplay Plugin
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

    var pluginName = 'autoplay';
    $.fn.sliceSlider.setPluginName(pluginName);

    var addWorker = $.fn.sliceSlider.addWorker;
    var pluginDefaults = {
        autoplay : false, // Enable/disable autoplay
        autoplaySpeed : 5000, // Autoplay speed in milliseconds
        pauseOnNavHover : true, // Pauses autoplay when a navigation (arrows/dots) is hovered
        pauseOnFocus : false, // Pauses autoplay when slider is focussed
        pauseOnHover : true // Pauses autoplay on hover
    };

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceAutoplay = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
        slice
            .register({
                type : $.fn.sliceSlider.Type.State,
                name : 'playing',
                tags : ['autoplay']
            })
            .register({
                type : $.fn.sliceSlider.Type.State,
                name : 'paused',
                tags : ['autoplay', 'holdautoplay', 'hold']
            })
            .register({
                type : $.fn.sliceSlider.Type.State,
                name : 'holdplay',
                tags : ['autoplay', 'holdautoplay', 'hold']
            });
    };

    /**
     * Setup settings.
     * @param {array} settings - event object.
     */
    SliceAutoplay.prototype.setup = function (){
        var context = this,
            settings = context.slice.settings;
        settings.workers.autoplay = !!settings.autoplay;
        if( settings.autoplay ){
            context.tickDelayTime = Math.round(settings.autoplaySpeed / 100);
            // tick delay should be 50 or greater
            if( context.tickDelayTime < 50 ){
                context.tickDelayTime = 50;
            }
            context.play();
        }else{
            context.stop();
        }
    };

    /**
     * Trigger tick event.
     * @param {SliceSlider} slice - the SliceSlider instance
     * @param {Numeric} passed - time passed
     * @param {Numeric} duration - duration
     */
    function triggerTick (slice, passed, duration){
        slice.trigger('autoplaytick', false, {
            passed : passed,
            duration : duration,
            percent : duration / passed
        });
    }

    /**
     * Autoplay timer tick.
     * @param {Numeric} value - tick time, if not - update autoload time
     */
    SliceAutoplay.prototype.tick = function (value){
        var context = this,
            slice = context.slice
        ;
        if( context.tickDelay ){
            clearTimeout(context.tickDelay);
        }
        context.tickTime = value === undefined ? (context.tickTime || 0) + Date.now() - (context.lastTick || Date.now()) : value;
        context.tickTime = slice.settings.autoplaySpeed <= context.tickTime ? slice.settings.autoplaySpeed : context.tickTime;
        triggerTick(slice, context.tickTime, slice.settings.autoplaySpeed);

        // if it's not playing don't do anything else
        if( slice.is('hold') ){
            return context;
        }
        
        // check if it's time to show next slide
        if (slice.settings.autoplaySpeed <= context.tickTime){
            context.tickTime = 0;
            context.lastTick = false;
            slice.next();
        }else{
            context.lastTick = Date.now();
            // set timeout for the next tick
            context.tickDelay = setTimeout($.proxy(function() {
                this.tickDelay = false;
                this.tick();
            }, context), context.tickDelayTime);
        }
        return context;
    };

    /**
     * Restart current delay.
     */
    SliceAutoplay.prototype.restart = function (){
        return this.tick(0);
    };

    /**
     * Reset autoplay.
     */
    SliceAutoplay.prototype.reset = function (){
        var context = this,
            slice = context.slice;
        if (context.tickDelay){
            clearTimeout(context.tickDelay);
        }
        slice.leave('paused');
        context.lastTick = false;
        context.tickTime = 0;
        triggerTick(slice, context.tickTime, slice.settings.autoplaySpeed);
        return context;
    };

    /**
     * Start autoplay.
     */
    SliceAutoplay.prototype.play = function (){
        var context = this,
            slice = context.slice;
        if( slice.is('playing') ){
            return context;
        }
        context.reset();
        slice
            .enter('playing')
            .trigger('play');
        context.tick();
        return context;
    };

    /**
     * Stop autoplay.
     */
    SliceAutoplay.prototype.stop = function (){
        var context = this;
        if (context.slice.is('autoplay')){
            context.slice.leave('playing');
            context.reset();
            context.slice.trigger('stop');
        }
        return context;
    };

    /**
     * Check slider state to continue autoplay or pause it.
     * @param {SliceAutoplay} context - the SliceAutoplay instance
     */
    function checkPlay(context){
        if( context.slice.is('holdautoplay') ){
            context.lastTick = false;
            if( context.tickDelay ){
                clearTimeout(context.tickDelay);
            }
        }else{
            context.tick();
        }
    }

    /**
     * Toggle pause/continue autoplay.
     * @param {boolean} value - if set defines pause/continue state
     */
    SliceAutoplay.prototype.toggle = function (value){
        var context = this,
            slice = context.slice,
            toggle = arguments.length > 0 ? !!value : slice.is('paused');
        if (!slice.is('autoplay') || slice.is('playing') === toggle){
            return context;
        }
        if (toggle){
            slice
                .leave('paused')
                .enter('playing')
                .trigger('continue');
        }else{
            slice
                .leave('playing')
                .enter('paused')
                .trigger('pause');
        }
        checkPlay(context);
        return context;
    };

    /**
     * Pause autoplay.
     */
    SliceAutoplay.prototype.pause = function (){
        return this.toggle(false);
    };

    /**
     * Continue autoplay.
     */
    SliceAutoplay.prototype.continue = function (){
        return this.toggle(true);
    };

    /**
     * Hold autoplay.
     */
    SliceAutoplay.prototype.hold = function (){
        var context = this,
            slice = context.slice;
        if (slice.is('autoplay')){
            slice.enter('holdplay');
            checkPlay(context);
        }
        return context;
    };

    /**
     * Try to release autoplay, i.e. there could be multiple holdplay requests.
     */
    SliceAutoplay.prototype.release = function (){
        var context = this,
            slice = context.slice;
        if (slice.is('autoplay')){
            slice.leave('holdplay');
            checkPlay(context);
        }
        return context;
    };

    $.fn.sliceSlider.addRequirement(pluginName);

    /*
    *   Restart timer for next slide
    *   Priority 190
    */
    addWorker('restartTimer', ['translated'], function(stage){
        if (this.is('playing') && (this.settings.loop || this.settings.rewind || !stage.isLastSlide) ){
            this.plugins.sliceAutoplay.restart();
        }
    }, 190);


    /*
    *   Bind events
    *   Priority 190
    */
    addWorker('pauseEvents', ['slides', 'settings'], function(stage){
        var context = this,
            $nav = stage.$nav || $([]);
        $nav.off('.autoplay');
        context.$element.off('.autoplay');
        if (context.is('playing')){
            var settings = context.settings,
                holdFn = function (){
                    $(this).data('slice.slider').plugins.sliceAutoplay.hold();
                },
                releaseFn = function (){
                    $(this).data('slice.slider').plugins.sliceAutoplay.release();
                }
            ;
            if (settings.pauseOnNavHover){
                $nav.on({
                    'mouseenter.slice.autoplay' : holdFn,
                    'mouseleave.slice.autoplay' : releaseFn
                });
            }
            if (settings.pauseOnHover){
                context.$element.on({
                    'mouseenter.slice.autoplay' : holdFn,
                    'mouseleave.slice.autoplay' : releaseFn
                });
            }
            if (settings.pauseOnFocus){
                context.$element.on({
                    'focusin.slice.autoplay' : holdFn,
                    'focusout.slice.autoplay' : releaseFn
                });
            }
        }
    }, 90);

    $.fn.sliceSlider.removeRequirement(pluginName);

    $.fn.sliceSlider.Plugins.SliceAutoplay = SliceAutoplay;
    $.fn.sliceSlider.resetPluginName();
}));