//'use strict';

angular.module('portal.services')
	.factory('boardService', function (common, CONSTANTS) {

		var boardService = {};

		/*게시판 검색*/
        boardService.listBoard = function(size, page, boardCode, schText) {
            var getParams = {
                "size" : size ? size : 10,
                "page" : page ? page : 0,
                /*"sort" : "groupNo,desc",
                "sort" : "level,asc",
                "sort" : "parent,asc",*/
				"boardCode" : boardCode,
				"schText" : schText
            };
            return common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/boards', 'GET', getParams));
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
		
		return boardService;
	})
;
