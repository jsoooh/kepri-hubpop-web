'use strict';

angular.module('app')
	.constant('CONSTANTS', {
        languages : {
			"ko" : [
                { key : "ko", name : "한국어" }
            	, { key : "en", name : "English" }
			],
            "en" : [
                { key : "ko", name : "한국어" }
                , { key : "en", name : "English" }
            ],
		},
        loginUrl: '/#/login',
        loginPath: '/login',
        loginState: 'login',
        version: '0.0.1',
        context: '/',
        apiServer: '/comm-api/api/portal',
        apiVersion: '/v1',
        consoleUrl: window.location.origin + '/console',
        uaaContextUrl : '/comm-api/api/portal/v1',
        paasApiCfContextUrl : '/paas-api/api/portal/v1',
        paasApiCoreContextUrl : '/paas-api/api/core',
        paasApiMarketContextUrl : '/paas-api/api/market',
        iaasApiContextUrl: '/iaas-api/api/iaas/v1.0',
		layoutTemplateUrl : {
			navigation : _LAYOUT_VIEWS_ + '/navigation.html',
            footer : _LAYOUT_VIEWS_ + '/footer.html',
		},
		mainBody: {
			templateUrl: _VIEWS_ + '/mainBody.html',
			controller: 'mainBodyCtrl',
			controllerAs: 'mainBody'
		},
		popCommFormUrl: _VIEWS_ + '/common/popCommForm.html',
        popAlertFormUrl: _VIEWS_ + '/common/popAlertForm.html',
        homeUrl: '/',
        homePath: '/',
        homeHrefPath: '/paas/',
        notLoginAcceptPages: [
        	"/login",
			"/intro",
			"/verify"
		],
        loginAcceptPages: [
            "/login"
        ],
        loadingProgressBar : {
        	top : 80,
            down : 30
		},
        dataTimePickerLanguages : {
        	"ko" : {
				title: 'korean',
				monthsNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
				daysNames: ['일', '월', '화', '수', '목', '금', '토'],
				todayBtn: "오늘",
            },
			"en" : {
				title: 'English',
				monthsNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				daysNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				todayBtn: 'Today',
            }
		},
		defultMintype : "application/octet-binary",
        minTypes : {
			"pdf" : "application/pdf",
			"txt" : "text/plain",
			"html" : "text/html",
			"exe" : "application/octet-stream",
			"zip" : "application/zip",
			"doc" : "application/msword",
			"xls" : "application/vnd.ms-excel",
			"ppt" : "application/vnd.ms-powerpoint",
			"gif" : "image/gif",
			"png" : "image/png",
			"jpeg" : "image/jpg",
			"jpg" : "image/jpg",
			"php" : "text/plain",
		},

        phoneNumbers: [      //전화 지역번호
            { no: "02" },
            { no: "031" },
            { no: "032" },
            { no: "033" },
            { no: "041" },
            { no: "042" },
            { no: "043" },
            { no: "051" },
            { no: "052" },
            { no: "053" },
            { no: "054" },
            { no: "055" },
            { no: "061" },
            { no: "062" },
            { no: "063" },
            { no: "064" },
            { no: "0303" },
            { no: "0502" },
            { no: "0503" },
            { no: "0504" },
            { no: "0505" },
            { no: "0506" },
            { no: "070" },
            { no: "080" }
        ],
        //임시 이메일 주소 체크
        tempEmail : [
            "ax80mail.com",
            "balanc3r.com",
            "bareed.ws",
            "c1oramn.com",
            "cd.mintemail.com",
            "cobin2hood.com",
            "copyhome.win",
            "cozaco.men",
            "crymail2.com",
            "disbox.net",
            "disbox.org",
            "dispostable.com",
            "grr.la",
            "guerrillamail.biz",
            "guerrillamail.com",
            "guerrillamail.de",
            "guerrillamail.info",
            "guerrillamail.net",
            "guerrillamail.org",
            "guerrillamailblock.com",
            "happyhs.party",
            "hitbts.com",
            "iralborz.bid",
            "japorms.trade",
            "jiwanpani.science",
            "joyandkin.cricket",
            "kadaj.date",
            "kcstore.faith",
            "kopame.review",
            "koreakr.review",
            "kukov.download",
            "kumli.racing",
            "letsmail9.com",
            "maildrop.cc",
            "mailinator.com",
            "mailnesia.com",
            "mimimin.webcam",
            "minex-coin.com",
            "moakt.co",
            "moakt.ws",
            "muimail.com",
            "mvrht.net",
            "mytempemail.com",
            "mytrashmailer.com",
            "named.accountant",
            "no-spam.ws",
            "pokemail.net",
            "ppomppu.win",
            "rael.cc",
            "ruu.kr",
            "sarang.men",
            "sarang.stream",
            "sharklasers.com",
            "spam4.me",
            "tm2mail.com",
            "tmail.ws",
            "tmails.net",
            "tmpmail.net",
            "tmpmail.org",
            "todayhumor.loan",
            "trashmail.ws",
            "wimsg.com",
            "wonwonkrw.date",
            "xoixa.com",
            "yopmail.com"
        ]
	})
;
