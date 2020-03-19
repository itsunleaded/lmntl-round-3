/* global jQuery */

/**
 * Slice Slider Line Theme
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
    $.fn.sliceSlider.addTheme('line', {
        sliderClass : 'slice-theme-line',
        defaults : {
            navClass : 'st-nav-auto',
            arrowsLayer : 4,
            dotsLayer : 5,
            prevArrow : '<a href="#" class="slice-prev"><i class="st-chevron-prev"><span></span><span></span></i></a>',
            nextArrow : '<a href="#" class="slice-next"><i class="st-chevron-next"><span></span><span></span></i></a>'
        }
    });
}));