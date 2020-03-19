import { TweenMax, TimelineMax, Power2, Expo, CSSPlugin, CSSRulePlugin } from 'gsap/all';

require('../../../../node_modules/waypoints/lib/noframework.waypoints');

class Navigation {
	constructor() {
		this.menuButton = $('#menu-button');
		this.menuButtonParts = $('#menu-button i');
		this.menuOpen = false;
		this.mobileOverlay = $('#mobile-overlay');
		this.navigationButtons = $('.navigation--button');

		this.waypoint = null;

		this.navigationTimeline = null;
		this.easingValue = Expo.easeInOut;

		this.header = $('header');
		this.headerFixedOpen = false;
		this.logoParts = $('#logo .cls-header');

		this.reverseComplete = this.reverseComplete.bind(this);
	}

	events() {
		var _self = this;
		this.menuButton.click(function() {
			if (!_self.menuOpen) {
				_self.navigationTimeline.seek(0).play();
				$('html').css('overflow-y', 'hidden');
				$('nav').css('pointer-events', 'all');

				_self.logoParts.addClass('invert-color');
				_self.menuButtonParts.addClass('invert-color');
				_self.navigationButtons.addClass('invert-nav-color');

				_self.menuOpen = true;
			} else {
				_self.navigationTimeline.reverse();
				_self.menuOpen = false;
				$('html').css('overflow-y', 'visible');
				$('nav').css('pointer-events', 'none');

				_self.menuButtonParts.removeClass('invert-color');
				_self.logoParts.delay(800).queue(function() {
					$(this).removeClass('invert-color').dequeue();
				});
			}
		});

		var position = $(window).scrollTop();

		$(window).scroll(function() {});
	}

	init() {
		console.log('Initialize Navigation');

		this.setupWaypoints();
		this.setupNavigation();
		this.events();
	}

	setupWaypoints() {
		this.waypoint = new Waypoint({
			element: document.querySelector('section'),
			handler: function(direction) {
				//console.log('Scrolled to waypoint!' + ' - ' + direction);

				if (direction == 'up') {
					//alert('fired!');
					this.unFixHeader();
				}
			}.bind(this),
			offset: -350
		});
	}

	setupNavigation() {
		//console.log('Setup Navigation!');
		this.navigationTimeline = new TimelineMax({ repeat: 0, onReverseComplete: this.reverseComplete });

		this.navigationTimeline.set(this.mobileOverlay, {
			transformOrigin: 'top center',
			scaleY: 0
		});

		this.navigationTimeline.set(this.navigationButtons, {
			autoAlpha: 0,
			x: 20
		});

		this.navigationTimeline.add(
			TweenMax.to(this.mobileOverlay, 1.0, {
				scaleY: 1,
				ease: this.easingValue,
				autoAlpha: 0.95
			}),
			0
		);

		this.navigationTimeline.add(
			TweenMax.staggerTo(
				this.navigationButtons,
				1,
				{
					autoAlpha: 1,
					x: 0,
					ease: Expo.easeInOut
				},
				0.045
			),
			0
		);

		this.navigationTimeline.pause();
	}

	showFixedMenu() {
		if (!this.headerFixedOpen) {
			console.log('Show Fixed Menu');
			this.headerFixedOpen = true;
			TweenMax.set($('header'), { y: -80 });
			$('header').addClass('inverted');
			$('.inverted--fixed-bg').removeClass('off');

			TweenMax.to(this.header, 0.9, {
				y: 0,
				ease: this.easingValue,
				onComplete: function() {}.bind(this)
			});
		}
	}

	hideFixedMenu() {
		if (this.headerFixedOpen) {
			this.headerFixedOpen = false;

			TweenMax.to(this.header, 0.9, {
				y: -80,
				ease: this.easingValue,
				onComplete: function() {}.bind(this)
			});
		}
	}

	unFixHeader() {
		if (this.headerFixedOpen) {
			TweenMax.to(this.header, 0.4, {
				y: -80,
				ease: this.easingValue,
				onComplete: function() {
					TweenMax.set($('header'), { y: 0 });
					$('header').removeClass('inverted');
					$('.inverted--fixed-bg').addClass('off');
					this.headerFixedOpen = false;
				}.bind(this)
			});
		}
	}

	reverseComplete() {
		console.log('reverse complete');
		this.navigationButtons.removeClass('invert-nav-color');
	}
}

export default Navigation;
