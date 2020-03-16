'use strict';

angular.module('portal.controllers')
    .controller('commMailsCtrl', function ($scope, $location, $state, $stateParams, $translate, mailService, ValidationService, common, cache, CONSTANTS) {
        _DebugConsoleLog("mailControllers.js : commMailsCtrl", 1);

        var ct = this;
        ct.mailData = {};
        ct.mailData['title'] = "[K PaaS-TA] ";
        ct.mailData['send_target'] = "all";     //발송대상:전체

        /*[보내기]*/
        ct.mailSend = function(boardData) {
            if (!new ValidationService().checkFormValidity($scope['mailForm'])) {
                $scope.actionBtnHied = false;
                return;
            }

            if(ct.mailData.title == "[K PaaS-TA] "){
                common.showAlert($translate.instant("menu.mail_send"), $translate.instant("message.mi_dont_input_title"));
                return;
            }

            var param = {};
            param['title']      = ct.mailData.title;
            param['subTitle']   = ct.mailData.sub_title;
            param['sendTarget'] = ct.mailData.send_target;
            param['content']    = ct.mailData.content.replace(/\n/g, "<br />");

            common.showConfirm($translate.instant("menu.mail_send"), $translate.instant("message.mq_all_mail_send")).then(function () {

                $scope.main.loadingMainBody=true;
                var promise = mailService.sendMail(param);
                promise.success(function(data, status, headers){
                    $scope.main.loadingMainBody=false;

                    common.showAlert($translate.instant("menu.mail_send"), $translate.instant("message.mi_send_email")).then(function () {
                        ct.mailData = {};
                        ct.mailData['title'] = "[K PaaS-TA] ";
                    });

                });
                promise.error(function(data, status, headers) {
                    $scope.main.loadingMainBody = false;
                });
            });
        };

    })
;