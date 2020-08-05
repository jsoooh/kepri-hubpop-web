'use strict';

angular.module('app')
	.constant('SITEMAP', {
		pages : {
            login: {
                name: 'login',
                stateKey: 'login',
                url: '/login',
                controller: 'commLoginCtrl',
                templateUrl: _COMM_VIEWS_+'/user/login.html',
                mainBodyTemplateUrl : _COMM_VIEWS_+'/loginLayout.html'+_VERSION_TAIL_
            },
            signup: {
                name: 'signup',
                stateKey: 'signup',
                url: '/signup',
                controller: 'commSignupCtrl',
                templateUrl: _COMM_VIEWS_ + '/user/signup.html',
                mainBodyTemplateUrl : _COMM_VIEWS_+'/loginLayout.html'+_VERSION_TAIL_
            }
        },
        leftMenus: {
            common: {
                pageStage : "comm",
                name: "uaaXpert_UI",
                notPAuth: "AA",
                notEdPAuth: "AA",
                mainTop: true,
                menus: {
                    member_edit: {
                        pageStage : "comm",
                        name: 'member_edit',
                        stateKey: 'commMemberEdit',
                        menuDisplayNo : true,
                        url: '/comm/memberEdit/:part',
                        controller: 'commUserEditCtrl',
                        templateUrl: _COMM_VIEWS_ + '/user/userForm.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_COMM_JS_+'/services/memberServices.js'],
                            loadMyControllers: [_COMM_JS_+'/controllers/memberControllers.js'],
                            loadMyDirectives: []
                        }
                    },
                    project: {
                        mainTop: false,
                        name: 'project',
                        icon: "ico2",
                        stateKey: 'commProjectMgmt',
                        url: '/comm/projects/:popup',
                        controller: 'commOrgProjectsCtrl',
                        templateUrl: _COMM_VIEWS_+'/org/orgProjects.html',
                        mainContentsClass: 'pd0',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [_COMM_JS_+'/services/userSettingServices.js',
                                             _COMM_JS_+'/services/orgServices.js',
                                             _COMM_JS_+'/services/quotaServices.js'],
                            loadMyControllers: [_COMM_JS_+'/controllers/orgControllers.js'],
                            loadMyDirectives: []
                        },
                        subPages: {
                            firstProjectMain: {
                                mainTop: true,
                                name: 'first_project_main',
                                stateKey: 'commFirstProjectMain',
                                url: '/comm/projects/first',
                                controller: 'commFirstOrgProjectMainCtrl',
                                templateUrl: _COMM_VIEWS_+'/org/firstOrgProjectMain.html',
                                mainContentsClass: 'pd0'
                            },
                            projectDetail: {
                                mainTop: true,
                                name: 'project_mgmt',
                                stateKey: 'commProjectDetail',
                                url: '/comm/projects/projectDetail/:orgId',
                                controller: 'commOrgProjectDetailCtrl',
                                templateUrl: _COMM_VIEWS_+'/org/orgProjectDetail.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/memberServices.js',
                                                     _COMM_JS_+'/services/projectServices.js'],
                                    loadMyControllers: [_COMM_JS_+'/controllers/orgDetailControllers.js'],
                                    loadMyDirectives: []
                                }
                            },
                            projectCreate: {
                                mainTop: true,
                                name: 'project_create',
                                stateKey: 'commProjectCreate',
                                url: '/comm/project/create',
                                controller: 'commOrgProjectCreateCtrl',
                                templateUrl: _COMM_VIEWS_+'/org/orgProjectCreate.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/memberServices.js'],
                                    loadMyControllers: [],
                                    loadMyDirectives: []
                                }
                            }
                        }
                    },
                    platform_service: {
                        name: "platform_service",
                        notPAuth: "UO",
                        icon: "ico3",
                        subMenus: {
                            platform_service_paas: {
                                name: 'platform_service_paas',
                                path: '/paas'
                            },
                            platform_service_iaas: {
                                name: 'platform_service_iaas',
                                path: '/iaas'
                            },
                            platform_service_monit: {
                                name: 'platform_service_monit',
                                path: '/monit'
                            }
                        }
                    },
                    boards: {
                        menuDisplayNo : true,
                        name: "boards",
                        icon: "uaaOrgs",
                        stateKey: 'commBoards',
                        subMenus: {
                            board_notice: {
                                name: 'board_notice',
                                icon: "paasMarket",
                                stateKey: 'commBoard_notice',
                                url: '/comm/boards/notice',
                                controller: 'commBoardsCtrl',
                                templateUrl: _COMM_VIEWS_+'/board/boards.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/boardServices.js'],
                                    loadMyControllers: [_COMM_JS_+'/controllers/boardControllers.js'],
                                    loadMyDirectives: []
                                },
                                subPages: {
                                    boardDetail: {
                                        menuKey: 'boards',
                                        name: 'board_details',
                                        stateKey: 'commBoardDetailNotice',
                                        url: '/comm/boards/boardDetail/notice/:id',
                                        controller: 'commBoardDetailCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/boardDetail.html'
                                    },
                                    boardCreate: {
                                        menuKey: 'boards',
                                        name: 'board_create',
                                        stateKey: 'commBoardCreateNotice',
                                        url: '/comm/boards/boardCreate/notice',
                                        controller: 'commBoardCreateCtrl',  // 없음
                                        templateUrl: _COMM_VIEWS_+'/board/boardCreate.html'
                                    },
                                    boardUpdate: {
                                        menuKey: 'boards',
                                        name: 'board_update',
                                        stateKey: 'commBoardUpdateNotice',
                                        url: '/comm/boards/boardUpdate/notice/:id',
                                        controller: 'commBoardUpdateCtrl',  // 없음
                                        templateUrl: _COMM_VIEWS_+'/board/boardUpdate.html'
                                    }
                                }
                            },
                            board_faq: {
                                name: 'board_faq',
                                //notPAuth: "U",
                                icon: "paasMarket",
                                stateKey: 'commBoard_faq',
                                url: '/comm/boards/faq',
                                controller: 'commBoardsCtrl',
                                templateUrl: _COMM_VIEWS_+'/board/boards.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/boardServices.js'],
                                    loadMyControllers: [_COMM_JS_+'/controllers/boardControllers.js'],
                                    loadMyDirectives: []
                                },
                                subPages: {
                                    boardDetail: {
                                        menuKey: 'boards',
                                        name: 'board_details',
                                        stateKey: 'commBoardDetailFaq',
                                        url: '/comm/boards/boardDetail/faq/:id',
                                        controller: 'commBoardDetailCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/boardDetail.html'
                                    }
                                }
                            },
                            board_qna: {
                                name: 'board_qna',
                                //notPAuth: "U",
                                icon: "paasMarket",
                                stateKey: 'commBoard_qna',
                                url: '/comm/boards/qna',
                                controller: 'commQnaBoardsCtrl',
                                templateUrl: _COMM_VIEWS_+'/board/qnaBoards.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/boardServices.js'],
                                    loadMyControllers: [_COMM_JS_+'/controllers/boardControllers.js'],
                                    loadMyDirectives: []
                                },
                                // controller: 'commBoardsCtrl',
                                // templateUrl: _COMM_VIEWS_+'/board/boards.html',
                                subPages: {
                                    boardDetail: {
                                        menuKey: 'boards',
                                        name: 'qna_board_details',
                                        // name: 'board_details',
                                        stateKey: 'commBoardDetailQna',
                                        url: '/comm/boards/qna/:id',
                                        controller: 'commQnaBoardDetailCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/qnaBoardDetail.html'
                                        // controller: 'commBoardDetailCtrl',
                                        // templateUrl: _COMM_VIEWS_+'/board/boardDetail.html'
                                    }
                                }
                            },
                            board_data: {
                                name: 'board_data',
                                //notPAuth: "U",
                                icon: "paasMarket",
                                stateKey: 'commBoard_data',
                                url: '/comm/boards/data',
                                controller: 'commBoardsCtrl',
                                templateUrl: _COMM_VIEWS_+'/board/boards.html',
                                loadMyFile: {
                                    loadMyScripts: [],
                                    loadMyServices: [_COMM_JS_+'/services/boardServices.js'],
                                    loadMyControllers: [_COMM_JS_+'/controllers/boardControllers.js'],
                                    loadMyDirectives: []
                                },
                                subPages: {
                                    boardDetail: {
                                        menuKey: 'boards',
                                        name: 'board_details',
                                        stateKey: 'commBoardDetailData',
                                        url: '/comm/boards/boardDetail/data/:id',
                                        controller: 'commBoardDetailCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/boardDetail.html'
                                    }
                                }
                            }
                        }
                    },
                    notification: {
                        menuDisplayNo : false,
                        name: "notification",
                        stateKey: 'commNotification',
                        url: '/comm/notification',
                        controller: 'commNotificationCtrl',
                        templateUrl: _COMM_VIEWS_+'/notification/notification.html',
                        loadMyFile: {
                            loadMyScripts: [],
                            loadMyServices: [],
                            loadMyControllers: [_COMM_JS_+'/controllers/notificationControllers.js'],
                            loadMyDirectives: []
                        }
                    }
                }
            },
            tutorial: {
                pageStage : 'tutorial',
                notPAuth: "AA",
                notEdPAuth: "AA",
                name: "tutorial",
                icon: "ico4",
                loadMyFile: {
                    loadMyScripts: [],
                    loadMyServices: [],
                    loadMyControllers: [_COMM_JS_+'/controllers/tutorialControllers.js'],
                    loadMyDirectives: []
                },
                menus: {
                    tutorial1: {
                        name: 'tutorial1',
                        stateKey: 'commTutorial1',
                        url: '/tutorial/1',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial1.html'
                    },
                    tutorial2: {
                        name: 'tutorial2',
                        stateKey: 'commTutorial2',
                        url: '/tutorial/2',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial2.html'
                    },
                    tutorial3: {
                        name: 'tutorial3',
                        stateKey: 'commTutorial3',
                        url: '/tutorial/3',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial3.html'
                    },
                    tutorial4: {
                        name: 'tutorial4',
                        stateKey: 'commTutorial4',
                        url: '/tutorial/4',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial4.html'
                    },
                    tutorial5: {
                        name: 'tutorial5',
                        stateKey: 'commTutorial5',
                        url: '/tutorial/5',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial5.html'
                    },
                    tutorial6: {
                        name: 'tutorial6',
                        stateKey: 'commTutorial6',
                        url: '/tutorial/6',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial6.html'
                    },
                    tutorial7: {
                        name: 'tutorial7',
                        stateKey: 'commTutorial7',
                        url: '/tutorial/7',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial7.html'
                    },
                    tutorial8: {
                        name: 'tutorial8',
                        stateKey: 'commTutorial8',
                        url: '/tutorial/8',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial8.html'
                    },
                    tutorial9: {
                        name: 'tutorial9',
                        stateKey: 'commTutorial9',
                        url: '/tutorial/9',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial9.html'
                    }/*,

                    /!*,
                    tutorial5: {
                        name: 'tutorial5',
                        stateKey: 'commTutorial5',
                        url: '/tutorial/5',
                        controller: 'commTutorialCtrl',
                        templateUrl: _COMM_VIEWS_ + '/tutorial/tutorial5.html'
                    },*/
                }
            },
            sample: {
                pageStage : "sample",
                name: "sample",
                notPAuth: "AA",
                notEdPAuth: "AA",
                mainTop: true,
                loadMyFile: {
                    loadMyScripts: [],
                    loadMyServices: [],
                    loadMyControllers: [_COMM_JS_+'/controllers/sampleControllers.js'],
                    loadMyDirectives: []
                },
                menus: {
                    sampleIndex: {
                        name: '샘플 목록',
                        stateKey: 'sampleIndex',
                        url: '/sample/index',
                        controller: 'sampleTableCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/index.html'
                    },
                    sampleTable: {
                        name: '1. 일반 테이블',
                        stateKey: 'sampleTable',
                        url: '/sample/table',
                        controller: 'sampleTableCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleTable.html'
                    },
                    sampleTableScroll: {
                        name: '2. 스크롤 테이블',
                        stateKey: 'sampleTableScroll',
                        url: '/sample/table_scroll',
                        controller: 'sampleTableScrollCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleTableScroll.html'
                    },
                    sampleProgressBar: {
                        name: '3. 프로그래스바',
                        stateKey: 'sampleProgressBar',
                        url: '/sample/progress_bar',
                        controller: 'sampleProgressBarCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleProgressBar.html'
                    },
                    sampleDragAndDrop: {
                        name: '4. 드레그앤드랍',
                        stateKey: 'sampleDragAndDrop',
                        url: '/sample/drag_and_drop',
                        controller: 'sampleDragAndDropCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleDragAndDrop.html'
                    },
                    sampleChart: {
                        name: '5. 차트',
                        stateKey: 'sampleChart',
                        url: '/sample/chart',
                        controller: 'sampleChartCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleChart.html'
                    },
                    samplePop: {
                        name: '6. 팝업',
                        stateKey: 'samplePop',
                        url: '/sample/pop',
                        controller: 'samplePopCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/samplePop.html'
                    },
                  //표준UI샘플화면 추가//
                    //빈화면 샘플
                    sampleAccordion1: {
                        name: '1. accordion1',
                        stateKey: 'suser_accordion01',
                        url: '/sample/suser_accordion01',
                        controller: 'samplePopCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/suser_accordion01.html'
                    },
                    sampleAccordion2: {
                    	name: '1. accordion2',
                    	stateKey: 'suser_accordion02',
                    	url: '/sample/suser_accordion02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_accordion02.html'
                    },
                    sampleBlank1: {
                    	name: '1. blank1',
                    	stateKey: 'suser_blank1',
                    	url: '/sample/suser_blank1',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_blank1.html'
                    },
                    sampleBlank2: {
                    	name: '1. blank2',
                    	stateKey: 'suser_blank2',
                    	url: '/sample/suser_blank2',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_blank2.html'
                    },
                    //카드 샘플
                    sampleCard1: {
                    	name: '1. card1',
                    	stateKey: 'suser_card01',
                    	url: '/sample/suser_card01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card01.html'
                    },
                    sampleCard2: {
                    	name: '2. card2',
                    	stateKey: 'suser_card02',
                    	url: '/sample/suser_card02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card02.html'
                    },
                    sampleCard3: {
                    	name: '3. card3',
                    	stateKey: 'suser_card03',
                    	url: '/sample/suser_card03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card03.html'
                    },
                    sampleCard4: {
                    	name: '4. card4',
                    	stateKey: 'suser_card04',
                    	url: '/sample/suser_card04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card04.html'
                    },
                    sampleCard5: {
                    	name: '5. card5',
                    	stateKey: 'suser_card05',
                    	url: '/sample/suser_card05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card05.html'
                    },
                    sampleCard6: {
                    	name: '6. card6',
                    	stateKey: 'suser_card06',
                    	url: '/sample/suser_card06',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card06.html'
                    },
                    sampleCard7: {
                    	name: '7. card7',
                    	stateKey: 'suser_card07',
                    	url: '/sample/suser_card07',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card07.html'
                    },
                    sampleCard8: {
                    	name: '8. card8',
                    	stateKey: 'suser_card08',
                    	url: '/sample/suser_card08',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card08.html'
                    },
                    sampleCard9: {
                    	name: '9. card9',
                    	stateKey: 'suser_card09',
                    	url: '/sample/suser_card09',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card09.html'
                    },
                    sampleCard10: {
                    	name: '10. card10',
                    	stateKey: 'suser_card10',
                    	url: '/sample/suser_card10',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card10.html'
                    },
                    sampleCard11: {
                    	name: '11. card11',
                    	stateKey: 'suser_card11',
                    	url: '/sample/suser_card11',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card11.html'
                    },
                    sampleCard12: {
                    	name: '12. card12',
                    	stateKey: 'suser_card12',
                    	url: '/sample/suser_card12',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card12.html'
                    },
                    sampleCard13: {
                    	name: '13. card13',
                    	stateKey: 'suser_card13',
                    	url: '/sample/suser_card13',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card13.html'
                    },
                    sampleCard14: {
                    	name: '14. card14',
                    	stateKey: 'suser_card14',
                    	url: '/sample/suser_card14',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card14.html'
                    },
                    sampleCard15: {
                    	name: '15. card15',
                    	stateKey: 'suser_card15',
                    	url: '/sample/suser_card15',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card15.html'
                    },
                    sampleCard16: {
                    	name: '16. card16',
                    	stateKey: 'suser_card16',
                    	url: '/sample/suser_card16',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card16.html'
                    },
                    sampleCard17: {
                    	name: '17. card17',
                    	stateKey: 'suser_card17',
                    	url: '/sample/suser_card17',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card17.html'
                    },
                    sampleCard18: {
                    	name: '18. card18',
                    	stateKey: 'suser_card18',
                    	url: '/sample/suser_card18',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card18.html'
                    },
                    sampleCard19: {
                    	name: '19. card19',
                    	stateKey: 'suser_card19',
                    	url: '/sample/suser_card19',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card19.html'
                    },
                    sampleCard20: {
                    	name: '20. card20',
                    	stateKey: 'suser_card20',
                    	url: '/sample/suser_card20',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card20.html'
                    },
                    sampleCard21: {
                    	name: '21. card21',
                    	stateKey: 'suser_card21',
                    	url: '/sample/suser_card21',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card21.html'
                    },
                    sampleCard22: {
                    	name: '22. card22',
                    	stateKey: 'suser_card22',
                    	url: '/sample/suser_card22',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card22.html'
                    },
                    sampleCard23: {
                    	name: '23. card23',
                    	stateKey: 'suser_card23',
                    	url: '/sample/suser_card23',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card23.html'
                    },
                    sampleCard24: {
                    	name: '24. card24',
                    	stateKey: 'suser_card24',
                    	url: '/sample/suser_card24',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card24.html'
                    },
                    sampleCard25: {
                    	name: '25. card25',
                    	stateKey: 'suser_card25',
                    	url: '/sample/suser_card25',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_card25.html'
                    },
                    //폼 샘플
                    sampleForm1: {
                    	name: '1. Form1',
                    	stateKey: 'suser_form01',
                    	url: '/sample/suser_form01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_form01.html'
                    },
                    sampleForm2: {
                    	name: '2. Form2',
                    	stateKey: 'suser_form02',
                    	url: '/sample/suser_form02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_form02.html'
                    },
                    sampleForm3: {
                    	name: '3. Form3',
                    	stateKey: 'suser_form03',
                    	url: '/sample/suser_form03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_form03.html'
                    },
                    sampleForm4: {
                    	name: '4. Form4',
                    	stateKey: 'suser_form04',
                    	url: '/sample/suser_form04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_form04.html'
                    },
                    //Information 샘플
                    sampleInfo1: {
                    	name: '1. Info1',
                    	stateKey: 'suser_information01',
                    	url: '/sample/suser_information01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_information01.html'
                    },
                    sampleInfo2: {
                    	name: '2. Info2',
                    	stateKey: 'suser_information02',
                    	url: '/sample/suser_information02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_information02.html'
                    },
                    sampleInfo3: {
                    	name: '3. Info3',
                    	stateKey: 'suser_information03',
                    	url: '/sample/suser_information03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_information03.html'
                    },
                    sampleInfo4: {
                    	name: '4. Info4',
                    	stateKey: 'suser_information04',
                    	url: '/sample/suser_information04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_information04.html'
                    },
                    sampleInfo5: {
                    	name: '5. Info5',
                    	stateKey: 'suser_information05',
                    	url: '/sample/suser_information05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_information05.html'
                    },
                    //모달 샘플
                    sampleModal1: {
                    	name: '1. Modal1',
                    	stateKey: 'suser_modal01',
                    	url: '/sample/suser_modal01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal01.html'
                    },
                    sampleModal2: {
                    	name: '2. Modal2',
                    	stateKey: 'suser_modal02',
                    	url: '/sample/suser_modal02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal02.html'
                    },
                    sampleModal3: {
                    	name: '3. Modal3',
                    	stateKey: 'suser_modal03',
                    	url: '/sample/suser_modal03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal03.html'
                    },
                    sampleModal4: {
                    	name: '4. Modal4',
                    	stateKey: 'suser_modal04',
                    	url: '/sample/suser_modal04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal04.html'
                    },
                    sampleModal5: {
                    	name: '5. Modal5',
                    	stateKey: 'suser_modal05',
                    	url: '/sample/suser_modal05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal05.html'
                    },
                    sampleModal6: {
                    	name: '6. Modal6',
                    	stateKey: 'suser_modal06',
                    	url: '/sample/suser_modal06',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal06.html'
                    },
                    sampleModal7: {
                    	name: '7. Modal7',
                    	stateKey: 'suser_modal07',
                    	url: '/sample/suser_modal07',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal07.html'
                    },
                    sampleModal8: {
                    	name: '8. Modal8',
                    	stateKey: 'suser_modal08',
                    	url: '/sample/suser_modal08',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal08.html'
                    },
                    sampleModal9: {
                    	name: '9. Modal9',
                    	stateKey: 'suser_modal09',
                    	url: '/sample/suser_modal09',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal09.html'
                    },
                    sampleModal10: {
                    	name: '10. Modal10',
                    	stateKey: 'suser_modal10',
                    	url: '/sample/suser_modal10',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal10.html'
                    },
                    sampleModal11: {
                    	name: '11. Modal11',
                    	stateKey: 'suser_modal11',
                    	url: '/sample/suser_modal11',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal11.html'
                    },
                    sampleModal12: {
                    	name: '12. Modal12',
                    	stateKey: 'suser_modal12',
                    	url: '/sample/suser_modal12',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal12.html'
                    },
                    sampleModal13: {
                    	name: '13. Modal13',
                    	stateKey: 'suser_modal13',
                    	url: '/sample/suser_modal13',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_modal13.html'
                    },
                    //테이블 샘플
                    sampleTable1: {
                    	name: '1. Table1',
                    	stateKey: 'suser_table01',
                    	url: '/sample/suser_table01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_table01.html'
                    },
                    sampleTable2: {
                    	name: '2. Table2',
                    	stateKey: 'suser_table02',
                    	url: '/sample/suser_table02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_table02.html'
                    },
                    sampleTable3: {
                    	name: '3. Table3',
                    	stateKey: 'suser_table03',
                    	url: '/sample/suser_table03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_table03.html'
                    },
                    sampleTable4: {
                    	name: '4. Table4',
                    	stateKey: 'suser_table04',
                    	url: '/sample/suser_table04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_table04.html'
                    },
                    sampleTable5: {
                    	name: '5. Table5',
                    	stateKey: 'suser_table05',
                    	url: '/sample/suser_table05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_table05.html'
                    },
                    //뷰 샘플
                    sampleView1: {
                    	name: '1. View1',
                    	stateKey: 'suser_view01',
                    	url: '/sample/suser_view01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_view01.html'
                    },
                    sampleView2: {
                    	name: '2. View2',
                    	stateKey: 'suser_view02',
                    	url: '/sample/suser_view02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_view02.html'
                    },
                    sampleView3: {
                    	name: '3. View3',
                    	stateKey: 'suser_view03',
                    	url: '/sample/suser_view03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_view03.html'
                    },
                    sampleView4: {
                    	name: '4. View4',
                    	stateKey: 'suser_view04',
                    	url: '/sample/suser_view04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_view04.html'
                    },
                    sampleView5: {
                    	name: '5. View5',
                    	stateKey: 'suser_view05',
                    	url: '/sample/suser_view05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_view05.html'
                    },
                    //Write 샘플
                    sampleWrite1: {
                    	name: '1. Write1',
                    	stateKey: 'suser_write01',
                    	url: '/sample/suser_write01',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write01.html'
                    },
                    sampleWrite2: {
                    	name: '2. Write2',
                    	stateKey: 'suser_write02',
                    	url: '/sample/suser_write02',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write02.html'
                    },
                    sampleWrite3: {
                    	name: '3. Write3',
                    	stateKey: 'suser_write03',
                    	url: '/sample/suser_write03',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write03.html'
                    },
                    sampleWrite4: {
                    	name: '4. Write4',
                    	stateKey: 'suser_write04',
                    	url: '/sample/suser_write04',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write04.html'
                    },
                    sampleWrite5: {
                    	name: '5. Write5',
                    	stateKey: 'suser_write05',
                    	url: '/sample/suser_write05',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write05.html'
                    },
                    sampleWrite6: {
                    	name: '6. Write6',
                    	stateKey: 'suser_write06',
                    	url: '/sample/suser_write06',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write06.html'
                    },
                    sampleWrite7: {
                    	name: '7. Write7',
                    	stateKey: 'suser_write07',
                    	url: '/sample/suser_write07',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write07.html'
                    },
                    sampleWrite8: {
                    	name: '8. Write8',
                    	stateKey: 'suser_write081',
                    	url: '/sample/suser_write08',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write08.html'
                    },
                    sampleWrite9: {
                    	name: '9. Write9',
                    	stateKey: 'suser_write09',
                    	url: '/sample/suser_write09',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write09.html'
                    },
                    sampleWrite10: {
                    	name: '10. Write10',
                    	stateKey: 'suser_write10',
                    	url: '/sample/suser_write10',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_write10.html'
                    },
                    sampleDashboard: {
                    	name: 'sample. dashboard-1',
                    	stateKey: 'suser_dashboard',
                    	url: '/sample/suser_dashboard',
                    	controller: 'samplePopCtrl',
                    	templateUrl: _COMM_VIEWS_ + '/sample/suser_dashboard.html'
                    },
                    //*표준UI샘플화면 추가*//
                    demo: {
                        name: 'demoPage',
                        stateKey: 'demo',
                        url: '/sample/demo/:demoPage'
                    },
                    demoNo: {
                        name: 'demoNoPage',
                        stateKey: 'demoNo',
                        mainContentsClass: 'pd0',
                        url: '/sample/demoNo/:demoPage'
                    }
                }
            }
        } // leftMenus
    })
;