'use strict';

angular.module('gpu.controllers')
   .controller('tomcatDeployViewCtrl', function ($scope, $location, $state, $stateParams,$mdDialog, $q, $filter, $timeout, $interval, user,paging, common, ValidationService, vmCatalogService, CONSTANTS) {
        _DebugConsoleLog("tomcat deployViewControllers.js : tomcatDeployViewCtrl", 1);
       var subPage = this;
       subPage.fn = {};

       var ct = $scope.$parent.$parent.contents;

       ct.fn.loadPage();

    })
;
