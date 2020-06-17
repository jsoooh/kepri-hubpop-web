//treeview 
$(document).ready(function() {
	$('.treeview-animated').mdbTreeview();
});

$(function (){
    $(document).ready(function () {
		$('.treeview-animated-list .nested > li:last-child > a').on('click', function() {
			$(this).next('.nested').toggleClass('last');

			if($(this).hasClass('open') == true) {
				$(this).children().children('i').attr('class', 'fas fa-folder-open')
			} else {
				$(this).children().children('i').attr('class', 'fas fa-folder');
			}
		});

		$('.treeview-line .treeview-animated-list .nested li > a').on('click', function() {
			if($(this).hasClass('open') == true) {
				$(this).children().children('i').attr('class', 'far fa-folder-open')
			} else {
				$(this).children().children('i').attr('class', 'fas fa-folder');
			}
		});
	});	
});