import 'jquery-match-height';

class MatchHeight {
	constructor() {}

	init() {
		console.log('Initialize Match Height');
		$('.calloutHoverBackground__content').matchHeight({
			byRow: false
		});

		$('.sectionTwoColumnSolidBackground--match-left').matchHeight({
			byRow: false
		});

		$('.sectionTwoColumnSolidBackground--match-right').matchHeight({
			byRow: false
		});

		if ($(window).width() > 1200) {
			$('.sectionTwoColumnSolidBackground h2').matchHeight({
				byRow: true
			});
		}
	}
}

export default MatchHeight;
