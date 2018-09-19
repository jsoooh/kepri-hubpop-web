'use strict';

angular.module('portal.controllers')
    .controller('commDevopsCtrl', function ($scope, $translate, common) {
        _DebugConsoleLog("devopsControllers.js : commDevopsCtrl", 1);
        var ct = this;

        ct.ciUrl   = "/ci/cixpert";
        ct.gitUrl  = "/git/";
        ct.wideUrl = "/wide/";
        ct.ciProductUrl   = location.origin + "/#/product/devops/cicd";
        ct.gitProductUrl  = location.origin + "/#/product/devops/git";
        ct.wideProductUrl = location.origin + "/#/product/devops/wide";

        /*서비스시작(CiCd/Git/Wide)*/
        ct.goUrl = function(site){

            if(common.getUser().isDevOps){
                var newWindow = window.open("about:blank");
                if(site=="ci") {
                    newWindow.location.href = ct.ciUrl;
                }else if(site=="git") {
                    newWindow.location.href = ct.gitUrl;
                }else if(site=="wide") {
                    newWindow.location.href = ct.wideUrl;
                }
            }else{
                common.showAlert("DevOps", $translate.instant("message.mi_no_access_role"));
            }
        };

        /*상품더알아보기(CiCd/Git/Wide)*/
        ct.productUrl = function(site){

            if(common.getUser().isDevOps){
                var newWindow = window.open("about:blank");
                if(site=="ci") {
                    newWindow.location.href = ct.ciProductUrl;
                }else if(site=="git") {
                    newWindow.location.href = ct.gitProductUrl;
                }else if(site=="wide") {
                    newWindow.location.href = ct.wideProductUrl;
                }
            }else{
                common.showAlert("DevOps", $translate.instant("message.mi_no_access_role"));
            }
        };

        $scope.main.loadingMainBody = false;
    })
;
