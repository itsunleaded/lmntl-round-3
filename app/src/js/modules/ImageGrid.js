import Isotope from 'isotope-layout';
class ImageGrid {
	constructor() {}

	init() {
		console.log('Initialize Image Grid');

		var grid = document.querySelector('.grid');
		var iso = new Isotope(grid, {
			itemSelector: '.grid--item',
			percentPosition: true
		});

		var resourcesGrid = document.querySelector('.resources__grid');
		var resourcesIso = new Isotope(resourcesGrid, {
			itemSelector: '.resources--grid-item',
			percentPostion: true
		});
	}
}

export default ImageGrid;
