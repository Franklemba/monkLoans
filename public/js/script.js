(function($) {

	"use strict";
	
		// Mouse pointer
		$(".wrapper-main").prepend("<div class='mouse-pointer'></div>");

		function showCoords(event) {
			var x = event.pageX;
			var y = event.pageY;
			var follower = $(".mouse-pointer");
			follower.css({
				left: x + (-12.5) + "px",
				top: y + (-12.5) + "px",
			});

		}
		
		$(window).on("mousemove", function(event) {
			showCoords(event);
		});

		$("li, a, button, input, textarea, .navbar-toggles").mouseenter(function () {
			$(".mouse-pointer").css("opacity", "0");
			$("li, a, button, input, textarea, .navbar-toggles").mouseleave(function () {
				$(".mouse-pointer").css("opacity", "1");
			});
		});
		
		
		// fixed-menu
		$(window).on('scroll', function () {
			if ($(window).scrollTop() > 50) {
				$('.top-nav').addClass('fixed-menu');
			} else {
				$('.top-nav').removeClass('fixed-menu');
			}
		});

		
		// blog-slider
		$("#blog-slider").owlCarousel({
			items:3,
			itemsDesktop:[1199,3],
			itemsDesktopSmall:[1000,2],
			itemsMobile : [650,1],
			navigationText:false,
			autoPlay:true
		});
		
		// customers-slider
		$("#customers-slider").owlCarousel({
			items:5,
			itemsDesktop:[1199,5],
			itemsDesktopSmall:[1000,3],
			itemsMobile : [650,2],
			navigationText:false,
			autoPlay:true
		});
		
	
})(window.jQuery);	