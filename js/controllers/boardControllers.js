'use strict';

angular.module('portal.controllers')
    .filter('newlines', function () {
        return function(text) {
            if(text !== undefined){
                return text.replace(/\n/g, '<br/>').replace(/ /g, '&nbsp;');
            }
        }
    })
    .controller('boardsCtrl', function ($scope, $location, $state, $stateParams, $translate, boardService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("boardsControllers.js : boardsCtrl", 1);

        $scope.boards = [];

        // paging
        $scope.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };

        $scope.boardData = {};
        $scope.writeData = {};
        $scope.showDetail = false;   //상세보기
        $scope.activeTabIndex = 1;
        $scope.sch = {};
        $scope.sch.text = "";
        $scope.valid = {};
        $scope.valid.isErrorTitle = false;
        $scope.valid.isErrorContent = false;
        $scope.isAuthenticated = common.isAuthenticated();
        $scope.file = {};
        $scope.nextPreData = [];    //다음글/이전글 목록
        $scope.uaaContextUrl = CONSTANTS.apiServer + CONSTANTS.apiVersion;

        $scope.boardCode = $stateParams.boardCode;
        $scope.boardId = $stateParams.boardId;
        $scope.title = $translate.instant('label.board_'+$scope.boardCode);
        if($scope.boardCode == "notice"){
            $scope.activeTabIndex = 1;
            listBoards();
        }else if($scope.boardCode == "faq"){
            $scope.activeTabIndex = 2;
            listBoards();
        }else if($scope.boardCode == "data"){
            $scope.activeTabIndex = 3;
            listBoards();
        }else if($scope.boardCode == "qna"){
            $scope.activeTabIndex = 4;
            if(!common.getUser()){
                common.showAlert($translate.instant("label.board_qna"), "로그인 후 이용해 주세요.").then(function () {
                    common.locationHref("/#/");
                });
            }
        }

        /*Tab 선택 함수*/
        $scope.selTab = function(index){
            $scope.showDetail = false;   //상세보기
            $scope.sch.text = "";
            switch (index){
              case 1 : $scope.boardCode = "notice"; break;
              case 2 : $scope.boardCode = "faq"; break;
              case 3 : $scope.boardCode = "data"; break;
              case 4 : $scope.boardCode = "qna"; break;
              case 5 : $scope.boardCode = "qna"; break;
            }
            $scope.title = $translate.instant('label.board_'+$scope.boardCode);
            if(index == 5){
                $scope.title = $translate.instant('label.board_myQna');
            }
            if(index == 1 || index == 2 || index == 3){
                listBoards();
            }else if(index == 5){
                $scope.myListBoards();
            }
        };

        /*목록 검색 버튼 클릭 시 이벤트*/
        $scope.getListBoards = function (){
            if($scope.boardCode == "qna"){
                $scope.myListBoards();
            }else{
                listBoards();
            }
        };

        $scope.listBoards = function () {
            listBoards();
        };

        /*게시판 검색input 엔터 시 조회*/
        $scope.schEnter = function (keyEvent){
            if(keyEvent.which == 13){
                listBoards();
            }
        };

        /*게시판 목록 조회*/
        function listBoards(currentPage) {

            resetData();

            var sText = ($scope.sch.text == null || $scope.sch.text == undefined)?"": $scope.sch.text;

            $scope.main.loadingMainBody = true;
            if (currentPage == undefined) currentPage = 1;
            $scope.pageOptions.currentPage = currentPage;
            var promise = boardService.listBoard($scope.pageOptions.pageSize, currentPage-1, $scope.boardCode, sText);
            promise.success(function (data) {
                $scope.boards = data.items;
                $scope.pageOptions.total = data.counts;
                $scope.main.loadingMainBody = false;

                checkNotice();
            });
            promise.error(function (data, status, headers) {
                $scope.boards = [];
                $scope.main.loadingMainBody = false;
            });
        }

        /*나의 문의내역 조회*/
        $scope.myListBoards = function(currentPage) {

            resetData();

            var sText = ($scope.sch.text == null || $scope.sch.text == undefined)?"": $scope.sch.text;
            var email = common.getUser().email;

            $scope.main.loadingMainBody = true;
            if (currentPage == undefined) currentPage = 1;
            $scope.pageOptions.currentPage = currentPage;
            var promise = boardService.myListBoard($scope.pageOptions.pageSize, currentPage-1, $scope.boardCode, sText, email);
            promise.success(function (data) {
                $scope.boards = data.items;
                $scope.pageOptions.total = data.counts;

                $scope.main.loadingMainBody = false;
            });
            promise.error(function (data, status, headers) {
                $scope.boards = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /*[글쓰기] 실행*/
        $scope.boardAdd = function(boardData) {
            if(!$scope.writeData.title){
                $scope.valid.isErrorTitle = true;
                return;
            }
            if(!$scope.writeData.content){
                $scope.valid.isErrorContent = true;
                return;
            }

            var param = {}; //parentId/attachedFile
            param['parentId']  = "";
            param['boardCode'] = $scope.boardCode;
            param['title']     = $scope.writeData.title;
            param['content']   = $scope.writeData.content;

            if ($scope.file.uploadedNoticeFile != undefined && $scope.file.uploadedNoticeFile != null) {
                param['attachedFile'] = $scope.file.uploadedNoticeFile;
            }

            boardAddAction(param);
        };

        /*게시판 글/파일 실제 입력*/
        function boardAddAction(param){
            $scope.main.loadingMainBody=true;
            var promise = boardService.createBoard(param);
            promise.success(function(data, status, headers){
                $scope.main.loadingMainBody=false;

                common.showAlert($translate.instant("label.board_qna"), $translate.instant("message.mi_ctrl_success")).then(function () {
                    $scope.writeData = {};
                    $scope.file      = {};
                });
            });
            promise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }

        /*팝업 공지사항의 [상세보기]*/
        function checkNotice() {
            if ($scope.boardId && $scope.boardCode == "notice") {

                $scope.main.loadingMainBody = true;
                var promise = boardService.getBoard($scope.boardId);
                promise.success(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;

                    $scope.viewDetail(data);
                });
                promise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            }
        }

        /*그리드 클릭으로 상세 조회*/
        $scope.viewDetail = function (boardItem){
            $scope.boardData = angular.copy(boardItem);

            //조회수 업데이트
            updateBoardHits($scope.boardData);

            //다음글/이전글 조회
            nextPreBoard($scope.boardData);
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
                resetData();
            });
        }

        /*
         * 다음글/이전글 조회
         * */
        function nextPreBoard(detail){

            var sText = ($scope.sch.text == null || $scope.sch.text == undefined)?"": $scope.sch.text;

            var myEmail = common.getUser() == null ? "" : common.getUser().email;

            var param = {};
            param["schText"] = sText;
            param["email"]   = myEmail;

            $scope.main.loadingMainBody = true;
            var updatePromise = boardService.nextPreBoardList(detail.id, param);
            updatePromise.success(function(data, status, headers){
                $scope.nextPreData = data.items;    //다음글/이전글 목록
                $scope.main.loadingMainBody = false;

                $scope.showDetail = true;   //상세보기
            });
            updatePromise.error(function(data, status, headers) {
                $scope.main.loadingMainBody = false;
                resetData();
            });
        }

        /*하단 상세보기 안보이도록*/
        function resetData() {
            $scope.boardData  = {};
            $scope.showDetail = false;
            $scope.showReply  = false;
            $scope.valid.isErrorTitle = false;
            $scope.valid.isErrorContent = false;
            $scope.file = {};
            $scope.nextPreData = [];
        }

    })
    .controller('guidesCtrl', function ($scope, $location, $state, $stateParams, $translate, boardService, ValidationService, common, CONSTANTS) {
        _DebugConsoleLog("boardsControllers.js : guidesCtrl", 1);

        $scope.uaaContextUrl = CONSTANTS.apiServer + CONSTANTS.apiVersion;
        $scope.guideUrl = location.origin;

    })
;
