/* global jQuery */

/**
 * Slice Drag Plugin
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

    $.fn.sliceSlider.setPluginName('drag');
    var addWorker = $.fn.sliceSlider.addWorker;

    var pluginDefaults = {
        draggable : true, // Enable/disable dragging
        mouseDrag : true, // Enabled/disabled desktop dragging
        touchDrag : true, // Enabled/disabled touch dragging
        dragToSlide : true, // Allow users to drag directly to a slide
        dragSlide : true, // Enable/disable stage slides move while dragging
        dragThreshold : 0.25, // To advance slides, the user must drag a length of (1/dragThreshold) * the size of the slider
        edgeFriction : 0.15, // Resistance when swiping edges in non-loop slider
        dragSpeed : false // Drag speed
    };

    /**
     * Navigation plugin.
     * @class The Slice Navigation
     * @param {SliceSlider} slice - The slice slider instance
     */
    var SliceDrag = function(slice){
        this.slice = slice;
        $.extend(slice.defaults, pluginDefaults);
        slice.register({
            type : $.fn.sliceSlider.Type.State,
            name : 'dragging',
            tags : ['busy', 'hold']
        });
    };

    /**
     * Setup settings.
     */
    SliceDrag.prototype.setup = function (){
        var settings = this.slice.settings;
        settings.workers.drag = !!settings.draggable;
        return this;
    };

    /**
     * Start action.
     * @param {SliceDrag} context - SliceDrag instance.
     * @param {integer} x - drag X position.
     * @param {integer} y - drag Y position.
     */
    function startAction(context, x, y){
        var stage = context.stage;
        stage.dragX = x;
        stage.dragY = y;
        stage.dragDistanceX = x;
        stage.dragDistanceY = y;
        stage.stageMoves = false;
        stage.coordinate = stage.getPosition(context.$stage);
        context.enter('dragging');
    }

    /**
     * Move action.
     * @param {SliceDrag} context - SliceDrag instance.
     * @param {integer} x - drag X position.
     * @param {integer} y - drag Y position.
     */
    function moveAction(context, x, y){
        context.stage.stageMoves = true;
        if (context.settings.dragSlide){
            context.run(['stageMove', 'edgeFriction'], {
                distance : {
                    left : context.stage.dragDistanceX - x,
                    top : context.stage.dragDistanceY - y
                },
                edgeFriction : context.settings.edgeFriction
            }, 'move');
            context.stage.dragDistanceX = x;
            context.stage.dragDistanceY = y;
        }
    }

    /**
     * End action.
     * @param {SliceDrag} context - SliceDrag instance.
     * @param {integer} x - drag X position.
     * @param {integer} y - drag Y position.
     */
    function endAction(context, x, y){
        var settings = context.settings,
            stage = context.stage;
        stage.dragX -= x;
        stage.dragY -= y;
        document.removeEventListener('touchmove', preventDefault, {passive : false});
        context.$stage.off('.slice.dragging');
        context.$viewport.off('.slice.dragging');
        context.leave('dragging');
        var coordinate = stage.getPosition(false, {
            left : stage.dragX,
            top : stage.dragY
        });
        if (settings.dragToSlide){
            var moveToSlide = context.run('getClosest' + (coordinate > 0 ? 'Next' : 'Prev'), {
                precise : settings.dragThreshold,
                coordinate : stage.coordinate - coordinate
            });
            if(stage.stageMoves){
                context.to(stage.position === moveToSlide ? context.currentPosition : moveToSlide, settings.dragSpeed);
            }
        } else {
            var moveToCurrent = true;
            if ( Math.abs(coordinate) > (settings.dragThreshold * stage.viewSize) ){
                if (coordinate > 0){
                    if (context.currentPosition < stage.lastSlide){
                        moveToCurrent = false;
                        context.next(settings.dragSpeed);
                    }
                }else{
                    if (context.currentPosition > (stage.slidesStep || 1)){
                        moveToCurrent = false;
                        context.prev(settings.dragSpeed);
                    }
                } 
            }
            if (moveToCurrent){
                context.to(context.currentPosition, settings.dragSpeed);
            }
        }
    }

    /**
     * Drag move.
     * @param {event} event - event object.
     */
    function dragMove(event){
        moveAction(this, event.clientX, event.clientY);
    }

    /**
     * Drag move.
     * @param {event} event - event object.
     */
    function dragEnd(event){
        endAction(this, event.clientX, event.clientY);
    }

    /**
     * Drag start.
     * @param {event} event - event object.
     */
    function dragStart(event){
        var context = this;
        if( context.is('busy') ){
            return;
        }
        startAction(context, event.clientX, event.clientY);
        context.$viewport.on('mousemove.slice.dragging', $.proxy(dragMove, context));
        context.$viewport.on('mouseleave.slice.dragging mouseup.slice.dragging', $.proxy(dragEnd, context));
    }

    /**
     * Get touch data.
     * @param {event} event - event object.
     */
    function getTouchData(event){
        return event.touches && event.touches.length ?
            event.touches[0] : event.changedTouches && event.changedTouches.length ?
                event.changedTouches[0] : event;
    }

    /**
     * Touch move.
     * @param {event} event - event object.
     */
    function touchMove(event){
        var touch = getTouchData(event);
        moveAction(this, touch.pageX, touch.pageY);
    }

    /**
     * Touch move.
     * @param {event} event - event object.
     */
    function touchEnd(event){
        var touch = getTouchData(event);
        endAction(this, touch.pageX, touch.pageY);
    }

    function preventDefault(e) {
      e = e || window.event;
      if (e.preventDefault){
          e.preventDefault();
      }
      e.returnValue = false;  
    }

    /**
     * Touch start.
     * @param {event} event - event object.
     */
    function touchStart(event){
        var context = this;
        if( context.is('busy') ){
            return;
        }
        var touch = getTouchData(event);
        startAction(context, touch.pageX, touch.pageY);
        context.$viewport.on('touchmove.slice.dragging', $.proxy(touchMove, context));
        context.$viewport.on('touchleave.slice.dragging touchend.slice.dragging', $.proxy(touchEnd, context));
        document.addEventListener('touchmove', preventDefault, {passive : false});
    }

    /*
    *   Bind events worker
    *   Priority 90
    */
    addWorker('setupDragging', ['slides', 'settings'], function(){
        var context = this,
            settings = context.settings,
            $stage = context.$stage;
        if (context.is('dragging')){
            context.leave('dragging');
        }
        document.removeEventListener('touchmove', preventDefault, {passive : false});
        context.$viewport.off('.slice.dragging');
        $stage.off('.drag .dragging');

        if( settings.mouseDrag ){
            $stage.on('mousedown.slice.drag', $.proxy(dragStart, context));
        }

        if( settings.touchDrag ){
            $stage.on('touchstart.slice.drag', $.proxy(touchStart, context));
        }
    }, 90, 'drag');

    /*
    *   Move/get stage coordinate runnable:
    *   - set/calculate move distance, priority 20 - 29
    *   
    *   Priority 0 - 30
    */
    $.fn.sliceSlider.setRunnableType('move');
    $.fn.sliceSlider.addRunnable('moveEdgeFriction', ['edgeFriction'], function(stage, cache){
        var distance = cache.result + (cache.extraDistance || 0);
        if ( (distance > stage.coordinates[stage.startSlide] && cache.moveDistance < 0) ||
            (distance < stage.coordinates[stage.lastSlide] && cache.moveDistance > 0)){
            cache.moveDistance = cache.moveDistance * cache.edgeFriction;
        }
    }, 25, {
        loop : false
    });
    $.fn.sliceSlider.resetRunnableType();

    $.fn.sliceSlider.Plugins.SliceDrag = SliceDrag;
    $.fn.sliceSlider.resetPluginName();
}));