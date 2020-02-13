const mapboxgl = require('mapbox-gl/dist/mapbox-gl');

class Map {
	constructor() {
		this.accessToken =
			'pk.eyJ1IjoibWlzdGVyc2VsZnJlZmxlY3Rpb24iLCJhIjoiY2l5dnp5bHNlMDBndTMzbzI1b2pubWNydyJ9.dnJ7WJzdptpPae9FpnUnGw';
		this.containerId = 'map';
		this.mapStyleUrl = 'mapbox://styles/misterselfreflection/ck6ea48qt30cb1ilbzoikj776';
	}

	init() {
		console.log('Initialize Map');
		mapboxgl.accessToken = this.accessToken;
		this.map = new mapboxgl.Map({
			container: this.containerId,
			style: this.mapStyleUrl,
			center: [ -95.399529, 29.81978 ],
			zoom: 9
		});
	}
}

export default Map;
