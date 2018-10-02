'use strict';

angular.module('portal.controllers').controller('commTutorialCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache) {

	_DebugConsoleLog('tutorialControllers.js Start', 1);

	var contents = this;
	
	contents.tabWrap = true;
	
	(function() {
		$(document).ready(function() {
			setTimeout("reset();", 100);
		});

		$(".action-left").on("click", function() {
			setTimeout("reset();", 300);
			$('.nav-tabs').scrollingTabs('refresh');
		});

		$('.nav-tabs').scrollingTabs({
			cssClassLeftArrow : 'ico btn-left',
			cssClassRightArrow : 'ico btn-right'
		});

		$(window).on("resize", function() {
			setTimeout("reset();", 300);
		}).trigger("resize");

	//li개수 3개이하일때 스크롤링 버튼 show/hide 처리
		function btnShowHide(){
				if ( $('.nav-tabs li').length > 3) 
				{
					$('.scrtabs-tab-scroll-arrow').show();
				}
				else{
					$('.scrtabs-tab-scroll-arrow').hide();
				}	
		}
		btnShowHide();
		
	}());
	
	//스크롤 사이드메뉴
	$(function(){  
		var currentPosition = parseInt($(".sideMenu").css("top")); 
		    $(window).scroll(function() { 
		            var position = $(window).scrollTop(); // 현재 스크롤바의 위치값을 반환합니다. 
		            $(".sideMenu").stop().animate({"top":position+currentPosition+"px"},300); 
		    });
		});
	
	//페이지 상단으로 이동하기
		$(".btn_top").click(function() {
			$('html, body').animate({
				scrollTop : 0
			}, 400);
			
			return false;
			
		});

	_DebugConsoleLog('tutorialControllers.js End', 1);

});