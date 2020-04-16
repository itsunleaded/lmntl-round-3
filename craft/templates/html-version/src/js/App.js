import 'popper.js';
import 'bootstrap';

import Preloader from './modules/Preloader';
import Navigation from './modules/Navigation';
import MatchHeight from './modules/MatchHeight';
import calloutHoverBackground from './components/calloutHoverBackground';
import headerBackgroundVideo from './components/headerBackgroundVideo';
import leadershipTeam from './components/leadershipTeam';
import resourcesOverview from './components/resourcesOverview';
import Lightbox from './modules/Lightbox';

document.addEventListener('DOMContentLoaded', () => {
	const preloader = new Preloader();
	const navigation = new Navigation();
	const match = new MatchHeight();
	const hoverBackground = new calloutHoverBackground();
	const headerVideo = new headerBackgroundVideo();
	const leadership = new leadershipTeam();
	const resources = new resourcesOverview();
	const lightbox = new Lightbox();

	preloader.init();
	navigation.init();
	match.init();
	hoverBackground.init();
	headerVideo.init();
	leadership.init();
	lightbox.init();

	if ($('section').hasClass('resourcesOverview')) resources.init();
});
