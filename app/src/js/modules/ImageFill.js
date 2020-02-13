import 'imagesloaded';
import 'imagefill';

class ImageFill {
	constructor() {}

	init() {
		console.log('Initialize Image Fill');
		$('.section__image-container').imagefill();
	}
}

export default ImageFill;
