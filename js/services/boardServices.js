'use strict';

angular.module('portal.services')
	.factory('boardService', function (common, CONSTANTS) {

		var boardService = {};

		/*게시판 검색*/
        boardService.listBoard = function(size, page, boardCode, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
				"boardCode" : boardCode,
				"schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards', 'GET', getParams));
        };

        /*나의 문의내역 검색*/
        boardService.myListBoard = function(size, page, boardCode, schText, email) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                "boardCode" : boardCode,
                "schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+email+'/myBoardList', 'GET', getParams));
        };

        /*게시판 등록/답글쓰기*/
        boardService.createBoard = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards', 'POST', param, "multipart/form-data"));
        };

		/*게시판 수정*/
        boardService.updateBoard = function(id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+id, 'PUT', param, 'application/x-www-form-urlencoded'));
        };

        /*게시판 조회수 수정*/
        boardService.updateBoardHits = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+id+'/hits', 'PUT'));
        };

        /*다음글/이전글 조회*/
        boardService.nextPreBoardList = function(id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+id+'/nextPreBoardList', 'GET', param));
        };

        /*게시판 삭제*/
        boardService.deleteBoard = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+id, 'DELETE'));
        };

        /*팝업게시 공지사항 조회*/
        boardService.listPopupNotice = function(email) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+email+'/noticeList', 'GET'));
        };

        /*게시판 건별 조회*/
        boardService.getBoard = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.apiServer + CONSTANTS.apiVersion + '/boards/'+id, 'GET'));
        };
		
		return boardService;
	})
;
