'use strict';

angular.module('portal.controllers')
    .controller('commBoardsCtrl', function ($scope, $location, $state, $stateParams, $translate, boardService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("boardsControllers.js : commBoardsCtrl", 1);

        var ct = this;

        ct.boards = [];

        // paging
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        ct.boardData = {};

        ct.paramBoardCode = $location.path().replace('/comm/boards/','');

        //게시판검색 : 검색 조건 세팅 : 전체/제목/내용
        ct.conditions = [
            {id: 'all',     name: 'label.all'},
            {id: 'title',   name: 'label.title'},
            {id: 'content', name: 'label.contents'}
        ];
        ct.selCondition = ct.conditions[0];

        ct.uaaContextUrl = CONSTANTS.uaaContextUrl;
        ct.userAuth      = common.getUserAuth();    //권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        ct.params        = $location.search();         //파라미터 : {schText: "공지"}

        ct.schText = ct.params.schText;
        ct.schType = ct.params.schType;
        if (ct.schType){
            ct.selCondition = findCondition(ct.schType);
        }

        function findCondition(paramId) {
            for(var i=0; i< ct.conditions.length; i++){
                if(ct.conditions[i].id == paramId){
                    return ct.conditions[i];
                }
            }
        }

        var pop       = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.boardData = {};
        pop.mode      = "";  //글쓰기/답글쓰기(C/R)

        pop.conditions = [
            {id: 'notice',  name: 'label.board_notice'},
            {id: 'faq',     name: 'label.board_faq'},
            {id: 'qna',     name: 'label.board_qna'},
            {id: 'data',    name: 'label.board_data'}
        ];
        pop.selCondition = pop.conditions[0];
        pop.file = {};

        /*게시판 목록 조회*/
        ct.listBoards = function (currentPage) {

            ct.resetData();

            var sText = !ct.schText?"": ct.schText;

            $scope.main.loadingMainBody = true;
            if (!currentPage) currentPage = 1;
            ct.pageOptions.currentPage = currentPage;
            var promise = boardService.listBoard(ct.pageOptions.pageSize, currentPage-1, ct.paramBoardCode, ct.selCondition.id, sText);
            promise.success(function (data) {
                ct.boards = data.items;
                ct.pageOptions.total = data.counts;

                for(var i = 0; i < ct.boards.length; i++){
                    ct.boards[i].boardName = $translate.instant('label.board_'+data.items[i].boardCode);
                }
                common.mdDialogHide();
                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                ct.boards = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /*게시판 검색input 엔터 시 조회*/
        ct.schEnter = function (keyEvent){
            if(keyEvent.which == 13){
                ct.listBoards();
            }
        };


        /*
        * [글쓰기]/[답글쓰기] 팝업 Open
        *   pop.mode //글쓰기/답글쓰기(C/R)
        * */
        ct.boardAdd = function($event) {

            var dialogOptions = {
                title: pop.mode=='C'?$translate.instant("label.bulletin_write"):$translate.instant("label.bulletin_write_reply"),
                form: {
                    name: "boardAddForm",
                    options: ""
                },
                dialogClassName: "modal-lg",
                templateUrl: _COMM_VIEWS_ + "/board/popBoardForm.html" + _VersionTail(),
                okName: $translate.instant("label.add")
            };
            pop.boardData = {
                boardCode: pop.mode=='C'?ct.selCondition.id:ct.boardData.boardCode,
                parentId: pop.mode=='C'?null:ct.boardData.id,
                popup: false,
                title: pop.mode=='C'?"":"Re: "+ct.boardData.title,
                title0: pop.mode=='C'?"":"Re: "+ct.boardData.title0,
                startDate: "",
                endDate: "",
                content: "",
                content0: ""
            };
            //pop.selCondition = pop.conditions.find(a => a.id === ct.selCondition.id);
            pop.selCondition = popFindCondition(ct.selCondition.id);
            pop.file = {};
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.boardAddAction(pop.boardData);
            };
        };

        function popFindCondition(paramId) {
            for(var i=0; i< pop.conditions.length; i++){
                if(pop.conditions[i].id == paramId){
                    return pop.conditions[i];
                }
            }
        }

        /*[글쓰기] 실제 실행*/
        pop.boardAddAction = function(boardData) {
            if (!new ValidationService().checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {}; //parentId/attachedFile
            if(pop.boardData.parentId) {
                param['parentId'] = pop.boardData.parentId;
            }
            param['boardCode'] = pop.selCondition.id;
            param['title'] = pop.boardData.title0;
            param['popup'] = pop.boardData.popup;

            if(pop.boardData.startDate) {
                var startDate = new Date(pop.boardData.startDate.replace(/\./g,"-")).getTime();
                param['startDate'] = String(startDate);
            }
            if(pop.boardData.endDate){
                var endDate = new Date(pop.boardData.endDate.replace(/\./g,"-")).getTime();
                param['endDate']   = String(endDate);
            }
            param['content'] = pop.boardData.content0;

            if (pop.file.uploadedNoticeFile != undefined && pop.file.uploadedNoticeFile != null) {
                var fList = [];
                for(var i=0; i<pop.file.uploadedNoticeFile.length; i++){
                    fList.push(pop.file.uploadedNoticeFile[i]);
                }
                param['attachedFile'] = fList;
            }

            $scope.main.loadingMainBody=true;
            var promise = boardService.createBoard(param);
            promise.success(function(data, status, headers){
                $scope.main.loadingMainBody=false;

                ct.listBoards(ct.pageOptions.currentPage);
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        /*하단 상세보기 안보이도록*/
        ct.resetData = function () {
            ct.boardData  = {};
            pop.file      = {};
        };

        ct.listBoards();
    })
    .controller('commBoardDetailCtrl', function ($scope, $location, $state, $stateParams, $translate, boardService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("boardsControllers.js : commBoardDetailCtrl", 1);

        var ct = this;

        ct.paramId       = $stateParams.id;
        ct.boardData     = {};
        ct.replyData     = {};
        ct.mode          = "R";     //R, U
        ct.boardCode     = "";
        ct.dettachFiles  = [];
        ct.file          = {};
        ct.showBtnEdit   = false;   //[수정]
        ct.showBtnDelete = false;   //[삭제]
        ct.showBtnReply  = false;   //[답글쓰기]
        ct.uaaContextUrl = CONSTANTS.uaaContextUrl;
        ct.userAuth      = common.getUserAuth();    //권한조회(A/B/M/O/U : 관리자/마케팅관리자/기업관리자/조직관리자/일반사용자
        ct.nextPreData   = [];      //이전글/다음글
        ct.params        = $location.search();         //파라미터 : {schText: "공지"}

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.boardData = {};
        pop.mode      = "";  //글쓰기/답글쓰기(C/R)

        pop.conditions = [
            {id: 'notice',  name: 'label.board_notice'},
            {id: 'faq',     name: 'label.board_faq'},
            {id: 'qna',     name: 'label.board_qna'},
            {id: 'data',    name: 'label.board_data'}
        ];
        pop.selCondition = pop.conditions[0];
        pop.file = {};

        if(ct.paramId){
            getBoard(ct.paramId);
        }

        /*게시판 상세 조회*/
        function getBoard(id) {
            $scope.main.loadingMainBody = true;
            var promise = boardService.getBoard(id);
            promise.success(function (data) {
                ct.boardData = angular.copy(data);
                ct.boardData.boardName = $translate.instant('label.board_'+data.boardCode);
                ct.boardCode = data.boardCode;
                if (ct.boardData.startDate && ct.boardData.startDate.time)
                    ct.boardData.startDate = moment(ct.boardData.startDate.time).format("YYYY.MM.DD");
                if (ct.boardData.endDate && ct.boardData.endDate.time)
                    ct.boardData.endDate = moment(ct.boardData.endDate.time).format("YYYY.MM.DD");

                //버튼 권한 확인
                ct.chkBtnAuth(ct.boardData);
                $scope.main.loadingMainBody = false;

                //조회수 업데이트
                updateBoardHits(ct.boardData);

                //다음글/이전글 조회
                nextPreBoard(ct.boardData, ct.params.schType, ct.params.schText);
            });
            promise.error(function (data, status, headers) {
                ct.boardData = {};
                $scope.main.loadingMainBody = false;
            });
        }

        /*
        * [취소] 버튼 클릭 이벤트
        *      mode:R --> 목록으로 이동
        *      mode:U --> mode:R로 변환
        * */
        ct.clickCancel = function(){
            if(ct.mode == "R"){
                common.locationPath("/comm/boards/"+ct.boardCode);
            }else if(ct.mode == "U"){
                ct.mode = "R";
            }
        };

        /*이전글/다음글 클릭 시 detailView*/
        ct.goDetail = function(boardId){
            common.locationPath("/comm/boards/boardDetail/notice/"+boardId);
        };

        /*
         * [글쓰기]/[답글쓰기] 팝업 Open
         *   pop.mode //글쓰기/답글쓰기(C/R)
         * */
        ct.boardAdd = function($event) {

            var dialogOptions = {
                title: pop.mode=='C'?$translate.instant("label.bulletin_write"):$translate.instant("label.bulletin_write_reply"),
                form: {
                    name: "boardAddForm",
                    options: ""
                },
                dialogClassName: "modal-lg",
                templateUrl: "views/board/popBoardForm.html" + _VersionTail(),
                okName: $translate.instant("label.add")
            };
            pop.boardData = {
                boardCode: ct.boardData.boardCode,
                parentId: pop.mode=='C'?null:ct.boardData.id,
                popup: false,
                title: pop.mode=='C'?"":"Re: "+ct.boardData.title0,
                startDate: "",
                endDate: "",
                content: ""
            };
            pop.selCondition = popFindCondition(ct.boardData.boardCode);
            pop.file = {};
            common.showDialog($scope, $event, dialogOptions);
            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.boardAddAction(pop.boardData);
            };
        };

        function popFindCondition(paramId) {
            for(var i=0; i< pop.conditions.length; i++){
                if(pop.conditions[i].id == paramId){
                    return pop.conditions[i];
                }
            }
        }

        /*[글쓰기] 실제 실행*/
        pop.boardAddAction = function(boardData) {
            if (!new ValidationService().checkFormValidity($scope[$scope.dialogOptions.formName])) {
                $scope.actionBtnHied = false;
                return;
            }

            var param = {}; //parentId/attachedFile
            if(pop.boardData.parentId) {
                param['parentId'] = pop.boardData.parentId;
            }
            param['boardCode'] = pop.selCondition.id;
            param['title'] = pop.boardData.title0;
            param['popup'] = pop.boardData.popup;

            if(pop.boardData.startDate) {
                var startDate = new Date(pop.boardData.startDate.replace(/\./g,"-")).getTime();
                param['startDate'] = String(startDate);
            }
            if(pop.boardData.endDate){
                var endDate = new Date(pop.boardData.endDate.replace(/\./g,"-")).getTime();
                param['endDate']   = String(endDate);
            }
            param['content'] = pop.boardData.content0;

            if (pop.file.uploadedNoticeFile != undefined && pop.file.uploadedNoticeFile != null) {
                var fList = [];
                for(var i=0; i<pop.file.uploadedNoticeFile.length; i++){
                    fList.push(pop.file.uploadedNoticeFile[i]);
                }
                param['attachedFile'] = fList;
            }

            $scope.main.loadingMainBody=true;
            var promise = boardService.createBoard(param);
            promise.success(function(data, status, headers){
                $scope.main.loadingMainBody=false;

                common.mdDialogHide();
                common.locationPath("/boards/boardDetail/"+ct.boardCode+"/"+data);
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                if(status == 406){      //커뮤니티 타 회사로 등록 시
                    common.showAlertErrorHtml($translate.instant("label.board_mgmt"), $translate.instant("message.mi_no_access_role"));
                }
            });
        };

        /*
         * 게시판상세의 파일 삭제 클릭
         * */
        ct.delFile = function(file){
            file.isDel = true;

            ct.dettachFiles.push(file.id);
        };

        /*
         * 게시판상세 저장
         * */
        ct.updateBoard = function(detail){
            if (!new ValidationService().checkFormValidity($scope['boardDetailForm'])) {
                $scope.actionBtnHied = false;
                return;
            }
            if(detail.popup && (!detail.startDate || !detail.endDate)){
                common.showAlert($translate.instant("label.edit"), $translate.instant('message.mi_post_popup_date_require'));
                return;
            }

            var param = {}; //parentId/attachedFile
            param['id']        = detail.id;
            param['boardCode'] = detail.boardCode;
            param['title']     = detail.title0;
            param['popup']     = detail.popup;

            if(detail.startDate) {
                var startDate = new Date(detail.startDate.replace(/\./g,"-")).getTime();
                param['startDate'] = String(startDate);
            }
            if(detail.endDate){
                var endDate = new Date(detail.endDate.replace(/\./g,"-")).getTime();
                param['endDate']   = String(endDate);
            }
            param['content'] = detail.content0;

            if(ct.file.uploadedNoticeFile != undefined && ct.file.uploadedNoticeFile != null){
                var fList = [];
                for(var i=0; i<ct.file.uploadedNoticeFile.length; i++){
                    fList.push(ct.file.uploadedNoticeFile[i]);
                }
                param['attachedFile'] = fList;
            }

            if(ct.dettachFiles.length){
                param['dettachFiles'] = ct.dettachFiles;
            }

            $scope.main.loadingMainBody = true;
            var updatePromise = boardService.updateBoard(detail.id, param);
            updatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
                common.showAlertSuccessHtml($translate.instant("label.edit"), $translate.instant('message.mi_edit_board')).then(function () {
                    getBoard(ct.paramId);
                    ct.resetData();
                });
            });
            updatePromise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                if(status == 406){      //커뮤니티 타 회사 건 수정 시
                    common.showAlertErrorHtml($translate.instant("label.board_mgmt"), $translate.instant("message.mi_no_access_role"));
                }
                ct.resetData();
            });


        };

        /*
         * 게시판 삭제
         * */
        ct.deleteBoard = function(id){
            var showConfirm = common.showConfirm($translate.instant('label.del'), $translate.instant('message.mq_delete_bulletin'));
            showConfirm.then(function () {

                $scope.main.loadingMainBody = true;
                var deletePromise = boardService.deleteBoard(id);
                deletePromise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertSuccessHtml($translate.instant("label.bulletin_del"), $translate.instant('message.mi_delete')).then(function () {
                        common.locationPath("/boards/"+ct.boardCode);
                    });
                });
                deletePromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    if(status == 406){      //커뮤니티 타 회사 건 삭제 시
                        common.showAlertErrorHtml($translate.instant("label.board_mgmt"), $translate.instant("message.mi_no_access_role"));
                    }
                });

                ct.resetData();
            });
        };

        /*
        * 버튼 권한 확인
        * */
        ct.chkBtnAuth = function(boardData){
            ct.showBtnEdit   = false;   //[수정]
            ct.showBtnSave   = false;   //[저장]
            ct.showBtnDelete = false;   //[삭제]
            ct.showBtnReply  = false;   //[답글쓰기]

            if(ct.mode == 'R') {
                if (ct.userAuth != 'U') {
                    ct.showBtnEdit   = true;   //[수정]
                    ct.showBtnDelete = true;   //[삭제]
                    if (boardData.boardCode == 'qna' && boardData.level == 1) {
                        ct.showBtnReply = true;    //[답글쓰기]
                    }
                } else {
                    if (boardData.ownerEmail == common.getUser().email) {
                        ct.showBtnEdit   = true;   //[수정]
                        ct.showBtnDelete = true;   //[삭제]
                    }
                }
            }else if(ct.mode == 'U') {
                ct.showBtnSave   = true;   //[저장]
            }
        };

        /*하단 상세보기 안보이도록*/
        ct.resetData = function () {
            ct.boardData     = {};
            ct.replyData     = {};
            ct.file          = {};
            pop.file         = {};
            ct.dettachFiles  = [];
            ct.mode          = "R";
            ct.showBtnEdit   = false;   //[수정]
            ct.showBtnSave   = false;   //[저장]
            ct.showBtnDelete = false;   //[삭제]
            ct.showBtnReply  = false;   //[답글쓰기]
        };


        /*
         * 게시판상세 조회수 업데이트
         * */
        function updateBoardHits(detail){

            $scope.main.loadingMainBody = true;
            var updatePromise = boardService.updateBoardHits(detail.id);
            updatePromise.success(function(data, status, headers){
                $scope.main.loadingMainBody = false;
            });
            updatePromise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        /*
         * 다음글/이전글 조회
         * */
        function nextPreBoard(detail, schType, schText){

            var myEmail = common.getUser() == null ? "" : common.getUser().email;

            var param = {};
            param["schType"] = schType;
            param["schText"] = schText;
            param["email"]   = myEmail;

            $scope.main.loadingMainBody = true;
            var updatePromise = boardService.nextPreBoardList(detail.id, param);
            updatePromise.success(function(data, status, headers){
                ct.nextPreData = data.items;    //다음글/이전글 목록
                $scope.main.loadingMainBody = false;

                $scope.showDetail = true;   //상세보기
            });
            updatePromise.error(function(data, status, headers) {
                ct.nextPreData = [];
                $scope.main.loadingMainBody = false;
            });
        }

    })
    .filter('newlines', function () {
        return function(text) {
            if(text !== undefined){
                return text.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
            }
        }
    })
;
