
(function($) {
    "use strict";
	
	$('#projects').imagesLoaded(function() {
		// init Isotope
		var $grid = $('.projects-main').isotope({
			itemSelector: '.pro-item',
			percentPosition: true,
			masonry: {
				// use outer width of grid-sizer for columnWidth
				columnWidth: '.pro-item',
			}
		});
		// filter items on button click
		$('.project-menu').on('click', 'button', function() {
			var filterValue = $(this).attr('data-filter');
			$grid.isotope({ filter: filterValue });
		});
	});
	$('.project-menu button').on('click', function(event) {
		$(this).siblings('.active').removeClass('active');
		$(this).addClass('active');
		event.preventDefault();
	});    

})(jQuery);