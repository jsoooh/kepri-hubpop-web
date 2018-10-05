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
            },
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
                        url: '/comm/memberEdit',
                        controller: 'commUserEditCtrl',
                        templateUrl: _COMM_VIEWS_ + '/user/userForm.html'
                    },
                    project: {
                        mainTop: false,
                        name: 'project',
                        icon: "ico2",
                        stateKey: 'commProjectMgmt',
                        url: '/comm/projects',
                        controller: 'commOrgProjecsCtrl',
                        templateUrl: _COMM_VIEWS_+'/org/orgProjects.html',
                        subPages: {
                            projectDetail: {
                                mainTop: true,
                                name: 'project_details',
                                stateKey: 'orgProjectDetailCtrl',
                                url: '/comm/projects/projectDetail/:orgId',
                                controller: 'orgProjectDetailCtrl',
                                templateUrl: _COMM_VIEWS_+'/org/orgProjectDetail.html'
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
                                        controller: 'commBoardCreateCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/boardCreate.html'
                                    },
                                    boardUpdate: {
                                        menuKey: 'boards',
                                        name: 'board_update',
                                        stateKey: 'commBoardUpdateNotice',
                                        url: '/comm/boards/boardUpdate/notice/:id',
                                        controller: 'commBoardUpdateCtrl',
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
                                controller: 'commBoardsCtrl',
                                templateUrl: _COMM_VIEWS_+'/board/boards.html',
                                subPages: {
                                    boardDetail: {
                                        menuKey: 'boards',
                                        name: 'board_details',
                                        stateKey: 'commBoardDetailQna',
                                        url: '/comm/boards/boardDetail/qna/:id',
                                        controller: 'commBoardDetailCtrl',
                                        templateUrl: _COMM_VIEWS_+'/board/boardDetail.html'
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
                    }
                }
            },
            tutorial: {
                pageStage : 'tutorial',
                notPAuth: "AA",
                notEdPAuth: "AA",
                name: "tutorial",
                icon: "ico4",
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
                    }/*,
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
                menus: {
                    sampleTable: {
                        name: '1. 일반 테이블',
                        stateKey: 'sampleTable',
                        url: '/sample/table',
                        controller: 'sampleTableCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleTable.html',
                    },
                    sampleTableScroll: {
                        name: '2. 스크롤 테이블',
                        stateKey: 'sampleTableScroll',
                        url: '/sample/table_scroll',
                        controller: 'sampleTableScrollCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleTableScroll.html',
                    },
                    sampleProgressBar: {
                        name: '3. 프로그래스바',
                        stateKey: 'sampleProgressBar',
                        url: '/sample/progress_bar',
                        controller: 'sampleProgressBarCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleProgressBar.html',
                    },
                    sampleDragAndDrop: {
                        name: '4. 드레그앤드랍',
                        stateKey: 'sampleDragAndDrop',
                        url: '/sample/drag_and_drop',
                        controller: 'sampleDragAndDropCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleDragAndDrop.html',
                    },
                    sampleChart: {
                        name: '5. 차트',
                        stateKey: 'sampleChart',
                        url: '/sample/chart',
                        controller: 'sampleChartCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/sampleChart.html',
                    },
                    samplePop: {
                        name: '6. 팝업',
                        stateKey: 'samplePop',
                        url: '/sample/pop',
                        controller: 'samplePopCtrl',
                        templateUrl: _COMM_VIEWS_ + '/sample/samplePop.html',
                    }
                }
            }
        } // leftMenus
    })
;