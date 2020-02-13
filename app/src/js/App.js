import 'popper.js';
import 'bootstrap';

import Preloader from './modules/Preloader';
import Navigation from './modules/Navigation';
import MatchHeight from './modules/MatchHeight';
import ImageFill from './modules/ImageFill';
import ImageGrid from './modules/ImageGrid';
import Map from './modules/Map';

document.addEventListener('DOMContentLoaded', () => {
	const preloader = new Preloader();
	const navigation = new Navigation();
	const match = new MatchHeight();
	const fill = new ImageFill();
	const grid = new ImageGrid();
	const map = new Map();

	preloader.init();
	navigation.init();
	match.init();
	fill.init();
	grid.init();
	map.init();
});
