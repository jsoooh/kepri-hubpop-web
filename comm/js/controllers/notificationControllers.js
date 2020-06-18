'use strict';

angular.module('portal.controllers')
    .controller('commNotificationCtrl', function ($scope, $location, $timeout, $translate, $mdDialog, $cookies, common, CONSTANTS) {
        _DebugConsoleLog("notificationControllers.js : commNotificationCtrl", 1);

        var ct = this;
        ct.conditions = {
            receivers: [
                {id: '', name: 'label.receiver'},
                {id: 'p', name: 'label.project'},
                {id: 'a', name: 'label.admin'},
                {id: 'u', name: 'label.user'}
            ],
            types: [
                {id: '', name: 'label.all'},
                {id: 'target', name: 'label.target'},
                {id: 'message', name: 'label.message'}
            ]
        };
        ct.pageOptions = {
            currentPage : 1,
            pageSize : 10,
            total : 0
        };


        ct.conditionParams = {
            receiver: ct.conditions.receivers[0].id,
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
                    ct.pageOptions.total = data.itemCount;
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