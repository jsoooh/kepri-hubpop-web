'use strict';

angular.module('portal.controllers').controller('commServiceCatalogCataListCtrl', function($scope, $location, $state, $stateParams, $translate, $interval, common, cache) {

	_DebugConsoleLog('serviceCatalogListControllers.js Start', 1);


    var contents = this;

    contents.sevGuideProject = true;
    contents.sevGuideOrg = false;

    if (common.isLeftMenuShow()) {
        common.leftMenuHide();
    }

    contents.createProject = function() {
        $location.path('/comm/projects');
        $location.search('callAddProject', 'Y');
    };

    contents.createOrg = function() {
        $location.path('/comm/orgs');
        $location.search('asideAdd', 'Y');
    };

    contents.sevGuideProject_ng = function() {
        (function() {
            var timeoutCount = 0;

            function timeout() {
                if (timeoutCount > 9) {
                    return;
                }

                if ($scope.main.projects.length == 0) {
                    contents.sevGuideProject = true;
                    contents.sevGuideOrg = false;

                    $timeout(function() {
                        _DebugConsoleLog('timeoutCountProject=' + timeoutCount, 3);
                        timeoutCount++;
                        timeout();
                    }, 1000);
                } else {
                    contents.sevGuideProject = false;
                    contents.sevGuideOrg = true;
                    contents.sevGuideOrg_ng();
                }
            }

            timeout();
        }());
    };

    contents.sevGuideOrg_ng = function() {
        (function() {
            var timeoutCount = 0;

            function timeout() {
                if (timeoutCount > 9) {
                    return;
                }

                if ($scope.main.projects.length == 0) {
                    contents.sevGuideOrg = true;

                    $timeout(function() {
                        _DebugConsoleLog('timeoutCountOrg=' + timeoutCount, 3);
                        timeoutCount++;
                        timeout();
                    }, 1000);
                } else {
                    contents.sevGuideOrg = false;
                }
            }

            timeout();
        }());
    };

    contents.sevGuideProject_ng();

    _DebugConsoleLog('serviceCatalogListControllers.js End', 1);

});
