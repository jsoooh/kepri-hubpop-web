'use strict';

function _DebugConsoleLog(message, level) {
    if (_MODE_ == "DEBUG" && (level == undefined || level == null || level <= _DEBUG_LEVEL_)) {
        var args = Array.prototype.slice.call(arguments, 2);
        console.log(message, level, args);
    }
}

function _DebugConsoleInfo(message) {
    if (_MODE_ == "DEBUG") {
        var args = Array.prototype.slice.call(arguments, 1);
        console.info(message, args);
    }
}

$.fn.preload = function() {
    this.each(function(){
        $('<img/>')[0].src = this;
    });
}

/*
 $(['images/menu_icon/ic_board_hover.png']).preload();
 */

Map = function(){
    this.map = new Object();
};

Map.prototype = {
    put : function(key, value){
        this.map[key] = value;
    },
    get : function(key){
        return this.map[key];
    },
    containsKey : function(key){
        return key in this.map;
    },
    containsValue : function(value){
        for(var prop in this.map){
            if(this.map[prop] == value) return true;
        }
        return false;
    },
    isEmpty : function(){
        return (this.size() == 0);
    },
    clear : function(){
        for(var prop in this.map){
            delete this.map[prop];
        }
    },
    remove : function(key){
        delete this.map[key];
    },
    keys : function(){
        var keys = new Array();
        for(var prop in this.map){
            keys.push(prop);
        }
        return keys;
    },
    values : function(){
        var values = new Array();
        for(var prop in this.map){
            values.push(this.map[prop]);
        }
        return values;
    },
    size : function(){
        var count = 0;
        for (var prop in this.map) {
            count++;
        }
        return count;
    }
};

$.fn.preload = function() {
    this.each(function(){
        $('<img/>')[0].src = this;
    });
}

/*
 $(['images/menu_icon/ic_board_hover.png']).preload();
 */

var cmm = {};
cmm.getDateTime = function (str) {
	// yyyy-mm-dd hh:MM:ss => 1970-01-01 00:00:00
	var date = new Date(str);
	var year = date.getFullYear();
	var month = ("0" + (date.getMonth() + 1)).substr(-2);
	var day = ("0" + date.getDate()).substr(-2);
	var hour = ("0" + date.getHours()).substr(-2);
	var minutes = ("0" + date.getMinutes()).substr(-2);
	var seconds = ("0" + date.getSeconds()).substr(-2);
	return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
};
cmm.getDateTTime = function (str) {
	// yyyy-mm-dd'T'hh:MM:ss => 1970-01-01T00:00:00
	var date = new Date(str);
	var year = date.getFullYear();
	var month = ("0" + (date.getMonth() + 1)).substr(-2);
	var day = ("0" + date.getDate()).substr(-2);
	var hour = ("0" + date.getHours()).substr(-2);
	var minutes = ("0" + date.getMinutes()).substr(-2);
	var seconds = ("0" + date.getSeconds()).substr(-2);
	return year + '-' + month + '-' + day + 'T' + hour + ':' + minutes + ':' + seconds;
};
cmm.getDate = function (str) {
	// yyyy-mm-dd => 1970-01-01
	var date = new Date(str);
	var year = date.getFullYear();
	var month = ("0" + (date.getMonth() + 1)).substr(-2);
	var day = ("0" + date.getDate()).substr(-2);
	return year + '-' + month + '-' + day;
};
cmm.getTime = function (str) {
	// hh:MM:ss => 00:00:00
	var date = new Date(str);
	var hour = ("0" + date.getHours()).substr(-2);
	var minutes = ("0" + date.getMinutes()).substr(-2);
	var seconds = ("0" + date.getSeconds()).substr(-2);
	return hour + ':' + minutes + ':' + seconds;
};
/*
 * string --> 날짜 변경 함수
 *   20180612184537 --> Tue Jun 12 2018 18:45:37 GMT+0900 (한국 표준시)
 * */
cmm.convertStringToDate = function(str){
    var result = new Date(str.slice(0, 4), str.slice(4, 6) - 1, str.slice(6, 8),
                    str.slice(8, 10), str.slice(10, 12), str.slice(12, 14));

    if (result == 'Invalid Date') return null;
    return result;
};
cmm.isMobile = function () {
	var check = false;
	(function (a) {
		if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
			check = true
	})(navigator.userAgent || navigator.vendor || window.opera);
	return check;
};
cmm.compareForSort = function (first, second) {
	if (first.id == second.id)
		return 0;
	if (first.id < second.id)
		return -1;
	else
		return 1;
};

cmm.tooltip = function () {
    setTimeout(function () {
        $(document).ready(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });
    }, 200);
};


// Left Menu Script
// 현재 페이지의 메뉴에 class on
function nowHrefFunction (depth){
    var nowHost = $(location).attr('host');
    var nowPage = $(location).attr('href');
    var nowHref = nowPage.split(nowHost);

    var menuHrefArray = [];
    $("#leftMenu").find('a').each(function(){
        var thisHref = $(this).attr("href");
        if(nowHref[1].match(thisHref)){
            menuHrefArray.push($(this));
        }
    });

    if(menuHrefArray.length > 1){
        // PaaS 2dept class on을 위한 분기 처리
        var appsCheck = nowHref[1].match("/apps");
        var appLogCheck = nowHref[1].match("/appLog");
        if(nowHref[1].match("/paas")){
            for(var i = 0; i < menuHrefArray.length; i++){
                if(menuHrefArray[i].attr("href").match("/apps") && menuHrefArray[i].attr("href").match("/appLog") && appsCheck && appLogCheck){
                    $(menuHrefArray[i]).closest('li.'+depth).find('a.'+depth).addClass("on");
                }else if(menuHrefArray[i].attr("href").match("/apps") && !menuHrefArray[i].attr("href").match("/appLog") && appsCheck && !appLogCheck){
                    $(menuHrefArray[i]).closest('li.'+depth).find('a.'+depth).addClass("on");
                }
            }
        }else{
            $(menuHrefArray[1]).closest('li.'+depth).find('a.'+depth).addClass("on");
        }
    }else{
        $(menuHrefArray[0]).closest('li.'+depth).find('a.'+depth).addClass("on");
    }

}

//1depth click event
function depthProjectOrgClick (evt) {
    var target = $(evt.currentTarget);

    var parentTarget = target.closest('div.gnb-in');

    if (target.hasClass("open")) {
        parentTarget.find('ul.dept2').hide(200);
        parentTarget.find('a.dept1').removeClass("open on");

        nowHrefFunction("dept1");

    } else {
        parentTarget.find('ul.dept2').hide(200);
        parentTarget.find('a.dept1').removeClass("open on");

        nowHrefFunction("dept1");

        target.addClass("open on");
        $(target).closest("li.dept1").find("ul.dept2").toggle(200);
    }
};

//1depth click event
function depth1Click (evt) {

    var mainCtrlScope = angular.element(document.getElementById('mainCtrl')).scope();

    //프로젝트 선택 여부 확인
    if(!mainCtrlScope.main.sltPortalOrgId){
        mainCtrlScope.main.showDialogAlert('알림','프로젝트를 선택해주세요.');
        return false;
    }

    var target = $(evt.currentTarget);

    var parentTarget = target.closest('div.gnbMenu');

    if (target.hasClass("open")) {
        target.closest('li.dept1').find('ul.dept2').hide(200);
        target.removeClass("open on");

        nowHrefFunction("dept1");

    } else {
        parentTarget.find('ul.dept2').hide(200);
        parentTarget.find('a.dept1').removeClass("open on");

        nowHrefFunction("dept1");

        target.addClass("open on");
        $(target).closest("li.dept1").find("ul.dept2").toggle(200);
    }
};

function depth2Click (evt) {
    var target = $(evt.currentTarget).closest('div.gnbMenu').find('div.gnb_m_proj');
    target.find('ul.dept2').hide(200);
    target.find('a.dept1').removeClass("open on");
};

//2depth hover event
function depth2Hover (evt,depth) {
    var target = $(evt.currentTarget);

    if(target.hasClass("open")){
        $("#leftMenu").find('ul.dept3').hide();
        $(target).parent().find("ul.dept3").show();
    }else{
        $("#leftMenu").find('a.dept2').removeClass("open on");
        $("#leftMenu").find('ul.dept3').hide();
        $(target).parent().find("ul.dept3").show();

        nowHrefFunction("dept2");

        if(depth != 'no'){
            target.addClass("open on");
        }
    }
};

function depth2LiHover(evt,depth){
    var target = $(evt.currentTarget).find("a.dept2");

    if(target.hasClass("open")){
        $("#leftMenu").find('ul.dept3').hide();
        $(target).parent().find("ul.dept3").show();
    }else{
        $("#leftMenu").find('a.dept2').removeClass("open on");
        $("#leftMenu").find('ul.dept3').hide();
        $(target).parent().find("ul.dept3").show();

        nowHrefFunction("dept2");

        if(depth != 'no'){
            target.addClass("open on");
        }
    }
}
//3depth click event
function depth3Click (evt) {
    var target = $(evt.currentTarget);
    $("#leftMenu").find('a').removeClass("on");
    $("#leftMenu").find('ul.dept3').hide();

    $(target).closest("li.dept2").find("a.dept2").addClass("on");
    $(target).closest("li.dept1").find("a.dept1").addClass("on");

    target.toggleClass("on");
};

function depth3Leave (){
    $("#leftMenu").find('a.dept2').removeClass("open on");
    $("#leftMenu").find('ul.dept3').hide();

    nowHrefFunction("dept2");
}
