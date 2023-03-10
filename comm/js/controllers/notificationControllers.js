'use strict';

angular.module('portal.controllers')
    .controller('commNotificationCtrl', function ($scope, $location, $timeout, $translate, $mdDialog, $cookies, common, CONSTANTS) {
        _DebugConsoleLog("notificationControllers.js : commNotificationCtrl", 1);

        var ct = this;
        ct.conditions = {
            receivers: [
                {id: 'u', name: 'label.user'},
                {id: 'p', name: 'label.project'}
            ],
            types: [
                {id: 'message', name: 'label.message'}
            ]
        };
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };


        ct.conditionParams = {
            schType: ct.conditions.types[0].id
        };
        ct.notifications = [];

        ct.selectNotifications = function (currentPage) {
            if (!currentPage) currentPage = 1;
            ct.pageOptions.currentPage = currentPage;

            ct.conditionParams.size = ct.pageOptions.pageSize;
            ct.conditionParams.page = ct.pageOptions.currentPage - 1;
            
            var promise = common.retrieveResource(common.resourcePromise(CONSTANTS.uaaContextUrl + '/notification', 'GET', ct.conditionParams));
            promise.success(function (data) {
                if (data.resultCode == 0) {
                    ct.notifications = data.items;
                    ct.pageOptions.total = data.counts;
                };
            });
            promise.error(function (data) {
                console.log('error', data);
            });
        };

        /*게시판 검색input 엔터 시 조회*/
        ct.schEnter = function (keyEvent){
            if(keyEvent.which == 13){
                ct.selectNotifications();
            }
        };

        ct.selectNotifications();
    })
;