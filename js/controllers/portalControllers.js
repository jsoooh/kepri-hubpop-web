'use strict';

angular.module('portal.controllers', [])
    // 매인 BODY Conroller
    .controller('mainContentsCtrl', function ($scope, $location, $templateCache, $state, $stateParams, $timeout, $window, $translate, CONSTANTS, cache, common, $cookies, boardService, $rootScope, $mdDialog) {

        _DebugConsoleLog("commonControllers.js : mainContentsCtrl Start, path : " + $location.path(), 1);

        // 팝업게시 공지사항 조회
        $scope.getPopupNotice = function() {

            if(!common.getUser()) return;

            var email = common.getUser().email;
            var noticePromise = boardService.listPopupNotice(email);
            noticePromise.success(function (data) {
                $scope.main.loadingMainBody = false;

                var j=0;
                for (var i=0; i<data.items.length; i++) {
                    if (common.isAuthenticated()) {
                        if($cookies.get('notice_'+data.items[i].id) != 'valid') {
                            common.notice(data.items[i], ++j);
                        }
                    }
                }
            });
            noticePromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        $scope.getPopupNotice();

        function Popup(url,winName, width, height, isScrollBar, isResizable){
            var winl = (screen.width-width)/2;
            var wint = (screen.height-height)/2;
            var option = 'toolbar=0, location=0, status=1, menubar=0, scrollbars='+isScrollBar+', resizable='+isResizable+', top='+wint+', left='+winl+', width='+width+', height='+height;
            return window.open (url, winName, option);
        }

        _DebugConsoleLog("commonControllers.js : mainContentsCtrl End", 1);
    })
;
