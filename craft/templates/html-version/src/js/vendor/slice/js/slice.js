/* global jQuery, console */

/**
 * Slice Slider
 * Core Scripts
 * @version 1.0
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

    var sliceDefaults = {
        theme : false, // slider theme
        sliderClass : false, // slider root elelemnt class
        viewLayer : 1, // viewport layer index
        viewLayerClass : 'slice-view-layer', // viewport layer class
        slideElement : 'div', // slide element
        slideClass : 'slice-slide',
        stageElement : 'div', // stage element
        stageClass : 'slice-stage',
        viewportClass : 'slice-viewport', // viewport class
        notEnoughtSlidesClass : 'slice-not-enought-slides', // not enought slides class
        currentClass : 'slice-current', // current class
        activeClass : 'slice-active', // active class
        hiddenClass : 'slice-hidden', // hidden class
        disabledClass : 'slice-disabled', // disabled class
        spacing : false, // slides spacing, allowed units %, px
        staticHeight : true, // sets slider height based on maximum slide height
        fallbackEasing : 'swing', // slide change animation easing function
        speed : 500, // slide change animation speed
        waitForAnimate : true, // ignores requests to advance the slide while animating
        rewind : false, // go backwards when the boundary has reached.
        focusOnSelect : false // enable/disable on click slide change
    };

    // list of CSS properties
    var cssProps = {
        height : 'height',
        width : 'width'
    };

    /**  Theme  **/
    var themes = {};

    /**
     * Create theme options object
     * @param {String} name - theme name.
     * @param {Object} options - theme options.
     * @return {Object} theme options
     */
    function createThemeOptions(name, options){
        return $.extend(options, {
            name : name,
            class : options.hasOwnProperty('class') ? options.class : 'slice-theme-' + name,
            defaults : options.defaults || false,
            setup : typeof options.setup === 'function' ? options.setup : false
        });
    }

    /**
     * Add theme
     * @param {String} name - theme name.
     * @param {Object} options - theme options.
     */
    function addTheme(name, options){
        if (themes[name]){
            if (window.console){
                console.warn("Slice: '" + name + "' theme already exists.");
            }
            return;
        }
        themes[name] = createThemeOptions(name, options);
    }

    /**
     * Remove theme
     * @param {String} name - theme name.
     */
    function removeTheme(name){
        if (themes.hasOwnProperty(name)){
            delete themes[name];
        }
    }

    /**
     * Get theme
     * @param {String} name - theme name.
     * @return {Object} theme options
     */
    function getTheme(name){
        return themes[name] || false;
    }



    /**  Workers  **/

    /**
     * Preset Plugin name.
     */
    var pluginName = false;

    /**
     * Add single default requirement for workers.
     * @param {String} name - Plugin name.
     */
    function setPluginName(name){
        pluginName = '_' + name;
    }

    /**
     * Reset plugin name.
     */
    function resetPluginName(){
        pluginName = false;
    }

    /**
     * Default requirements.
     */
    var presetRequirements = {};
    var presetRequirementsCount = 0;

    /**
     * Add single default requirement for workers.
     * @param {String} requirement - Worker required state/states list.
     * @param {Boolean} enabled - The enable/disable state.
     */
    function addSingleRequirement(requirement, enabled){
        if (!presetRequirements.hasOwnProperty(requirement)){
            ++presetRequirementsCount;
        }
        presetRequirements[requirement] = enabled;
    }

    /**
     * Remove single default requirement for workers.
     * @param {String} requirement - Worker required state/states list.
     * @param {Boolean} enabled - The enable/disable state.
     */
    function removeSingleRequirement(requirement, enabled){
        if (presetRequirements.hasOwnProperty(requirement) && presetRequirements[requirement] === enabled){
            delete presetRequirements[requirement];
            --presetRequirementsCount;
        }
    }

    /**
     * Add default requirements for workers.
     * @param {String|Object} requirement - worker required state/states list.
     */
    function addRequirement(requirement){
        if (typeof requirement === 'string'){
            addSingleRequirement(requirement, true);
        } else if (typeof requirement === 'object'){
            $.each(requirement, function(req, enabled){
                addSingleRequirement(req, enabled);
            });
        }
    }

    /**
     * Remove default requirements for workers.
     * @param {String|Object} requirement - worker required state/states list.
     */
    function removeRequirement(requirement){
        if (typeof requirement === 'string'){
            removeSingleRequirement(requirement, true);
        } else if (typeof requirement === 'object'){
            $.each(requirement, function(req, enabled){
                removeSingleRequirement(req, enabled);
            });
        }
    }

    /**
     * Reset default requirements for workers.
     */
    function resetRequirements(){
        presetRequirements = {};
        presetRequirementsCount = 0;
    }

    /**
     * Create worker.
     * @param {String} name - The worker name.
     * @param {Boolean|String|Object} enabled - The enable/disable worker state/requirements list.
     * @param {Array} keys - The worker keys.
     * @param {Function} fn - The worker funtion to run.
     * @param {Number} [priority] - The worker priority, of not set - 0.
     */
    function createWorker(name, keys, fn, priority, enabled){
        if( typeof fn !== 'function' ){
            return false;
        }
        var enabledType = typeof enabled,
            enabledNormilized, enabledAt
        ;
        if (presetRequirementsCount || enabledType === 'string' || enabledType === 'object'){
            enabledAt = $.extend({}, presetRequirements);
            enabledNormilized = false;
            if (enabledType === 'string'){
                enabledAt[enabled] = true;
            } else if (enabledType === 'object'){
                enabledAt = $.extend(enabledAt, enabled);
            }
        } else {
            enabledNormilized = enabled === undefined ? true : enabled;
            enabledAt = false;
        }
        return {
            name : name + (pluginName ? pluginName : '' ),
            enabled : enabledNormilized,
            enabledAt : enabledAt,
            keys : keys === true ? true : (Array.isArray(keys) ? keys : []),
            run : fn,
            priority : priority || 0
        };
    }

    /**
     * Workers list.
     */
    var workersList = [];

    /**
     * Runnable workers.
     */
    var runWorkers = {};

    /**
     * Add worker.
     * @param {String} name - The worker name.
     * @param {Boolean|String|Object} enabled - The enable/disable worker state/requirements list.
     * @param {Array} keys - The worker keys.
     * @param {Function} fn - The worker funtion to run.
     * @param {Number} [priority] - The worker priority, of not set - 0.
     */
    function addWorker(name, keys, fn, priority, enabled){
        var worker = createWorker(name, keys, fn, priority, enabled);
        if (worker){
            workersList.push(worker);
        }
    }

    /**
     * Preset runnable type.
     */
    var runnableType = false;

    /**
     * Set runnable type
     * @param {String} name - Plugin name.
     */
    function setRunnableType(name){
        runnableType = '' + name;
    }

    /**
     * Reset plugin name.
     */
    function resetRunnableType(){
        runnableType = false;
    }

    /**
     * Preset runnable type.
     */
    var quickRunList = {};

    /**
     * Set/Add quick callable runnuble.
     * @param {String} name - the quick runnable name.
     * @param {Array} keys - the worker keys.
     * @param {String} [workerType] - the worker type, of not set or true - core workers.
     */
    function setQuickRun(name, keys, workerType){
        quickRunList[name] = {
            keys : keys === true ? true : (Array.isArray(keys) ? keys : []),
            type : !(workerType || runnableType) || workerType === true ? '_' : workerType || runnableType
        };
    }

    /**
     * Remove quick callable runnuble.
     * @param {String} name - the quick runnable name.
     */
    function removeQuickRun(name){
        if (quickRunList[name]){
            delete quickRunList[name];
        }
    }

    /**
     * Add runnable worker.
     * @param {String} name - The worker name.
     * @param {Boolean|String|Object} enabled - The enable/disable worker state/requirements list.
     * @param {Array} keys - The worker keys.
     * @param {Function} fn - The worker funtion to run.
     * @param {Number} [priority] - The worker priority, of not set - 0.
     * @param {String} [workerType] - The worker type, of not set or true - core workers.
     */
    function addRunnable(name, keys, fn, priority, enabled, workerType){
        var worker = createWorker(name, keys, fn, priority, enabled),
            type = !(workerType || runnableType) || workerType === true ? '_' : workerType || runnableType;
        if (!worker){
            return;
        }
        if (!runWorkers[type]) {
            runWorkers[type] = [];
        }
        runWorkers[type].push(worker);
    }

    /**
     * Filter workers.
     * @param {Object} workersList - list of workers.
     * @param {Object} settings - workers settings.
     */
    function filterWorkers(workersList, settings){
        var workers;
        if(settings){
            workers = workersList.filter(function(worker){
                if (settings.hasOwnProperty(worker.name)){
                    return !!settings[worker.name];
                }
                var enabled = worker.enabled;
                if (worker.enabledAt){
                    enabled = true;
                    $.each(worker.enabledAt, function(at, val){
                        var check = !!settings[at];
                        if (val !== check ){
                            enabled = false;
                            return false;
                        }
                    });
                }
                return enabled;
            });
        } else {
            workers = workersList.slice(0);
        }
        workers.sort(function(item1, item2){
            return item1.priority - item2.priority;
        });
        return workers;
    }

    /**
     * Get workers.
     * @param {Object} settings - workers settings.
     */
    function getWorkers(settings){
        var workers = {
            list : filterWorkers(workersList, settings),
            run : {}
        };
        $.each(runWorkers, function (key, list){
            workers.run[key] = filterWorkers(list, settings);
        });
        return workers;
    }

    /**
     * Parse options.
     * @param {variable} val - workers settings.
     */
    function parseOptions(val){
        var valType = typeof val,
            ret = {};
        if (valType === 'string'){
            $.each(val.split(';'), function (i, str){
                var keyVal = str.split(':'),
                    key = keyVal[0].trim();
                if (!key){
                    return;
                }
                if (keyVal.length === 1){
                    ret[key] = true;
                } else {
                    var rawVal = keyVal.slice(1).join(':');
                    try {
                        ret[key] = JSON.parse(rawVal);
                    } catch (e) {
                        ret[key] = rawVal.trim();
                    }
                }
            });
        } else if (valType === 'object'){
            return val;
        }
        return ret;
    }

    

    /***    Parse units    ***/

    /**
     * RegExp to parse px, % units 
     */
    var regularExp = new RegExp("^((?:\\+|\\-)?[0-9]+(\\.[0-9]+)?)(.*)$");

    /**
     * Parse value to unit type.
     * @param {String|integer} value - the value to transform to pixels
     * @return Object {value, type}
     */
    function toUnitType(value){
        var unitType = {
            value : 0,
            type : 'px'
        };
        if (typeof value === 'string'){
            var result = value.match(regularExp),
                number = Math.floor(result[1] ? Number(result[1]) : 0);
            switch (result[3]){
                case '%':
                    unitType.value = number;
                    unitType.type = result[3];
                    unitType.scale = number / 100;
                    break;
                case 'px':
                    unitType.value = number;
                    unitType.type = result[3];
                    break;
                default :
                    if (result[3] === ''){
                        unitType.value = number;
                    }
                    break;
            }
        }else{
            unitType.value = value;
        }
        return unitType;
    }

    /**
     * From value to pixels.
     * @param {String|integer} value - the value to transform to pixels
     * @param {String|integer} baseValue - the value to take percent from
     */
    function toPx(value, baseValue){
        var pxVal = 0;
        if (typeof value === 'string'){
            var result = value.match(regularExp),
                number = Math.floor(result[1] ? Number(result[1]) : 0);
            switch (result[3]){
                case '%':
                    pxVal = number * baseValue / 100;
                    break;
                case 'px':
                    pxVal = number;
                    break;
                default :
                    if (result[3] === ''){
                        pxVal = number;
                    }
                    break;
            }
        }else{
            pxVal = value;
        }
        return pxVal;
    }

    /**
     * From value to pixels.
     * @param {String|integer} value - the value to transform to pixels
     * @param {String|integer} resValue - the value to reverce the percentage
     */
    function revPx(value, resValue){
        var pxVal = 0;
        if (typeof value === 'string'){
            var result = value.match(regularExp),
                number = Math.floor(result[1] ? Number(result[1]) : 0);
            switch (result[3]){
                case '%':
                    pxVal = number * resValue / (100 - number);
                    break;
                case 'px':
                    pxVal = number;
                    break;
                default :
                    if (result[3] === ''){
                        pxVal = number;
                    }
                    break;
            }
        }else{
            pxVal = value;
        }
        return pxVal;
    }

    /**
     * Creates a slider.
     * @class The Slice Slider
     * @param {HTMLElement|jQuery} element - The element to create the slider for
     * @param {Object} [options] - The options
     */
    function SliceSlider(element, options) {
        var context = this;

        /**
         * Current settings for the slider.
         */
        context.settings = null;

        /**
         * Current stage.
         */
        context.stage = null;

        /**
         * Slider element.
         */
        context.$element = $(element);

        /**
         * Slider layers.
         */
        context.layers = {};

        /**
         * Slider layers count.
         */
        context.layersCount = {};


        /**
         * Default options.
         */
        context.defaults = $.extend({},
            sliceDefaults,
            $.fn.sliceSlider.Defaults || {}
        );

        /**
         * Current options set by the caller including defaults.
         */
        context.options = $.extend({},
            options || {},
            options && options.optionsProvider ? parseOptions(context.$element.data(options.optionsProvider)) : {}
        );

        /**
         * Current slide index.
         */
        context.currentPosition = 1;

        /**
         * Animation speed in milliseconds.
         */
        context.speed = 0;

        /**
         * Move to slide index.
         */
        context.moveToPosition = false;

        /**
         * Viewport element.
         */
        context.$viewport = $([]);

        /**
         * Stage element.
         */
        context.$stage = $([]);

        /**
         * Slider items.
         */
        context.$slides = $([]);

        /**
         * References to the running plugins of this slider.
         */
        context.plugins = {};

        /**
         * Invalidated parts within the update process.
         */
        context.invalidated = {};

        /**
         * Collection of ordered list of workers.
         */
        context.workers = {};

        /**
         * Current state information and their tags.
         */
        context.states = {
            current: {},
            tags: {
                'setup' : ['busy'],
                'initializing': ['busy'],
                'animating': ['busy', 'hold']
            }
        };

        context.enter('setup');

        // add plugins
        $.each($.fn.sliceSlider.Plugins, function(key, Plugin) {
            context.plugins[key.charAt(0).toLowerCase() + key.slice(1)] = new Plugin(context);
        });

        // pre setup
        $.each(context.plugins, function(key, plugin) {
            if( typeof plugin.preSetup === 'function' ){
                plugin.preSetup();
            }
        });

        // setup if not done setup already
        if( context.is('setup') ){
            var theme = getTheme(context.options.theme || context.defaults.theme);
            context.setup($.extend({}, $.extend({},
                context.defaults,
                theme && theme.defaults ? theme.defaults : {},
                context.options
            )));
            context.leave('setup');
        }

        context.run('initialize', null, 'initialize');
    }

    /**
     * Slider version.
     */
    SliceSlider.prototype.version = '1.0';

    /**
     * Registers an event or state.
     * @param {Object} object - The object to register.
     */
    SliceSlider.prototype.register = function(object) {
        var context = this;
        if (object.type === $.fn.sliceSlider.Type.State) {
            if (!context.states.tags[object.name]) {
                context.states.tags[object.name] = object.tags;
            } else {
                context.states.tags[object.name] = context.states.tags[object.name].concat(object.tags);
            }

            context.states.tags[object.name] = $.grep(context.states.tags[object.name], function(tag, i) {
                return $.inArray(tag, context.states.tags[object.name]) === i;
            });
        }
        return context;
    };

    /**
     * Setups the current settings.
     * @param {String} name - event name
     * @param {String} [namespace] - event namespace
     * @param {Array} [data] - event namespace
     */
    SliceSlider.prototype.trigger = function(name, namespace, data){
        var context = this,
            event = $.Event(
                [ name, 'slice', namespace || 'slider' ].join('.').toLowerCase(),
                $.extend({ relatedTarget: context }, data)
            );
        
        context.$element.trigger(event);
        return event;
    };
    
    /**
     * Checks whether the slider is in a specific state or not.
     * @param {String} state - The state to check.
     * @returns {Boolean} - The flag which indicates if the slider is busy.
     */
    SliceSlider.prototype.is = function(state) {
        return this.states.current[state] && this.states.current[state] > 0;
    };

    /**
     * Enters a state.
     * @param name - The state name.
     */
    SliceSlider.prototype.enter = function(name) {
        var context = this;
        $.each([ name ].concat(context.states.tags[name] || []), function(i, name) {
            if (context.states.current[name] === undefined) {
                context.states.current[name] = 0;
            }

            context.states.current[name]++;
        });
        return context;
    };

    /**
     * Leaves a state.
     * @param name - The state name.
     */
    SliceSlider.prototype.leave = function(name) {
        var context = this;
        if (context.is(name)){
            $.each([ name ].concat(context.states.tags[name] || []), function(i, name) {
                context.states.current[name]--;
            });
        }
        return context;
    };

    /**
     * Setups the current settings.
     */
    SliceSlider.prototype.setup = function(settings){
        var context = this,
            theme = getTheme(settings.theme);
        settings.workers = settings.workers || {
            spaced : !!settings.spacing,
            staticHeight : !!settings.staticHeight,
            checkSides : !settings.rewind,
            rewind : settings.rewind,
            focusOnSelect : settings.focusOnSelect,
            horizontal : true,
            fixedsize : true,
            fixedslides : true,
            fixedheight : false,
            single : true
        };
        if (context.stage && context.stage.sliderClasses.length){
            context.$element.removeClass(context.stage.sliderClasses.join(' '));
        }
        context.stage = {
            sliderClasses : []
        };
        context.settings = settings;
        // Setup plugin
        $.each(context.plugins, function(name, plugin) {
            if (plugin.setup) {
                plugin.setup();
            }
        });
        if (settings.sliderClass){
            context.stage.sliderClasses.push(settings.sliderClass);
        }
        if (settings.focusOnSelect){
            context.stage.sliderClasses.push('slice-focus-on-select');
        }
        // Setup theme
        if (theme){
            context.stage.theme = theme;
            if (theme.sliderClass){
                context.stage.sliderClasses.push(theme.sliderClass);
            }
            if (typeof theme.setup === 'function'){
                theme.setup.call(context);
            }
        }
        if (context.stage.sliderClasses.length){
            context.$element.addClass(context.stage.sliderClasses.join(' '));
        }
        // All settings are set
        context.workers = getWorkers(context.settings.workers);
        context.invalidate('settings');
        context.trigger('change');
        return context;
    };

    /**
     * Prepares a slide before add.
     * @param {HTMLElement|jQuery|String} content - slide content
     * @returns {jQuery|HTMLElement} - slide container.
     */
    SliceSlider.prototype.prepare = function(content) {
        var context = this,
            event = context.trigger('prepare', false, { content: content }),
            $slide = $('<' + context.settings.slideElement + '/>')
                        .addClass(context.settings.slideClass)
                        .append(event.content);

        if (context.resizeHandler){
            $slide.find('[src], [data-src]').on('load.slice.slider', context.resizeHandler);
        }

        event = context.trigger('prepared', false, { $slide: $slide });

        return event.$slide;
    };

    /**
     * Add slide.
     * @param {HTMLElement|jQuery|String} content - The slide content to add.
     * @param {Number} [position] - The relative position at which to insert the slide otherwise the item will be added to the end.
     */
    SliceSlider.prototype.add = function(content, position){
        var context = this,
            $content = $(content);
        position = position === undefined ? this.$slides.length : this.normalize(position, true);
        context.trigger('add', false, {content : $content, position : position});

        var $slide = context.prepare(content),
            slides = context.$slides.get();
        slides.splice(position, 0, $slide[0]);

        // Create new slides list with new slide added at specified position.
        context.$slides = $(slides);

        context.invalidate('slides');

        context.trigger('added', false, {slide : $slide, position : position});

        return context;
    };

    /**
     * Refresh slider.
     */
    SliceSlider.prototype.refresh = function(){
        var context = this;

        context.trigger('refresh');
        context.update();
        context.trigger('refreshed');

        return context;
    };

    /**
     * Trigger slider resize.
     */
    SliceSlider.prototype.resize = function (){
        var context = this;
        context.invalidate('size');
        if( context.resizeDelay ){
            clearTimeout(context.resizeDelay);
        }
        context.resizeDelay = window.setTimeout(function() {
            context.resizeDelay = false;
            context.run('resize');
        }, 50);
        return context;
    };

    /**
     * Check if slider is visible.
     */
    SliceSlider.prototype.isVisible = function (){
        return this.settings.checkVisibility ? this.$element.is(':visible') : true;
    };

    /**
     * Run workers.
     * @param {Array | String} keys - the worker keys.
     * @param {Object} data - the workers start data.
     * @param {String} [workerType] - The worker type, of not set - '_'.
     * @returns {Variable} - the workers execution result.
     */
    SliceSlider.prototype.run = function (keys, data, workerType){
        var context = this,
            cache = jQuery.extend({}, data || {}),
            type, list,
            filter = function(p) { return list.indexOf(p) !== -1; },
            i = 0;
        if (typeof keys === 'string' && !workerType && quickRunList[keys] ){
            type = quickRunList[keys].type;
            list = quickRunList[keys].keys;
        } else {
            type = workerType && workerType !== true ? workerType : '_';
            list = Array.isArray(keys) ? keys : [keys];
        }

        var workers = context.workers.run[type],
            n = workers.length;
        cache.list = $.extend({}, list);

        while (i < n) {
            if ($.grep(workers[i].keys, filter).length > 0) {
                if (workers[i].run.call(context, context.stage, cache) === false){
                    break;
                }
            }
            i++;
        }

        return cache.result;
    };

    /**
     * Update slider. Run all pending workers.
     */
    SliceSlider.prototype.update = function(){
        var context = this,
            workers = context.workers.list,
            cache = {},
            invalidated = context.invalidated,
            filter = function(p) { return invalidated[p]; },
            i = 0,
            n = workers.length,
            result;

        context.invalidated = {};
        cache.invalidated = $.extend({}, invalidated);

        while (i < n) {
            if (invalidated.all || workers[i].keys === true || $.grep(workers[i].keys, filter).length > 0) {
                result = workers[i].run.call(context, context.stage, cache);
                if (result === false){
                    break;
                } else if (result === 're-update'){
                    $.extend(context.invalidated, invalidated);
                    return context.update();
                }
            }
            i++;
        }

        return context;
    };

    /**
     * Invalidates the given part of the update routine.
     * @param {String} [part] - The part to invalidate.
     * @returns {Array.<String>} - The invalidated parts.
     */
    SliceSlider.prototype.invalidate = function(part) {
        var context = this;
        if (typeof part === 'string') {
            context.invalidated[part] = true;
        }
        return $.map(context.invalidated, function(v, i) { return i; });
    };

    /**
     * Resets the absolute position of the current item.
     * @param {Number} position - The absolute position of the new item.
     */
    SliceSlider.prototype.reset = function(position) {
        var context = this;
        context.currentPosition = position || context.currentPosition;
        context.invalidate('reset');
        context.update();
        return context;
    };

    /**
     * Slides to the specified item.
     * @param {Number} position - the position of the item.
     * @param {Number} [speed] - the time in milliseconds for the transition.
     */
    SliceSlider.prototype.to = function(position, speed) {
        var context = this;
        if( context.settings.waitForAnimate && context.is('animating') ){
            return context;
        }
        context.moveToPosition = position;
        context.speed = speed;
        context.invalidate('move');
        context.update();
        return context;
    };

    /**
     * Slides to the next item.
     * @param {Number} [speed] - The time in milliseconds for the transition.
     */
    SliceSlider.prototype.next = function(speed) {
        var context = this;
        return context.to(context.run('getNextPosition'), speed);
    };

    /**
     * Slides to the prev item.
     * @param {Number} [speed] - The time in milliseconds for the transition.
     */
    SliceSlider.prototype.prev = function(speed) {
        var context = this;
        return context.to(context.run('getPrevPosition'), speed);
    };

    /**
     * Handles the end of an animation.
     */
    SliceSlider.prototype.onTransitionEnd = function() {
        var context = this;
        context.leave('animating');
        context.invalidate('translated');
        context.update();
        context.trigger('translated');
        return this;
    };

    /*
    *   Reset styles
    *   Priority -100
    */
    addWorker('resetStyles', ['size', 'slides', 'settings'], function(stage){
        stage.viewHeight = false;
        this.$viewport.attr('style', '');
        this.$stage.attr('style', '');
        if (stage.$slides){
            stage.$slides.attr('style', '');
        }
    }, -100);

    /*
    *   Check if slider has fixed height
    *   Priority 0
    */
    addWorker('checkFixedHeight', ['size', 'settings'], function(stage, cache){
        // add fake slide with enourmous height to check if viewport height is limited
        var context = this,
            checkVal = 20000,
            $checkEl = $('<' + context.settings.slideElement + '/>')
                .addClass(context.settings.slideClass)
                .css('height', checkVal).appendTo(context.$stage),
            height = context.$viewport.innerHeight(),
            fixedheight = height < checkVal;
        stage.viewportMaxHeight = fixedheight ? height : false;
        context.$element.toggleClass('slice-has-fixed-view', fixedheight);
        $checkEl.remove();
        if (context.settings.workers.fixedheight !== fixedheight){
            context.settings.workers.fixedheight = fixedheight;
            cache.rebuild = true;
        }
    }, -20);

    /*
    *   Re-build if requested from plugin
    *   Priority 0
    */
    addWorker('reBuild', true, function(stage, cache){
        if (cache.rebuild){
            this.workers = getWorkers(this.settings.workers);
        }

        if (cache.rebuild || cache.reUpdate){
            return 're-update';
        }
    });

    /*
    *   Cleanup resize delay
    *   Priority 0
    */
    addWorker('cleanupResizeDelay', ['size'], function(){
        if (this.resizeDelay){
            clearTimeout(this.resizeDelay);
            this.resizeDelay = false;
        }
    });

    /*
    *   Create layers
    *   Priority up to 0
    */
    addWorker('createLayers', ['settings'], function(stage, cache){
        var context = this,
            layers = {};
        if (cache.layers){
            // normilize layers
            $.each(cache.layers, function (key, value){
                var layer = {};
                if (typeof value === 'object'){
                    if (value.class){
                        layer.class = [value.class];
                    }
                    layer.layer = value.layer;
                } else if (typeof key === 'string'){
                    layer.class = [key];
                    layer.layer = value;
                } else if (typeof key === 'number') {
                    layer.layer = key;
                } else {
                    layer = false;
                }
                if (layer){
                    if (!layers[layer.layer]){
                        if (!layer.class){
                            layer.class = [];
                        }
                        layers[layer.layer] = layer;
                    } else if (layer.class){
                        layers[layer.layer].class.push(layer.class);
                    }
                }
            });
        }
        // create base layer
        if (context.settings.viewLayer){
            if (!layers[context.settings.viewLayer]){
                layers[context.settings.viewLayer] = {
                    class : context.settings.viewLayerClass ? [context.settings.viewLayerClass] : [],
                    layer : context.settings.viewLayer
                };
            } else if(context.settings.viewLayerClass) {
                layers[context.settings.viewLayer].class.push(context.settings.viewLayerClass);
            }
        }
        var sorted = [],
            layersLeft = context.layersCount;
        $.each(layers, function(key, layer){
            if (context.layers[key]){
                --layersLeft;
                layer.$element = context.layers[key].$element.attr('class', '');
                delete context.layers[key];
            } else {
                layer.$element = $('<div/>');
            }
            layer.$element
                .addClass('slice-layer-' + layer.layer + ' slice-layer')
                .addClass(layer.class.join(' '));
            sorted.push(layer);
        });

        // sort layers
        sorted.sort(function(item1, item2){
            return item1.layer - item2.layer;
        });
        sorted[0].$element.addClass('slice-first-layer');
        sorted[sorted.length - 1].$element.addClass('slice-last-layer');

        var $layer = context.$viewport;
        if (context.settings.viewLayer){
            layers[context.settings.viewLayer].$element.prepend($layer);
            $layer = $([]);
        }

        // check if layers should be created or deleted
        if (layersLeft === 0 && context.layersCount === sorted.length){
            // store layers
            context.layers = layers;
            context.layersCount = sorted.length;
            return;
        }

        // create layers
        $.each(sorted, function(i, layer){
            $layer = layer.$element.prepend($layer);
        });

        context.$element.prepend($layer);
        // remove layers
        if (layersLeft > 0){
            cache.$trash = cache.$trash || $([]);
            $.each(context.layers, function(key, layer){
                layer.$element.remove();
                delete context.layers[key];
            });
        }

        // store layers
        context.layers = layers;
        context.layersCount = sorted.length;
    });

    /*
    *   Set dimensions workers
    *   Priority 0
    */
    addWorker('setDimension', ['settings'], function(stage){
        // size
        stage.revSizeProp = cssProps.height;
        stage.sizeProp = cssProps.width;
        stage.getSize = function($el){
            return $el.innerWidth();
        };
        stage.setSize = function($el, size){
            $el.innerWidth(size);
        };

        // spacing
        stage.spacingProps = ['marginLeft', 'marginRight'];

        // position
        stage.positionProp = 'left';
        stage.getPosition = function($el, position){
            if (position){
                return position.left || 0;
            }
            return $el.position().left;
        };
    }, 0, 'horizontal');

    /*
    *   Set animations workers
    *   Priority 0
    */
    addWorker('setAnimation', ['settings'], function(stage){
        stage.animate = $.proxy(function(offset, speed, onComplete, animateProps){
            var context = this,
                props = animateProps || {};
            props[context.stage.positionProp] = offset + 'px';
            if (speed && speed > 0) {
                context.$stage.animate(props, speed, context.settings.fallbackEasing, onComplete);
            } else {
                context.$stage.css(props);
                if (onComplete){
                    onComplete();
                }
            }
        }, this);
    });

    /*
    *   View sizes workers :
    *   1. Calculate viewport size, priority 10
    *   2. Calculate view size, priority 10 - 20
    *   3. Calculate work space size, priority 20 - 30
    *   
    *   Priority 10 - 30
    */
    addWorker('viewportSize', ['size', 'slides', 'settings'], function(stage, cache){
        stage.viewportSize = stage.getSize(this.$viewport);
        cache.viewSize = stage.viewportSize;
    }, 10);
    addWorker('viewSize', ['size', 'slides', 'settings'], function(stage, cache){
        stage.viewSize = cache.viewSize;
        cache.workSpace = cache.viewSize;
    }, 20);
    addWorker('workSpace', ['size', 'slides', 'settings'], function(stage, cache){
        stage.workSpace = cache.workSpace;
    }, 30);

    /*
    *   Stage slides workers :
    *   - Set minimum slides, priority 0 - 40
    *   - Set slider slides, priority 0 - 60
    *   - Calculate slide spacing, priority 10
    *   - Calculate slide size, priority 30 - 40
    *   - Check slides count, 40 - 50
    *   - Append slides to the stage, priority 60
    *   - Calculate stage size, priority 60 - 70
    *   - Set slides sizes, priority 70
    *   - Set stage size, priority 70
    *   
    *   Priority 0 - 70
    */
    addWorker('minSlides', ['settings'], function(stage){
        stage.minSlides = 1;
    }, 0, 'single');
    addWorker('resetSlides', ['slides', 'settings'], function(stage, cache){
        // make new slides list
        var context = this;
        context.$slides.off('.slice');
        context.$slides.removeClass(context.settings.currentClass + ' ' + context.settings.activeClass);
        cache.$slides = $([]).add(context.$slides.detach());
    });
    addWorker('appendSlides', ['slides', 'settings'], function(stage, cache){
        stage.$slides = cache.$slides;
        stage.slidesCount = stage.$slides.length;
        stage.$slides.each(function(i, el){
            $(el).attr('data-slice-index', i + 1);
        });
        this.$stage.append(stage.$slides);
    }, 9);
    addWorker('slideSpacing', ['size', 'settings'], function(stage){
        stage.slideSpacing = $.fn.sliceSlider.toPx(this.settings.spacing, stage.viewSize);
    }, 20, 'spaced');
    addWorker('slideSize', ['size', 'slides', 'settings'], function(stage, cache){
        cache.slideSize = stage.workSpace;
    }, 30, 'single');
    addWorker('bindFocusOnSelect', ['slides', 'settings'], function(stage){
        var context = this;
        var focusHandler = function(e){
            var settings = this.settings;
            this.to($(e.target).closest('.' + settings.slideClass).data('sliceIndex'));
        };
        stage.$slides.on('click.slice.focus', $.proxy(focusHandler, context));
    }, 40, 'focusOnSelect');
    addWorker('checkEnoughtSlides', ['edges', 'slides', 'settings'], function(stage){
        stage.enoughSlides = stage.slidesCount > stage.minSlides;
    }, 40);
    addWorker('stageSize', ['size', 'slides', 'settings'], function(stage, cache){
        stage.slideSize = cache.slideSize;
        stage.size = stage.slideSize * stage.$slides.length;
    }, 60, 'fixedsize');
    addWorker('addSlideSpacing', ['size', 'slides', 'settings'], function(stage){
        stage.$slides.css(stage.spacingProps[0], stage.slideSpacing);
        stage.size += stage.slideSpacing * stage.$slides.length;
    }, 60, 'spaced');
    addWorker('resizeStage', ['size', 'slides', 'settings'], function(stage){
        stage.setSize(this.$stage, stage.size);
        this.$element.toggleClass(this.settings.notEnoughtSlidesClass, !stage.enoughSlides);
    }, 70);
    addWorker('resizeSlides', ['size', 'slides', 'settings'], function(stage){
        stage.setSize(stage.$slides, stage.slideSize);
    }, 70, 'fixedsize');
    addWorker('staticHeightVal', ['size', 'slides', 'settings'], function(){
        this.$viewport[cssProps.height](Math.ceil(this.run('getViewMaxHeight')));
    }, 70, {
        staticHeight : true,
        horizontal : true
    });

    /*
    *   Calculate slides coordinates worker
    *   Priority 80 - 90
    */
    addWorker('setCoordinatesDisplace', ['size', 'slides', 'settings'], function(stage, cache){
        cache.displacePerSlide = stage.slideSpacing || 0;
        cache.displace = stage.slideSpacing || 0;
    }, 80);
    addWorker('storeCoordinates', ['size', 'slides', 'settings'], function(stage, cache){
        var size = stage.$slides.length,
            iterator = -1,
            coordinates = {};

        while (++iterator < size) {
            coordinates[iterator + 1] = -1 * iterator * (stage.slideSize + cache.displacePerSlide) - cache.displace;
        }

        stage.coordinates = coordinates;
    }, 85, 'fixedsize');

    /*
    *   Calculate start and last slides
    *   Priority 100 - 150
    */
    addWorker('setStartLastSlides', ['edges', 'slides', 'settings'], function(stage){
        stage.lastSlide = stage.slidesCount;
        stage.startSlide = 1;
    }, 100);
    addWorker('checkSlideSlides', ['edges', 'slides', 'settings'], function(stage){
        if (stage.lastSlide > stage.slidesCount) {
            stage.lastSlide = stage.slidesCount || 1;
        }

        if (stage.startSlide > stage.slidesCount) {
            stage.startSlide = stage.slidesCount || 1;
        } else if (stage.startSlide < 1) {
            stage.startSlide = 1;
        }

        if (stage.startSlide > stage.lastSlide || !stage.enoughSlides) {
            stage.lastSlide = stage.startSlide;
        }
    }, 120);

    /*
    *   Check viewport size, if changed force resize
    *   Priority 197-198
    */
    addWorker('checkViewportSize', true, function(stage, cache){
        cache.resizeRequired = cache.resizeRequired || Math.ceil(stage.viewportSize) !== Math.ceil(stage.getSize(this.$viewport));
    }, 197);
    addWorker('forceResize', true, function(stage, cache){
        var context = this;
        if (!cache.stopResize && cache.resizeRequired){
            if (stage.forceResizeCount > 2){
                // Whoops cant properly resize viewport
                if (window.console){
                    console.log("Can't properly resize viewport for:");
                    console.log(context);
                }
            } else {
                stage.forceResizeCount = (stage.forceResizeCount || 0) + 1;
                context.invalidate('size');
                return 're-update';
            }
        }
    }, 198);
    addWorker('cleanupResize', true, function(stage){
        stage.forceResizeCount = 0;
    }, 1000);

    /*
    *   Move to current slide
    *   Priority 199
    */
    addWorker('moveToCurrent', ['size', 'slides', 'settings'], function(){
        this.reset();
    }, 199);

    /*
    *   Calculate slide movement workers:
    *   - Set basic values for speed, from, to slide positions, priority 200
    *   - Check sides, priority 220
    *   - Calculate move to position, priority 200 - 250
    *   - Calculate current/active positions, priority 250 - 280
    *   - Set current/active slides, priority 280
    *   - Calculate normilized positions, priority 250 - 270
    *   - Calculate real positions, priority 280 - 290
    *   - Reset move properties, priority 299
    *   
    *   Priority 200 - 299
    */
    addWorker('resetPosition', ['reset'], function(stage, cache){
        cache.speed = 0;
        cache.moveSpeed = 0;
        cache.moveToPosition = this.currentPosition;
    }, 200);
    addWorker('moveToPosition', ['move'], function(stage, cache){
        cache.speed = this.speed;
        cache.fromPosition = stage.position || this.currentPosition;
        cache.moveToPosition = this.moveToPosition;
    }, 200);
    addWorker('checkSides', ['reset', 'move'], function(stage, cache){
        stage.isFirstSlide = cache.moveToPosition <= stage.startSlide;
        stage.isLastSlide = cache.moveToPosition >= stage.lastSlide;
    }, 220, 'checkSides');
    addWorker('checkPosition', ['reset', 'move'], function(stage, cache){
        if (cache.moveToPosition < 1){
            cache.moveToPosition = stage.startSlide;
        }else if (cache.moveToPosition > stage.slidesCount){
            cache.moveToPosition = stage.slidesCount;
        }
    }, 230, {
        loop : false
    });
    addWorker('setPositions', ['reset', 'move'], function(stage, cache){
        this.currentPosition = cache.moveToPosition;
        cache.currentPosition = cache.moveToPosition;
        cache.activePosition = cache.moveToPosition;
        cache.activePositionEnd = cache.moveToPosition;
        cache.normilizedPosition = cache.moveToPosition;
    }, 250);
    addWorker('checkCurrentPosition', ['reset', 'move'], function(stage){
        if (this.currentPosition < 1) {
            this.currentPosition = 1;
        }else if (this.currentPosition > stage.slidesCount){
            this.currentPosition = stage.slidesCount;
        }
    }, 260);
    addWorker('realPosition', ['reset', 'move'], function(stage, cache){
        stage.position = cache.normilizedPosition;
        cache.realPosition = cache.normilizedPosition;
    }, 270);
    addWorker('setSlidesClasses', ['reset', 'move'], function(stage, cache){
        stage.$slides.removeClass(this.settings.currentClass + ' ' + this.settings.activeClass);
        cache.$active = stage.$slides.slice(cache.activePosition - 1, cache.activePositionEnd).addClass(this.settings.activeClass);
        cache.$current = stage.$slides.eq(cache.currentPosition - 1).addClass(this.settings.currentClass);
    }, 280);
    addWorker('resetMove', ['move'], function(){
        this.moveToPosition = false;
        this.speed = 0;
    }, 299);

    /*
    *   Animate slider:
    *   - Calculate move animation, priority 300 - 340
    *   - Animate slider movement, priority 350
    *   
    *   Priority 300 - 350
    */
    addWorker('calculateMoveSpeed', ['move'], function(stage, cache){
        cache.baseSpeed = Math.abs(cache.speed || this.settings.speed);
        cache.moveSpeed = Math.min(Math.max(Math.abs(cache.realPosition - cache.fromPosition), 1), 6) * cache.baseSpeed;
    }, 300);
    addWorker('calculateMovePosition', ['reset', 'move'], function(stage, cache){
        if (cache.realPosition < stage.startSlide) {
            cache.realPosition = stage.startSlide;
        }else if (cache.realPosition > stage.$slides.length){
            cache.realPosition = stage.$slides.length;
        }
        cache.moveToCoordinate = stage.coordinates[cache.realPosition];
    }, 300);
    addWorker('animateMove', ['reset', 'move'], function(stage, cache){
        var context = this,
            speed = cache.moveSpeed || 0,
            animate = speed > 0;

        if (context.is('animating')){
            context.$stage.finish();
            context.onTransitionEnd();
        }

        if (animate) {
            context.enter('animating');
            context.trigger('translate');
        }
        // remove transition from stage and slides before animating
        this.$stage.css('transition', 'none');
        stage.$slides.css('transition', 'none');
        stage.animate(cache.moveToCoordinate, speed, $.proxy(context.onTransitionEnd, context), cache.animateProps);
    }, 350);
    addWorker('resetTransition', ['translated'], function(stage){
        if (!this.is('animating')){
            this.$stage.css('transition', '');
            stage.$slides.css('transition', '');
        }
    }, 350);

    /*
    *   Initialize slider runnable (private):
    *   - start initializing, priority -1
    *   - create slider stage elements, priority 10 - 19
    *   - create slides, priority 20 - 30
    *   - update slider, priority 50
    *   - bind slider events, priority 90
    *   - end initializing, priority 100
    *   
    *   Priority -1 - 100
    */
    setRunnableType('initialize');
    addRunnable('start', ['initialize'], function(){
        this.enter('initializing');
        this.trigger('initialize');
    }, -1);
    addRunnable('stageElements', ['initialize'], function(){
        var context = this;
        context.$stage = context.$element.find('.' + context.settings.stageClass);

        // if the stage is already in the DOM, grab it and skip stage initialization
        if (context.$stage.length) {
            context.$viewport = context.$element.find('.' + context.settings.viewportClass);
            context.$stageWrap = context.$element.find('.' + context.settings.stageWrapClass);
            return;
        }

        // create viewport
        context.$viewport = $( '<div/>', {
            "class": context.settings.viewportClass
        });
        
        // create and append stage
        context.$stage = $('<' + context.settings.stageElement + '>', {
                "class": context.settings.stageClass
            }).appendTo(context.$viewport);
        context.$element.append(context.$viewport);
    }, 10);
    addRunnable('slides', ['initialize'], function(){
        var context = this,
            $slides = context.$element.find('.' + context.settings.slideClass);

        // if the items are already in the DOM, grab them and skip item initialization
        if ($slides.length) {
            context.$slides = $slides.detach();
            context.invalidate('slides');
            return;
        }

        // add slides
        context.$element.children().not(context.$viewport).each(function(i, content){
            context.add(content);
        });
    }, 20);
    addRunnable('update', ['initialize'], function(){
        var context = this;
        context.$element.addClass('slice-initialized');
        if (context.isVisible()) {
            context.update();
        } else {
            context.invalidate('size');
        }
    }, 50);
    addRunnable('events', ['initialize'], function(){
        var context = this;
        // disable browser dragging
        context.$stage
            .off('.slice.noDrag')
            .on('dragstart.slice.noDrag', function(e){
                e.preventDefault();
            });
        if (!context.resizeHandler){
            context.resizeHandler = $.proxy( context.resize, context );
            // try to resize slider when window is resized or finish loading
            $(window).on('resize.slice.slider load.slice.slider', context.resizeHandler);
            // try to resize slider when any slide element with 'src' or 'data-src' attribute is loaded
            context.$slides.find('[src], [data-src]').on('load.slice.slider', context.resizeHandler);
        }
    }, 90);
    addRunnable('end', ['initialize'], function(){
        this.leave('initializing');
        this.trigger('initialized');
    }, 100);

    /*
    *   Resize/Re-check slider size
    *   
    *   Priority 0 - 100
    */
    setRunnableType('resize');
    setQuickRun('resize', ['resize']);
    addRunnable('invalidate', ['resize'], function(){
        this.stage.viewHeight = false;
        this.invalidate('size');
    });
    addRunnable('updateSize', ['resize'], function(){
        this.update();
    }, 100);

    /*
    *   Get stage height
    *   
    *   Priority 0 - 100
    */
    setRunnableType('size');
    setQuickRun('getViewMaxHeight', ['viewHeight']);
    setQuickRun('getInViewHeight', ['inViewHeight']);
    addRunnable('checkStoredViewHeight', ['viewHeight'], function(stage, cache){
        if (stage.viewHeight){
            cache.result = stage.viewHeight;
            return false;
        }
    }, -10);
    addRunnable('cacheSlideSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.slideSizes = [0];
        stage.$slides.css('transition', 'none');
    });
    addRunnable('cacheSlides', ['viewHeight'], function(stage, cache){
        cache.$slides = stage.$slides;
    });
    addRunnable('cacheActiveSlides', ['inViewHeight'], function(stage, cache){
        cache.$slides = stage.$slides.filter('.' + this.settings.activeClass);
    });
    addRunnable('maxSlideHeight', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.$slides.each(function(i, el){
            cache.slideSizes.push($(el)[cssProps.height]());
        });
        cache.slideSize = Math.max.apply(Math, cache.slideSizes);
    }, 10);
    addRunnable('cacheViewSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.viewSize = cache.slideSize;
    }, 20);
    addRunnable('viewSize', ['inViewHeight', 'viewHeight'], function(stage, cache){
        cache.result = cache.viewSize;
        stage.$slides.css('transition', '');
    }, 30);
    addRunnable('storeStageHeight', ['viewHeight'], function(stage, cache){
        stage.viewHeight = cache.result;
    }, 100);

    /**  Get slide position runnables  **/
    setRunnableType('slidePosition');
        
    /*
    *   Get next/previous position runnable:
    *   - set position, priority 0 - 10
    *   - calculate next/previous position, priority 20 - 40
    *   
    *   Priority 0 - 40
    */
    setQuickRun('getNextPosition', ['getNextPosition']);
    setQuickRun('getPrevPosition', ['getPrevPosition']);
    addRunnable('position', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        cache.position = cache.hasOwnProperty('position') ? cache.position : this.currentPosition;
    });
    addRunnable('checkPosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        if (cache.position > stage.lastSlide){
            cache.position = stage.lastSlide;
        }else if (cache.position < stage.startSlide){
            cache.position = stage.startSlide;
        }
    }, 10, 'single');
    addRunnable('calculateNextPosition', ['getNextPosition'], function(stage, cache){
        cache.result = cache.position + 1;
    }, 20, 'single');
    addRunnable('calculatePrevPosition', ['getPrevPosition'], function(stage, cache){
        cache.result = cache.position - 1;
    }, 20, 'single');
    // check result position for rewind
    addRunnable('checkNextRewind', ['getNextPosition'], function(stage, cache){
        if (cache.position >= stage.lastSlide){
            cache.result = stage.startSlide;
        }
    }, 30, 'rewind');
    addRunnable('checkPrevRewind', ['getPrevPosition'], function(stage, cache){
        if (cache.position <= stage.startSlide){
            cache.result = stage.lastSlide;
        }
    }, 30, 'rewind');
    addRunnable('checkPosition', ['getNextPosition', 'getPrevPosition'], function(stage, cache){
        if (cache.result < stage.startSlide) {
            cache.result = stage.startSlide;
        }else if (cache.result > stage.lastSlide){
            cache.result = stage.lastSlide;
        }
    }, 30, 'checkSides');

    /*
    *   Get closest slide position runnable:
    *   - set/calculate coordinate, priority 0 - 10
    *   - set closest calculation function, priority 10
    *   - calculate closest position, priority 20 - 40
    *   
    *   Priority 0 - 40
    */
    setQuickRun('getClosest', ['closest']);
    setQuickRun('getClosestNext', ['closestNext']);
    setQuickRun('getClosestPrev', ['closestPrev']);
    addRunnable('coordinate', ['closest', 'closestNext', 'closestPrev'], function(stage, cache){
        cache.coordinate = cache.hasOwnProperty('coordinate') ? cache.coordinate : stage.getPosition(this.$stage);
    }, 10);
    addRunnable('closestFn', ['closest'], function(stage, cache){
        cache.checkClosest = function(coordinates, coordinate, position){
            return coordinates[position + 1] === undefined || coordinate > coordinates[position + 1];
        };
    }, 10);
    addRunnable('closestFnPrev', ['closestPrev'], function(stage, cache){
        cache.checkClosest = function(coordinates, coordinate, position){
            var offset = cache.prevSlideOffset || 1,
                spacing = stage.slideSpacing || 0,
                preciseValue = spacing + stage.getSize(stage.$slides.eq(position - offset)) * (cache.precise || 0),
                nextIndex = position + (cache.prevSlideOffset || 1),
                distance = coordinate - coordinates[nextIndex];
            return coordinates[nextIndex] === undefined || distance > preciseValue;
        };
    }, 10);
    addRunnable('closestFnNext', ['closestNext'], function(stage, cache){
        cache.checkClosest = function(coordinates, coordinate, position){
            var offset = cache.nextSlideOffset || 1,
                spacing = stage.slideSpacing || 0,
                preciseValue = spacing + stage.getSize(stage.$slides.eq(position + offset)) * (cache.precise || 0),
                nextIndex = position + 1,
                distance = coordinates[position] - coordinate;
            return coordinates[nextIndex] === undefined || distance < preciseValue;
        };
    }, 10);
    addRunnable('calculateClosest', ['closest', 'closestNext', 'closestPrev'], function(stage, cache){
        var context = this,
            position = 0,
            coordinate = cache.coordinate,
            coordinates = stage.coordinates;
        $.each(coordinates, function(index, value) {
            position = parseInt(index, 10);
            if (coordinate >= value || cache.checkClosest.call(context, coordinates, coordinate, position)){
                return false;
            }
        });
        cache.result = position;
    }, 20);
    addRunnable('checkClosest', ['closestNext', 'closestPrev'], function(stage, cache){
        if (cache.result < stage.startSlide) {
            cache.result = stage.startSlide;
        }else if (cache.result > stage.lastSlide){
            cache.result = stage.lastSlide;
        }
    }, 30, {
        loop : false
    });

    /*
    *   Move/get stage coordinate runnable:
    *   - set/calculate coordinate, priority 10
    *   - set/calculate move distance, priority 20 - 29
    *   - move stage, priority 30
    *   
    *   Priority 0 - 30
    */
    setRunnableType('move');
    setQuickRun('moveStage', ['stageMove']);
    setQuickRun('getStagePosition', ['stagePosition']);
    addRunnable('coordinate', ['stageMove', 'stagePosition'], function(stage, cache){
        cache.result = stage.getPosition(this.$stage);
    }, 10);
    addRunnable('moveDistance', ['stageMove'], function(stage, cache){
        cache.moveDistance = stage.getPosition(false, cache.distance || {});
    }, 20);
    addRunnable('stageMove', ['stageMove'], function(stage, cache){
        if (cache.moveDistance === 0){
            cache.result = false;
        }else{
            stage.animate(cache.result - cache.moveDistance);
            cache.result = true;
        }
    }, 30);

    // cleanup runnable type
    resetRunnableType();

    /**
     * Extend jQuery with Slice Slider
     * @param {Object} [options] - options
     */
    $.fn.sliceSlider = function (opts){
        var args = Array.prototype.slice.call(arguments, 1);

        return this.each(function() {
            var $el = $(this),
                context = $el.data('slice.slider');

            if (!context) {
                context = new SliceSlider($el, typeof opts === 'object' && opts);
                $el.data('slice.slider', context);
            }

            if (typeof opts === 'string' && opts.charAt(0) !== '_') {
                context[opts].apply(context, args);
            }
        });
    };

    /**
     * Default options
     */
    $.fn.sliceSlider.Defaults = {};

    /**
     * Types list.
     */
    $.fn.sliceSlider.Type = {
        State: 'state'
    };

    /**
     * Plugins list
     */
    $.fn.sliceSlider.Plugins = {};

    /**
     * Quick functions list
     */
    $.fn.sliceSlider.fn = {};

    /**
     * Slider workders
     */
    $.fn.sliceSlider.addWorker = addWorker;
    $.fn.sliceSlider.addRunnable = addRunnable;
    $.fn.sliceSlider.setRunnableType = setRunnableType;
    $.fn.sliceSlider.resetRunnableType = resetRunnableType;
    $.fn.sliceSlider.setQuickRun = setQuickRun;
    $.fn.sliceSlider.removeQuickRun = removeQuickRun;
    $.fn.sliceSlider.getWorkers = getWorkers;
    $.fn.sliceSlider.addRequirement = addRequirement;
    $.fn.sliceSlider.removeRequirement = removeRequirement;
    $.fn.sliceSlider.resetRequirements = resetRequirements;
    $.fn.sliceSlider.setPluginName = setPluginName;
    $.fn.sliceSlider.resetPluginName = resetPluginName;

    /**
     * Parse options string/object
     */
    $.fn.sliceSlider.parseOptions = parseOptions;

    /**
     * Value converters
     */
    $.fn.sliceSlider.toUnitType = toUnitType;
    $.fn.sliceSlider.toPx = toPx;
    $.fn.sliceSlider.revPx = revPx;

    /**
     * Slider theme
     */
    $.fn.sliceSlider.addTheme = addTheme;
    $.fn.sliceSlider.removeTheme = removeTheme;
    $.fn.sliceSlider.getTheme = getTheme;

    /**
     * CSS properties list
     */
    $.fn.sliceSlider.cssProps = cssProps;

    /**
     * Enable/Disable slider autoinit
     */
    $.fn.sliceSlider.autoInit = true;

    /**
     * Auto-init Slice Slider
     */
    $(function(){
        if ($.fn.sliceSlider.autoInit){
            $('[data-slice-slider]').sliceSlider({
                optionsProvider : 'sliceSlider'
            });
        }
    });
}));