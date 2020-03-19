import { TweenMax, TimelineMax, Power2, Expo, CSSPlugin, AttrPlugin } from 'gsap';
import DrawSVGPlugin from '../vendor/greensock-js-shockingly-green 3/src/bonus-files-for-npm-users/DrawSVGPlugin';

class Preloader {
	constructor() {
		this.entireLogo = $('#preload-logo');
		this.topMask = $('#upper-mask');
		this.bottomMask = $('#lower-mask');
		this.upper = $('#upper');
		this.lower = $('#lower');

		this.O = $('#O');
		this.X = $('#X');
		this.Y = $('#Y');

		this.LOWCARBON = $('#LOW_CARBON');
		this.VENTURES = $('#Ventures');

		this.pageLoaded = false;
		this.easingValue = Expo.easeOut;

		this.animationComplete = this.animationComplete.bind(this);
	}

	events() {
		var _thisClass = this;

		var interval = setInterval(function() {
			if (document.readyState === 'complete') {
				clearInterval(interval);
				_thisClass.pageLoaded = true;
			}
		}, 100);
	}

	init() {
		console.log('Preloader');

		this.events();

		this.timeline = new TimelineMax({
			repeat: -1,
			repeatDelay: 0
		});

		this.timeline.set(this.O, {
			autoAlpha: 0
		});

		this.timeline.set(this.X, {
			autoAlpha: 0
		});

		this.timeline.set(this.Y, {
			autoAlpha: 0
		});

		this.timeline.set(this.LOWCARBON, {
			autoAlpha: 0
		});

		this.timeline.set(this.VENTURES, {
			autoAlpha: 0
		});

		this.timeline.set(this.entireLogo, {
			scale: 0.85
		});

		this.timeline.set(this.upper, {
			autoAlpha: 1
		});

		this.timeline.set(this.lower, {
			autoAlpha: 1
		});

		this.timeline.add(
			TweenMax.to(this.entireLogo, 3, {
				scale: 1.0,
				onComplete: this.animationComplete
			}),
			0
		);

		this.timeline.add(
			TweenMax.fromTo(
				this.topMask,
				2,
				{
					drawSVG: '0% 0%'
				},
				{
					drawSVG: '0% 100%',
					ease: this.easingValue,
					onComplete: function() {
						console.log('done');
					}
				}
			),
			0
		);

		this.timeline.add(
			TweenMax.fromTo(
				this.bottomMask,
				2,
				{
					drawSVG: '0% 0%'
				},
				{
					drawSVG: '0% 100%',
					ease: this.easingValue,
					onComplete: function() {
						console.log('done');
					}
				}
			),
			0
		);

		this.timeline.add(
			TweenMax.to(this.O, 0.8, {
				autoAlpha: 1
			}),
			0.3
		);

		this.timeline.add(
			TweenMax.to(this.X, 0.8, {
				autoAlpha: 1
			}),
			0.6
		);

		this.timeline.add(
			TweenMax.to(this.Y, 0.8, {
				autoAlpha: 1
			}),
			0.4
		);

		this.timeline.add(
			TweenMax.to(this.LOWCARBON, 2, {
				autoAlpha: 1
			}),
			0.8
		);

		this.timeline.add(
			TweenMax.to(this.VENTURES, 2, {
				autoAlpha: 1
			}),
			1
		);

		this.timeline.add(
			TweenMax.to(this.entireLogo, 0.8, {
				autoAlpha: 0
			}),
			4
		);

		this.timeline.play();
	}

	animationComplete() {
		console.log('Complete: ' + this.pageLoaded);
		if (this.pageLoaded) {
			this.timeline.pause();
			$('.preloader').delay(200).fadeOut();
		}
	}
}

export default Preloader;
