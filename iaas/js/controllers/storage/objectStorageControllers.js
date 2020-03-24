'use strict';

angular.module('iaas.controllers')
    .filter('filterList', function () {
        var pFolder = {};
        pFolder.type = "dir";

        return function (items, path) {
            var out = [];
            if (angular.isArray(items)) {
                if (path.length > 0) {
                    pFolder.name = path + "...";
                    out.push(pFolder);
                }
                items.forEach(function (item) {
                    var subName = "";
                    if (path.length > 0) {
                        if (item.name.indexOf(path) == 0) {
                            subName = item.name.substring(path.length);
                        }
                    }
                    else {
                        subName = item.name;
                    }
                    if (subName !== undefined && subName.length > 0) {
                        var count = (subName.match(/\//ig) || []).length;
                        if ((item.type == "dir" && count == 1) || count == 0) {
                            out.push(item);
                        }
                    }
                });
            }
            else {
                out = items;
            }
            return out;
        };
    })
    .directive('fileInput', ['$parse', function ($parse) {
        return {
            restrict: 'EA',
            //replace: true,
            //transclude: true,
            link: function (scope, element, attrs) {
                var model = $parse(attrs.fileInput);
                var modelSetter = model.assign;
                element.bind('change', function () {
                    scope.$apply(function () {
                        modelSetter(scope, element[0].files);
                    });
                });
            }
        };
    }])
    .controller('iaasObjectStorageCtrl', function ($scope, $location, $state,$translate,$filter, $stateParams, user, $q,paging, common, CONSTANTS) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageCtrl", 1);
        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.objectStorageQuator = {};
        ct.roles = [];
        // 공통 레프트 메뉴의 userTenantId
        ct.data.projectId = $scope.main.sltProjectId;
        ct.data.tenantId = $scope.main.userTenantId;
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        // 공통 레프트 메뉴에서 선택된 userTenantId 브로드캐스팅 받는 함수
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;

            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        });

        ct.toDay = moment(new Date()).format('YYYY-MM-DD');


        /*오브젝트 저장소 목록,정보,용량 조회*/
        ct.fn.getObjectStorageList = function() {
            $scope.main.loadingMainBody = true;

            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/containerList', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.objectStorageList = data.content.objectContainers;
                    ct.objecteStorageQuator = data.content.objecteStorageQuator;
                }
                if (ct.objectStorageList && ct.objectStorageList.length > 0) {
                    angular.forEach(ct.objectStorageList, function (objectStorage) {
                        if (objectStorage.usedKiloByte == 0) {
                            objectStorage["usedVolume"] = objectStorage.usedKiloByte;
                            objectStorage["usedVolumeUnit"] = "GB";
                        }
                          else if (objectStorage.usedKiloByte < 1024) {
                            objectStorage["usedVolume"] = objectStorage.usedKiloByte;
                            objectStorage["usedVolumeUnit"] = "KB";
                        } else if (objectStorage.usedKiloByte >= 1024 && objectStorage.usedKiloByte < 1024*1024 ) {
                            objectStorage["usedVolume"] = Math.round(objectStorage.usedKiloByte/1024);
                            objectStorage["usedVolumeUnit"] = "MB";
                        } else {
                            objectStorage["usedVolume"] = objectStorage.usedGiGaByte;
                            objectStorage["usedVolumeUnit"] = "GB";
                        }
                    });
                }
                //console.log("ct.objectStorageList : ", ct.objectStorageList);
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        //접속정보 조회
        ct.fn.getSendSecretInfoList = function() {
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.sendSecretInfoList = data.content.secret
                }
            });
            returnPromise.error(function (data, status, headers) {
                common.showAlert("message",data.message);
                $scope.main.loadingMainBody = false;
            });
        };

         /*삭제 클릭*/
        ct.fn.deleteObjectBucket = function(objectName) {
            common.showConfirm('저장소 삭제','선택한 저장소를 삭제하시겠습니까?').then(function() {
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    bucket : objectName
                };
                var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('삭제되었습니다.');
                        ct.fn.getObjectStorageList();
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('오류가 발생하였습니다.');
                    }
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError(data.message);
                });
            });
        };

        ct.fn.createObjectStoragePop = function($event) {
            var dialogOptions =  {
                controller       : "iaasObjectStorageFormCtrl" ,
                callBackFunction : ct.objectStorageCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.objectStorageCallBackFunction = function () {
            ct.fn.getObjectStorageList();
        };

        // 오브젝트 스토리지 파일 관리
        ct.fileNavigator = function() {
            this.fileList = [];
            this.history = [];
            this.currentPath = "";
            this.onRefresh = function() {};
            // this.data = [];
        }

        ct.fileNavigator.prototype.getBasePath = function() {
            var path = (ct.fileManager.basePath || '').replace(/^\//, '');
            return path.trim() ? path.split('/') : [];
        }

        ct.fileNavigator.prototype.list = function(data, path) {
            var self = this;
            this.currentPath = path;

            self.fileList = (data || []).map(function (file) {
                var fileInfo = file;
                fileInfo.checked = false;
                return fileInfo;
            });
            self.buildTree(path);
            self.onRefresh();
        };

        ct.fileNavigator.prototype.refresh = function () {
            var self = this;
            if (!self.currentPath.length) {
                self.currentPath = this.getBasePath();
            }

            var path = self.currentPath.join('/');
            self.requesting = true;
            self.fileList = [];
            return self.list().then(function(data) {

            }).finally(function() {
                self.requesting = false;
            });
        }

        ct.fileNavigator.prototype.buildTree = function(path) {
            var flatNodes = [], selectedNode = {};

            function recursive(parent, item, path) {
                var absName = path ? (path + '/' + item.name) : item.name;
                if (parent.name && parent.name.trim() && path.trim().indexOf(parent.name) !== 0) {
                    parent.nodes = [];
                }
                if (parent.name !== path) {
                    parent.nodes.forEach(function(nd) {
                        recursive(nd, item, path);
                    });
                } else {
                    for (var e in parent.nodes) {
                        if (parent.nodes[e].name === absName) {
                            return;
                        }
                    }
                    parent.nodes.push({item: item, name: absName, nodes: []});
                }
                parent.nodes = parent.nodes.sort(function(a, b) {
                    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : a.name.toLowerCase() === b.name.toLowerCase() ? 0 : 1;
                });
            }

            function flatten(node, array) {
                array.push(node);
                for (var n in node.nodes) {
                    flatten(node.nodes[n], array);
                }
            }

            function findNode(data, path) {
                return data.filter(function (n) {
                    return n.name === path;
                })[0];
            }

            //!this.history.length && this.history.push({name: '', nodes: []});
            !this.history.length && this.history.push({ name: this.getBasePath()[0] || '', nodes: [] });
            flatten(this.history[0], flatNodes);
            selectedNode = findNode(flatNodes, path);
            selectedNode && (selectedNode.nodes = []);

            for (var o in this.fileList) {
                var item = this.fileList[o];
                // item instanceof Item && item.isFolder() && recursive(this.history[0], item, path);
                if (item.type == "dir") recursive(this.history[0], item, path);
            }
        };

        ct.fileManager = {};
        ct.fileManager.basePath = "/";
        ct.objectStorageObjectList = new ct.fileNavigator();

        ct.fn.getObjectStorageObject = function (bucketName, path) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                bucket : bucketName
            };
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/objects', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    // ct.objectStorageObjectList = data.content;
                    ct.objectStorageObjectList.list(data.content, path);
                    // $scope.path = "";
                    ct.data.bucketName = bucketName;
                } else {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError('오류가 발생하였습니다.');
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        }


        if (ct.data.tenantId) {
            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        }

        ct.fn.onDblclickObjectStorageObject = function(name, type)  {
            if (type == "dir") {
                if (name.indexOf("...") != -1) { // parent folder
                    var path = name.substring(0, name.length-4); // path/... -> path
                    var index = path.lastIndexOf("/");
                    if (index == -1) ct.objectStorageObjectList.currentPath = ""; // 최상위
                    else {
                        ct.objectStorageObjectList.currentPath = path.substring(0, index+1); //상위
                    }
                }
                else
                    ct.objectStorageObjectList.currentPath = name;
            }
        }

        ct.fn.uploadFiles = function (uploadFiles) {
            if (uploadFiles && uploadFiles.files.length > 0) {
                $scope.main.loadingMainBody = true;
                for (var i=0; i< uploadFiles.files.length; i++) {
                    var param = {
                        tenantId : ct.data.tenantId,
                        bucket : ct.data.bucketName,
                        key : ct.objectStorageObjectList.currentPath + uploadFiles.files[i].name,
                        file : uploadFiles.files[i]
                    };
                    var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', param, "multipart/form-data"));
                    returnPromise.success(function (data, status, headers) {

                    });
                    returnPromise.error(function (data, status, headers) {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError(data.message);
                        $scope.main.loadingMainBody = true;
                    });
                    returnPromise.finally(function (data, status, headers) {
                        // $scope.main.loadingMainBody = false;
                    });
                }
                $scope.main.loadingMainBody = false;
            }
        }


        ct.fn.uploadFolder = function () {
            if (ct.uploadFiles.length > 0) {

            }
        }

        /*
        ct.createFolderName = "";
        ct.fn.createFolder = function () {
            if (ct.createFolderName.length > 0) {
                // 폴더 이름 체크 필요
                var param = {
                    tenantId : ct.data.tenantId,
                    bucket : ct.data.bucketName,
                    key : ct.objectStorageObjectList.currentPath + ct.createFolderName + "/",
                    file : null
                };
                var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', param, "multipart/form-data"));
                returnPromise.success(function (data, status, headers) {
                });
                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                });
            }
        }
        */

        ct.fn.createFolder = function($event) {
            var dialogOptions =  {
                controller       : "iaasObjectStorageCreateFolderCtrl" ,
                bucketName       : ct.data.bucketName,
                path             : ct.objectStorageObjectList.currentPath,
                callBackFunction : ct.objectStorageCallBackFunction2
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.objectStorageCallBackFunction2 = function () {
            // ct.fn.getObjectStorageList();
        };



        ct.fn.deleteObject = function () {
            if (ct.objectStorageObjectList.fileList.length > 0) {
                angular.forEach(ct.objectStorageObjectList.fileList, function (item) {
                    if (item.checked == true) {
                        var param = {
                            tenantId : ct.data.tenantId,
                            bucket : ct.data.bucketName,
                            key : item.name
                        };
                        var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'DELETE', param);
                        returnPromise.success(function (data, status, headers) {
                        });
                        returnPromise.error(function (data, status, headers) {
                            common.showAlertError(data.message);
                        });
                        returnPromise.finally(function (data, status, headers) {
                        });
                    }
                });
            }
        }

        ct.fn.downloadFiles = function () {
            if (ct.objectStorageObjectList.fileList.length > 0) {
                angular.forEach(ct.objectStorageObjectList.fileList, function (item) {
                    if (item.checked == true) {
                        var param = {
                            tenantId : ct.data.tenantId,
                            bucket : ct.data.bucketName,
                            key : item.name
                        };
                        var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'GET', param);
                        returnPromise.success(function (data, status, headers) {
                            if (data) {

                                var anchor = angular.element('<a/>');
                                anchor.attr({
                                    href: data.content,
                                    target: '_blank',
                                    download: item.name
                                })[0].click();
                            }
                        });
                        returnPromise.error(function (data, status, headers) {
                            common.showAlertError(data.message);
                        });
                        returnPromise.finally(function (data, status, headers) {
                        });
                    }
                });
            }
        }

        ct.fn.refreshObjectStorage = function() {
            ct.fn.getObjectStorageObject(ct.data.bucketName, ct.objectStorageObjectList.currentPath);
        }

    })

    //오브젝트스토리지 생성 컨트롤
    .controller('iaasObjectStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageFormCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        var ct  = this;
        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "저장소 생성";
        $scope.dialogOptions.okName 	= "생성";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageForm.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
            pop.fn.createObjectStorageAction();
        };
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };
        $scope.schEnter = function (keyEvent){
            if (keyEvent.which == 13){
                $scope.popDialogOk();
            }
        };

        pop.fn.createObjectStorageAction = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var hyphen = "-"
            var params = {
                tenantId : pop.data.tenantId,
                bucket : ct.data.sltPortalOrgId+hyphen+ pop.data.containerName
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'POST',params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("저장소가 생성되었습니다.");
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })

    //오브젝트스토리지 생성 컨트롤
    .controller('iaasObjectStorageCreateFolderCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageCreateFolderCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        var ct  = this;
        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.fn 							= {};
        pop.data						= {};
        pop.data.bucketName             = $scope.dialogOptions.bucketName;
        pop.data.currentPath            = $scope.dialogOptions.path;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "폴더 만들기";
        $scope.dialogOptions.okName 	= "만들기";
        $scope.dialogOptions.closeName 	= "닫기";
        $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageCreateFolder.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok 버튼 클릭 시 액션 정의
        $scope.popDialogOk = function () {
            pop.fn.createObjectStorageCreateFolder();
        };
        $scope.popCancel = function() {
            $scope.dialogClose = true;
            common.mdDialogCancel();
        };
        $scope.schEnter = function (keyEvent){
            if (keyEvent.which == 13){
                $scope.popDialogOk();
            }
        };

        pop.fn.createObjectStorageCreateFolder = function() {
            $scope.main.loadingMainBody = true;
            pop.data.tenantId = pop.userTenant.tenantId;
            var params = {
                tenantId : pop.data.tenantId,
                bucket : pop.data.bucketName,
                key : pop.data.currentPath + pop.data.folderName + "/",
                file : null
            };
            $scope.main.loadingMainBody = true;
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', params, "multipart/form-data"));
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("폴더가 생성되었습니다.");
                $scope.main.loadingMainBody = false;
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    });

