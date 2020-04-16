/* global jQuery */

/**
 * Slice Slider Simple Theme
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
    $.fn.sliceSlider.addTheme('simple', {
        sliderClass : 'slice-theme-simple',
        defaults : {
            navClass : 'st-nav-auto', // st-nav-auto | st-nav-over | st-nav-over-vertical
            arrowsLayer : 4,
            dotsLayer : 5,
            prevArrow : '<a href="#" class="slice-prev"><i class="fas fa-chevron-left slice-arrows-horizontal"></i><i class="fas fa-chevron-up slice-arrows-vertical"></i></a>',
            nextArrow : '<a href="#" class="slice-next"><i class="fas fa-chevron-right slice-arrows-horizontal"></i><i class="fas fa-chevron-down slice-arrows-vertical"></i></a>'
        }
    });
}));