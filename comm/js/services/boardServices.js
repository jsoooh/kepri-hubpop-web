//'use strict';

angular.module('portal.services')
	.factory('boardService', function (common, CONSTANTS) {

		var boardService = {};

		/*게시판 검색*/
        boardService.listBoard = function(size, page, boardCode, schType, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                /*"sort" : "groupNo,desc",
                "sort" : "level,asc",
                "sort" : "parent,asc",*/
				"boardCode" : boardCode,
                "schType" : schType ? schType : "all",
				"schText" : schText ? schText : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards', 'GET', getParams));
        };

        /*커뮤니티 TOP 목록(공지사항/나의문의내역)*/
        boardService.listCommunityTop = function(boardCode, email) {
            var getParams = {
                "boardCode" : boardCode
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+email+'/listCommunityTop', 'GET', getParams));
        };

        /*게시판 등록/답글쓰기*/
        boardService.createBoard = function(param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards', 'POST', param, 'multipart/form-data'));
        };

		/*게시판 수정*/
        boardService.updateBoard = function(id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+id, 'POST', param, 'multipart/form-data'));
        };

        /*게시판 삭제*/
        boardService.deleteBoard = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+id, 'DELETE'));
        };

        /*게시판 건별 조회*/
        boardService.getBoard = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+id, 'GET'));
        };

        /*게시판 조회수 수정*/
        boardService.updateBoardHits = function(id) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+id+'/hits', 'PUT'));
        };

        /*다음글/이전글 조회*/
        boardService.nextPreBoardList = function(id, param) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/'+id+'/nextPreBoardList', 'GET', param));
        };
        
        boardService.myBoardList = function (size, page, email, boardCode, schType, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                /*"sort" : "groupNo,desc",
                "sort" : "level,asc",
                "sort" : "parent,asc",*/
				"boardCode" : boardCode,
                "schType" : schType ? schType : "all",
				"schText" : schText ? schText : ""
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards/' + email + '/qna', 'GET', getParams));
        }

        boardService.listReply = function(parentId) {
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/reply/' + parentId));
        }

		return boardService;
	})
;
