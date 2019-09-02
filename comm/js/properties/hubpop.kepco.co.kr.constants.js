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
            ]
		},
        loginUrl: '/#/login',
        uaaContextUrl : '/comm-api/api/portal/v1',
		paasApiCfContextUrl : '/paas-api/api/portal/v1',
		paasApiCoreContextUrl : '/paas-api/api/core',
        paasApiMarketContextUrl : '/paas-api/api/market',
        iaasApiContextUrl: '/iaas-api/api/iaas/v1.0',
        iaasApiCfContextUrl : '/iaas-api/api/iaas/v1.0',
        iaasApiMarketContextUrl : '/iaas-api/api/iaas/v1.0/market',
        monitApiContextUrl: '/monit-api/api/monit/v1.0',
        monitNewApiContextUrl: '/monit-api/v2',
		layoutTemplateUrl : {
			navigation : _LAYOUT_VIEWS_ + '/navigation.html',
			leftMenu : _LAYOUT_VIEWS_ + '/menu/consoleLeftMenu.html',
			mainTop : _LAYOUT_VIEWS_ + '/mainTop.html',
		},
		mainBody: {
			templateUrl: _LAYOUT_VIEWS_ + '/mainBody.html',
			controller: 'mainBodyCtrl',
			controllerAs: 'mainBody'
		},
		popCommFormUrl: _COMM_VIEWS_ + '/common/popCommForm.html',
        rightPopCommFormUrl: _COMM_VIEWS_ + '/common/rightPopCommForm.html',
        popAlertFormUrl: _COMM_VIEWS_ + '/common/popAlertForm.html',
        popAlertFormUrl2: _COMM_VIEWS_ + '/common/popAlertForm2.html',
        xpertHosts : {
            mysqlDB : "dbwebxpert.ps.hubpop.io",
            webLog : "weblog.ps.hubpop.io",
            terminal : "terminal.ps.hubpop.io",
            autoScaler : "autoscaler.ps.hubpop.io"
        },
        homeUrl: '/#/',
        homePath: '/',
        commHomeState: 'commProjectMgmt',
        commHomeUrl: '#/',
        commHomePath: '/',
        notLoginAcceptPages: [
        	"/login",
			"/signup",
			"/verify"
		],
        loginAcceptPages: [
            "/login"
        ],
        userSettingKeys: {
            commLeftLinkIconsKey: "COMM_LEFT_LINK_ICONS_KEY",
            reductAsidesKey: "REDUCT_ASIDES",
            myProjectsKey: "MY_PROJECTS",
            myJobsKey: "MY_JOBS",
            myQuickMenusKey: "MY_QUICK_MENUS"
        },
        rdpConnect : {
            baseDomain : "wins.hubpop.io",
            port : "20025"
        },
        iaasDef : {
            insMaxDiskSize: 2048
        },
        loadingProgressBar : {
        	top : 80,
            down : 30
		},
        dataTimePickerLanguages : {
        	"ko" : {
				title: 'korean',
				monthsNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
				daysNames: ['일', '월', '화', '수', '목', '금', '토'],
				todayBtn: "오늘"
            },
			"en" : {
				title: 'English',
				monthsNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				daysNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
				todayBtn: 'Today'
            }
		},
        itemBoxBgTypes : [
            {id: "colorType1", label: "comm.label.white", iconClass: "color1", bgColorType: 'color-type1', bgImage: ''}
            , {id: "colorType2", label: "comm.label.blue", iconClass: "color2", bgColorType: 'color-type2', bgImage: ''}
            , {id: "colorType3", label: "comm.label.orange", iconClass: "color3", bgColorType: 'color-type3', bgImage: ''}
            , {id: "colorType4", label: "comm.label.mint", iconClass: "color4", bgColorType: 'color-type4', bgImage: ''}
            , {id: "image1", label: "comm.label.background_image", iconClass: "file-att", bgColorType: 'color-no', bgImage: 'images/im_sample_pic.jpg'}
        ],
        deployTypes : [
            {id: 1, type: "CP", name: "Compute", iconFileName: "im_thum_compute_n"},
            {id: 2, type: "LB", name: "Load Balance", iconFileName: "im_thum_lb_n"},
            {id: 3, type: "WEB", name: "WEB", iconFileName: "im_thum_web_n"},
            {id: 4, type: "WAS", name: "WAS", iconFileName: "im_thum_was_n"},
            {id: 5, type: "DB", name: "DB", iconFileName: "im_thum_db_n"},
            // TODO : WWD는 현재 지원 하지 않음
            //{id: 6, type: "WWD", name: "WEB/WAS/DB", iconFileName: "im_thum_wwd_n"}
        ],
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
			"php" : "text/plain"
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
		productCode: {
        	service: [ "IaaS", "PaaS", "DevOps" ],
			division: {
        		iaasDivision  : [
        			{ code: "computing", name: "컴퓨팅"   },
					{ code: "storage",   name: "스토리지" },
					{ code: "network",   name: "네트워크" }
				],
                paasDivision  : [
                	{ code: "public",    name: "공유형" },
					{ code: "dedicated", name: "단독형" }
				],
                devOpsDivision: [
                	{ code: "GIT", name: "GitXpert"  },
					{ code: "CI",  name: "CiXpert"   },
					{ code: "IDE", name: "WideXpert" }
				]
			},
            type: {
                iaasType: {
                    computing: [
                    	{ code: "Server", name: "Server" }
                    ],
                    storage : [
                        //{ code: "Block",  name: "Block Storage"  },
                        //{ code: "Object", name: "Object Storage" }
                        "Block", "Object"
                    ],
                    network : [
                    	{ code: "inBound",  name: "인바운드"  },
                        { code: "outBound", name: "아웃바운드" }
                    ]
                },
                paasType: {
                    public   : [],
                    dedicated: []
                },
                devOpsType: {
                    GIT: [ "Repository" ],
                    CI : [ "Pipeline"   ],
                    IDE: [ "WideXpert"  ]
                }
            },
            unit_code: {
                iaasUnitCode: {
                    computing: [],
                    storage  : [ "HDD", "SSD" ],
                    network  : [ "GB" ]
                }
            }
		},
		defultOrgLimit : 10,
        //monit 추가
        pageSize : 10,
        server_status_color : {
            "정상" : "normality",
            "경고" : "caution",
            "심각" : "warning",
            "장애" : "warning",
            "비정상" : "warning"
        },
        rangeTypeName : {
            "5m" : "최근 5분",
            "15m" : "최근 15분",
            "30m" : "최근 30분",
            "1h" : "최근 1시간",
            "3h" : "최근 3시간",
            "6h" : "최근 6시간",
            "12h" : "최근 12시간",
            "1d" : "최근 1일",
            "1w" : "이번주",
            "1M" : "이번달",
            "3M" : "최근 3달"
        },
        rangeShow : {
            "isMinute" : false,
            "isHour" : false,
            "isDay" : false,
            "isWeek" : false,
            "isMonth" : false,
            "isManual" : false
        },
        intervalTime : 10,
        intervalOptions : [
            {key : '', name : '중지'},
            {key : 10, name : '10초'},
            {key : 20, name : '20초'},
            {key : 30, name : '30초'},
            {key : 60, name : '1분'}
        ],
        roleName : {
            owner: 'OWNER',
            admin: 'ADMIN',
            user: 'USER'
        },
        ///특정 에러 문구 에러 메시지에 나타나지 않도록 수정. 2019.07.25
        errorMessageSkip : [
            "Not Found",
            "Internal Server Error"
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
        ],
        nodeKey: {
            CONTROLLER: 'ctr',
            STORAGE: 'stg',
            COMPUTE: 'cpt',
            NETWORK: 'net',
            TENANT: 'tnt'
        },
        resourceKey: {
            CPU: 'cpu',
            MEM: 'memory',
            DSK: 'disk'
        },
        alarmLevel: [
            {value: 'failed', name: '다운'},
            {value: 'minor', name: '주의'},
            {value: 'wran', name: '경고'},
            {value: 'cri', name: '위험'},
            {value: 'clear', name: '알람해제'}
        ],
        resolveStatus: [
            {value: '2', name: '처리완료'},
            {value: '1', name: 'Alarm 발생'}
        ],
        alarmBell: 1000*60*1,
        timeRangeFormat: 'YYYY-MM-DD HH:mm'
    })
    .constant('tenantChartConfig', [
        {id: 1, nodeid: 'cpu_usage', name: 'CPU 사용률',                func: 'tenantCpuUsageList',             type: 'lineChart', percent: true,  axisLabel: '%'},
        {id: 2, nodeid: 'cpu_load_usage', name: 'CPU Load 사용률',      func: 'tenantCpuLoad1mList',            type: 'lineChart', percent: false, axisLabel: '1m, 5m, 15m'},
        {id: 3, nodeid: 'mem_swap', name: 'Swap',                      func: 'tenantMemorySwapList',           type: 'lineChart', percent: true,  axisLabel: '%'},
        {id: 4, nodeid: 'mem_usage', name: '메모리 사용률',             func: 'tenantMemoryUsageList',          type: 'lineChart', percent: true,  axisLabel: '%'},
        {id: 5, nodeid: 'dsk_usage', name: '디스크 사용률',             func: 'tenantDiskUsageList',            type: 'lineChart', percent: true,  axisLabel: '%'},
        {id: 6, nodeid: 'dsk_io', name: '디스크 IO',                    func: 'tenantDiskIOList',            type: 'lineChart', percent: false,  axisLabel: 'KB / Sec'}
    ])
    .constant('tenantNetChartConfig', [
        {id: 1, nodeid: 'net_io_kb', name: '네트워크 IO KByte',         func: 'tenantNetworkIOKByteList',       type: 'lineChart', percent: false, axisLabel: 'KB / Sec'},
        {id: 2, nodeid: 'net_error', name: '네트워크 Error',            func: 'tenantNetworkErrorList',         type: 'lineChart', percent: false, axisLabel: 'Count'},
        {id: 3, nodeid: 'net_drop', name: '네트워크 Dropped Packet',   func: 'tenantNetworkDroppedPacketList', type: 'lineChart', percent: false, axisLabel: 'Count'}
    ])
;
