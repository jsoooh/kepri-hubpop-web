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
        loginUrl: './#/login',
        uaaContextUrl : './comm-api/api/portal/v1',
		paasApiCfContextUrl : './paas-api/api/portal/v1',
		paasApiCoreContextUrl : './paas-api/api/core',
        paasApiMarketContextUrl : './paas-api/api/market',
        iaasApiContextUrl: './iaas-api/api/iaas/v1.0',
        iaasApiCfContextUrl : './iaas-api/api/iaas/v1.0',
        iaasApiMarketContextUrl : './iaas-api/api/iaas/v1.0/market',
        gpuApiContextUrl: '/gpu-api/api/iaas/v1.0',
        monitApiContextUrl: './monit-api/api/monit/v1.0',
        monitNewApiContextUrl: './monit-api/v2',
		layoutTemplateUrl : {
			navigation : _LAYOUT_VIEWS_ + '/navigation.html',
			leftMenu : _LAYOUT_VIEWS_ + '/menu/consoleLeftMenu.html',
			mainTop : _LAYOUT_VIEWS_ + '/menu/topTitle.html'
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
            mysqlDB : "dbwebxpert.kepri-dev.crossent.crossent.com",
            webLog : "weblog.kepri-dev.crossent.com",
            terminal : "terminal.kepri-dev.crossent.com",
            autoScaler : "autoscaler.ps..kepri-dev.crossent.crossent.com"
        },
        portForwardingDomainName: 'hubproxy.kepco.co.kr',
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
            myQuickMenusKey: "MY_QUICK_MENUS",
            personalProjectCnt: "personal_project_cnt",
            userMenuBookmark: "user_menu_bookmark",     //사용자 my service
            userSltProjectOrg: "user_slt_org"
        },
        rdpConnect : {
            baseDomain : "wins.hubpop.io",
            port : "20025"
        },
        iaasDef : {
            insMaxDiskSize: 500
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
            {id: 5, type: "DB", name: "DB", iconFileName: "im_thum_db_n"}
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
        timeRangeFormat: 'YYYY-MM-DD HH:mm',
        tempNoticeData : {
            "data":[
                {
                    "NOTICE_NO":6,
                    "TITLE":"패키지 미러 서버(http://mirror.kepco.co.kr) 오픈 알림",
                    "POP_YN":"Y",
                    "START_DT":"2020-03-02",
                    "END_DT":"2020-05-12",
                    "CONTENTS":"<p>안녕하세요.</p><p>플랫폼 관리자입니다.</p><p>사내망에서 활용할 수 있는 패키지 미러링 서버를 아래의 URL로 구축하였습니다.</p><p>&nbsp;</p><p><a href=\"http://mirror.kepco.co.kr\">http://mirror.kepco.co.kr</a></p><p>&nbsp;</p><p>제공하는 패키지는 CentOS, Ubuntu, Python, R 등이며, </p><p>첨부의 매뉴얼을 참고하시어 활용하시기 바랍니다.</p><p>감사합니다.</p>",
                    "ATTACH_FILE":"239|05. Jupyterlab 실행방법.txt,240|02. Ubuntu GPU 가상서버 설정 방법-2.txt,241|01. CentOS GPU 가상서버 설정 방법.txt,242|02. Ubuntu GPU 가상서버 설정 방법-2.txt,243|03. Python3.6 및 Jupyterlab 설치 방법.txt,244|04. GPU 가상서버 접속방법.txt",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                },
                {
                    "NOTICE_NO":7,
                    "TITLE":"공지사항2222222222",
                    "POP_YN":"Y",
                    "START_DT":"2020-03-02",
                    "END_DT":"2020-05-12",
                    "CONTENTS":"<p>(서울=연합뉴스) 이상헌 임형섭 박경준 기자 = 청와대는 24일 러시아 군용기의 독도 영공 침범과 관련해 <a href=\"http://www.naver.com\">http://www.naver.com</a>를 긴급 발진하면서 독도를 일본 땅이라는 억지를 부린 데 대해 '일본은 &quot;일본방공식별구역(JADIZ)&quot;에 대한 부분만 갖고 입장을 내면 될 것 같다'는 반박 입장을 밝혔다.</p>\n<p>청와대 관계자는 이날 기자들을 만나 이같이 언급한 뒤 '우리 영공에 대한 문제는 우리가 답할 부분'이라고 말했다.</p><p>(서울=연합뉴스) 이상헌 임형섭 박경준 기자 = 청와대는 24일 러시아 군용기의 독도 영공 침범과 관련해 일본 정부가 자위대 군용기를 긴급 발진하면서 독도를 일본 땅이라는 억지를 부린 데 대해 '일본은 일본방공식별구역(JADIZ)에 대한 부분만 갖고 입장을 내면 될 것 같다'는 반박 입장을 밝혔다.<br>청와대 관계자는 이날 기자들을 만나 이같이 언급한 뒤 '우리 영공에 대한 문제는 우리가 답할 부분'이라고 말했다.</p>",
                    "ATTACH_FILE":"219|hubpop-rootca.crt,220|인증서등록방법.pdf",
                    "COMMON_CD":"CD0021",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2019-05-30",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2019-05-30",
                    "DELETE_YN":"N"
                },
                {
                    "NOTICE_NO":37,
                    "TITLE":"서버가상화 재오픈 알림",
                    "POP_YN":"Y",
                    "START_DT":"2020-10-13",
                    "END_DT":"2020-10-14",
                    "CONTENTS":"<p>안녕하세요.</p><p>HUB-PoP 플랫폼 관리자입니다.</p><p>&nbsp;</p><p>서버가상화 재오픈되었습니다.&nbsp;</p><p>서버생성이 필요한 경우 쿼터 변경 신청 후 담당자에게 메일주시면 승인 후 사용가능합니다.</p><p>담당자 : &nbsp;임정선 (jeongseon_im@kepco.co.kr, 042-865-5239)</p>",
                    "ATTACH_FILE":"",
                    "COMMON_CD":"CD0024",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2020-10-13",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2020-10-13",
                    "DELETE_YN":"N"
                },
                {
                    "NOTICE_NO":38,
                    "TITLE":"SW개발플랫폼 소스코드 저장소 URL 변경 알림",
                    "POP_YN":"Y",
                    "START_DT":"2020-10-26",
                    "END_DT":"2020-10-30",
                    "CONTENTS":"<p>안녕하세요.</p><p>HUB-PoP 플랫폼 운영자입니다.</p><p>HUB-PoP 플램폼의 소스코드 저장소에서 제공하는 SVN과 Git의 URL이 다음과 같이 변경되었습니다.&nbsp;</p><p>SVN : <a href='http://100.216.232.24:39080'>http://100.216.232.24:39080</a> &nbsp;</p><p>Git : <a href='100.216.232.124:38085'>http://100.216.232.124:38085</a>&nbsp;</p><p>&nbsp;</p><p>감사합니다.</p>",
                    "ATTACH_FILE":"",
                    "COMMON_CD":"CD0025",
                    "COMMON_NM":"공통",
                    "REG_USER_ID":"hubpop",
                    "REG_USER_NM":"허브팝",
                    "REG_DT":"2020-10-26",
                    "UPT_USER_ID":"hubpop",
                    "UPT_USER_NM":"허브팝",
                    "UPT_DT":"2020-10-26",
                    "DELETE_YN":"N"
                }
            ],
                "status":{
                "code":200,
                    "name":"OK"
            }
        },
        //neutron lbaas.loadbalancer/pool : 10
        lbaasPortLimit : 10,
        ckeditorConfig: {
            language: 'ko-kr',
            toolbar: [
                ['Source', '-', 'Preview'],
                ['Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo'],
                ['Bold', 'Italic', 'Underline'],
                ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
                ['Styles', 'Format', 'Font', 'FontSize'],
                ['TextColor', 'BGColor'],
                ['Table', 'SpecialChar', 'Link', 'Unlink']
            ]
        },
        startYear: 2019,
        startMonth: 12,
        monitoringUrl: 'http://192.168.0.7:3000/d/hb7fSE0taa/tenant_linux_detail',
        vmCatalog: {
            monCollectHostBeat: '100.216.222.84',
            monCollectPortBeat: '9201',
            imageId: {
                hadoop: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                haproxy: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                kafka: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                kong: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                mariadb: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                galeraMariadb: '8e0ff10c-cdf2-4eb0-b708-63856aecadde',
                mongodb: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                mysql: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                galeraMysql: '8e0ff10c-cdf2-4eb0-b708-63856aecadde',
                nginx: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                postgresql: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                rabbitmq: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                redis: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
                tomcat: 'c5c6af6c-3cfc-43ff-a3cf-199ffff646b1',
            }
        }
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
