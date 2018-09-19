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

        /*[미리보기]*/
        ct.popPreView = function(){
            if (!new ValidationService().checkFormValidity($scope['mailForm'])) {
                $scope.actionBtnHied = false;
                return;
            }

            if(ct.mailData.title == "[K PaaS-TA] "){
                common.showAlert($translate.instant("menu.mail_send"), $translate.instant("message.mi_dont_input_title"));
                return;
            }

            var title     = ct.mailData.title;
            var sub_title = ct.mailData.sub_title;
            var content   = ct.mailData.content.replace(/\n/g, "<br />");

            common.getTemplateHtml(_COMM_ADMIN_VIEWS_ + "/mail/popMail.html" + _VersionTail(), function (templateHtml) {
                var width = 700;
                var height = 800;
                var left = screen.availLeft + 100;
                var top = screen.availTop + 100;
                var option = 'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, top='+top+', left='+left+', width='+width+', height='+height;

                var objWin = window.open("", "mail", option);

                if(objWin == null){
                    if (!common.isLoginShowAlert) {
                        common.isLoginShowAlert	= true;
                        common.showAlertErrorHtml("팝업차단", "팝업차단 상태입니다. <br>팝업차단을 해제해 주시기 바랍니다.").then(function () {
                            common.isLoginShowAlert = false;
                        });
                    }
                } else {
                    //이미 팝업창 띄워져 있는 경우 append 생략
                    if(objWin.document.body.innerText == "") {
                        templateHtml = templateHtml.replace("{{title}}", title);
                        templateHtml = templateHtml.replace("{{sub_title}}", sub_title);
                        templateHtml = templateHtml.replace("{{content}}", content);
                        objWin.document.writeln(templateHtml);
                    }
                    objWin.focus();
                }
            });
        };

    })
;