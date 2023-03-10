'use strict';

// angular.module('iaas.controllers')
angular.module('gpu.controllers')
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
    .controller('gpuObjectStorageCtrl', function ($scope, $location, $timeout, $state, $translate, $filter, $stateParams, user, $q, paging, common, CONSTANTS) {
        // _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageCtrl", 1);
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageCtrl", 1);

        var cutObjectKey = "object_storage_cut_object_path";

        var ct = this;
        ct.fn = {};
        ct.data = {};
        ct.objecteStorageQuator = {};
        ct.roles = [];
        // ?????? ????????? ????????? userTenantId
        ct.data.projectId = $scope.main.sltProjectId;
        // ct.data.tenantId = $scope.main.userTenantId;
        ct.data.tenantId = $scope.main.userTenantGpuId;
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;
        ct.data.tenantName = $scope.main.userTenant.korName;

        ct.data.cutObjectPath = "";
        ct.data.cutObjectName = "";

        ct.data.allChecked = false;

        ct.objectStorageUsedKiloByte = 0;
        ct.objectStorageUsedMegaByte = 0;
        ct.objectStorageUsedGigaByte = 0;
        ct.objectStorageUsedVolume = "";
        ct.objectStorageUsedVolumeUnit = "";

        // ?????? ????????? ???????????? ????????? userTenantId ?????????????????? ?????? ??????
        $scope.$on('userTenantChanged',function(event,status) {
            ct.data.tenantId = status.tenantId;
            ct.data.tenantName = status.korName;

            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        });

        ct.toDay = moment(new Date()).format('YYYY-MM-DD');

        /*???????????? ????????? ??????,??????,?????? ??????*/
        ct.fn.getObjectStorageList = function() {
            $scope.main.loadingMainBody = true;

            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/containerList', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/containerList', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.objectStorageList = data.content.objectContainers;
                    ct.objecteStorageQuator = data.content.objecteStorageQuator;
                    if (ct.objectStorageList.length > 0) {
                        ct.data.bucketName = ct.objectStorageList[0].containerName;
                        ct.fn.getObjectStorageObject(ct.objectStorageList[0].containerName, "");
                    } else {
                        ct.data.bucketName = null;
                    }
                }

                /*if (ct.objectStorageList && ct.objectStorageList.length > 0) {
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
                }*/
                if (ct.objectStorageList && ct.objectStorageList.length > 0) {
                    angular.forEach(ct.objectStorageList, function (objectStorage) {
                        if (objectStorage.usedKiloByte == 0) {
                            // objectStorage["usedVolume"] = objectStorage.usedKiloByte;
                            // objectStorage["usedVolumeUnit"] = "GB";
                        }
                        else if (objectStorage.usedKiloByte < 1024) {
                            //objectStorage["usedVolume"] = objectStorage.usedKiloByte;
                            //objectStorage["usedVolumeUnit"] = "KB";
                            ct.objectStorageUsedKiloByte += objectStorage.usedKiloByte;
                        } else if (objectStorage.usedKiloByte >= 1024 && objectStorage.usedKiloByte < 1024*1024 ) {
                            // objectStorage["usedVolume"] = Math.round(objectStorage.usedKiloByte/1024);
                            // objectStorage["usedVolumeUnit"] = "MB";
                            ct.objectStorageUsedMegaByte += Math.round(objectStorage.usedKiloByte/1024);
                        } else {
                            // objectStorage["usedVolume"] = objectStorage.usedGiGaByte;
                            // objectStorage["usedVolumeUnit"] = "GB";
                            ct.objectStorageUsedGigaByte += objectStorage.usedGiGaByte;
                        }
                    });
                }
                if (ct.objectStorageUsedGigaByte > 0) {
                    ct.objectStorageUsedVolume = ct.objectStorageUsedGigaByte;
                    ct.objectStorageUsedVolumeUnit = "GB";
                }
                else if (ct.objectStorageUsedMegaByte > 0) {
                    ct.objectStorageUsedVolume = ct.objectStorageUsedMegaByte;
                    ct.objectStorageUsedVolumeUnit = "MB";
                }
                else if (ct.objectStorageUsedKiloByte > 0) {
                    ct.objectStorageUsedVolume = ct.objectStorageUsedKiloByte;
                    ct.objectStorageUsedVolumeUnit = "KB";
                }
                else {
                    ct.objectStorageUsedVolume = ct.objectStorageUsedGigaByte;
                    ct.objectStorageUsedVolumeUnit = "GB";
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

        //???????????? ??????
        ct.fn.getSendSecretInfoList = function() {
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId,containerName:ct.containerName}, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/sendSecretInfo', 'GET', {tenantId:ct.data.tenantId}, 'application/x-www-form-urlencoded');
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

         /*?????? ??????*/
        ct.fn.deleteObjectBucket = function(objectName) {
            common.showConfirm('????????? ??????','????????? ???????????? ?????????????????????????').then(function() {
                $scope.main.loadingMainBody = true;
                var param = {
                    tenantId : ct.data.tenantId,
                    bucket : objectName
                };
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket', 'DELETE', param);
                returnPromise.success(function (data, status, headers) {
                    if (status == 200 && data) {
                        common.showAlertSuccess('?????????????????????.');
                        ct.fn.getObjectStorageList();
                    } else {
                        $scope.main.loadingMainBody = false;
                        common.showAlertError('????????? ?????????????????????.');
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
                // controller       : "iaasObjectStorageFormCtrl" ,
                controller       : "gpuObjectStorageFormCtrl" ,
                callBackFunction : ct.objectStorageCallBackFunction
            };

            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.objectStorageCallBackFunction = function () {
            ct.fn.getObjectStorageList();
        };

        // ???????????? ???????????? ?????? ??????
        ct.fileNavigator = function() {
            this.fileList = [];
            this.history = [];
            this.currentPath = "";
            // this.onRefresh = function() {};
        };

        ct.fileNavigator.prototype.getBasePath = function() {
            var path = (ct.fileManager.basePath || '').replace(/^\//, '');
            return path.trim() ? path.split('/') : [];
        };

        ct.fileNavigator.prototype.list = function(data, path) {
            var self = this;
            this.currentPath = path;

            self.fileList = (data || []).map(function (file) {
                var fileInfo = file;
                fileInfo.checked = false;
                if (fileInfo.size > 0) fileInfo.size = Math.round(fileInfo.size/1024) + "KB";
                return fileInfo;
            });
            self.buildTree(path);
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
        };

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
        ct.objectStorageObjectList.currentPathList = [];
        ct.objectStorageObjectList.currentPathList.push("/");

        ct.fn.getObjectStorageObject = function (bucketName, path) {
            $scope.main.loadingMainBody = true;
            var param = {
                tenantId : ct.data.tenantId,
                bucket : bucketName
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/objects', 'GET', param);
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/objects', 'GET', param);
            returnPromise.success(function (data, status, headers) {
                if (data.content) {
                    ct.objectStorageObjectList.list(data.content, path);
                    ct.data.bucketName = bucketName;

                    ct.data.cutObjectPath = "";
                    ct.data.cutObjectName = "";

                } else {
                    $scope.main.loadingMainBody = false;
                    common.showAlertError('????????? ?????????????????????.');
                }
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                common.showAlertError(data.message);
            });
            returnPromise.finally(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
            });
        };

        if (!$scope.main.sltPortalOrg.isUseGpu) {
            common.showDialogAlert('??????', '?????? ??????????????? "GPU ?????? ?????????"??? ???????????? ?????? ?????????????????????.');
            $scope.main.goToPage("/comm/projects/projectDetail/" + $scope.main.sltPortalOrg.id);
        }

        if (ct.data.tenantId) {
            ct.fn.getObjectStorageList();
            ct.fn.getSendSecretInfoList();
        }

        ct.fn.onClickObjectStorageObject = function(name, type)  {
            if (type == "dir") {
                if (name.indexOf("...") != -1) { // parent folder
                    var path = name.substring(0, name.length-4); // path/... -> path
                    var index = path.lastIndexOf("/");
                    if (index == -1) ct.objectStorageObjectList.currentPath = ""; // ?????????
                    else {
                        ct.objectStorageObjectList.currentPath = path.substring(0, index+1); //??????
                    }
                }
                else {
                    ct.objectStorageObjectList.currentPath = name;
                }
                ct.fn.updatePathList(ct.objectStorageObjectList.currentPath); // Path ????????????
                ct.fn.changeCheckedState(false); // ?????? ?????? ???
            }
        };

        ct.fn.onClickObjectStoragePathList = function(index) {
            if (ct.objectStorageObjectList.currentPathList.length - 1 != index) { // ?????? ????????? ?????? path
                var currentPath = "";
                for (var i = 1; i <= index; i++ ) {
                    currentPath += ct.objectStorageObjectList.currentPathList[i];
                }
                ct.objectStorageObjectList.currentPath = currentPath;
                ct.fn.updatePathList(ct.objectStorageObjectList.currentPath); // Path ????????????
            }
        };

        ct.fn.changeCheckedState = function(checked) {
            for (var i = 0; i < ct.objectStorageObjectList.fileList.length; i++) {
                ct.objectStorageObjectList.fileList[i].checked = checked;
            }
        };

        ct.fn.onClickAllChecked = function() {
            ct.fn.changeCheckedState(ct.data.allChecked);
        };

        ct.fn.informationOpenClick = function (information) {
            if (ct.data.information) {
                ct.data.information = false;
            } else {
                ct.data.information = true;
            }
        };

        ct.fn.uploadFiles = function (uploadFiles) {
            $scope.main.loadingMain = true;
            if (uploadFiles && uploadFiles.files.length > 0) {
                var param = {};
                param.tenantId = ct.data.tenantId;
                param.bucket = ct.data.bucketName;
                param.key = ct.objectStorageObjectList.currentPath;
                param.files = [];
                console.log("files.length >>>>> "+uploadFiles.files.length);
                if (uploadFiles && uploadFiles.files && uploadFiles.files.length > 0) {
                    angular.forEach(uploadFiles.files, function(file) {
                        if (file.name && ct.objectStorageObjectList) {
                            var objectStorageObject = common.objectsFindByField(ct.objectStorageObjectList.fileList, 'name', file.name);
                            if (file.size && file.size/1024 > 1024*1024*2) {
                                console.log("file size >>>>> "+ file.size/1024 +"KB");
                                common.showAlertError("?????????: "+file.name+"(2GB ????????? ????????? ???????????????.)");
                                $scope.main.loadingMainBody = false;
                                ct.fn.refreshObjectStorage();
                                $scope.main.loadingMain = false;
                            } else if (objectStorageObject) {
                                console.log(file.name + "??? ?????? ???????????? ???????????????.");
                                common.showAlertError("????????? ???????????? ???????????????.");
                                $scope.main.loadingMainBody = false;
                                ct.fn.refreshObjectStorage();
                                $scope.main.loadingMain = false;
                            } else {
                                param.files.push(file);
                                console.log("????????? ?????? ?????????: " + file.name);
                            }
                        }
                    });
                }
                $scope.main.loadingMainBody = true;
                $scope.main.loadingMain = true;
                // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', param, "multipart/form-data"));
                var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', param, "multipart/form-data"));
                returnPromise.success(function (data, status, headers) {
                    //common.showAlertError('date='+new Date());
                    $scope.main.loadingMainBody = false;
                    ct.fn.refreshObjectStorage();
                    $scope.main.loadingMain = false;
                    //$state.reload();
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    $scope.main.loadingMain = false;
                    console.log("status="+status);
                    console.log("error==> "+data.message);
                    common.showAlertError(data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    // $scope.main.loadingMainBody = false;
                });
            }
            $scope.main.loadingMainBody = false;

            /* donwload ??????  - ??????
            var timer = function() {
                var param = {};
                param.tenantId = ct.data.tenantId;
                param.bucket = ct.data.bucketName;
                var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object/state', 'GET', param, "application/x-www-form-urlencoded"));
                returnPromise.success(function (data, status, headers) {
                });
                returnPromise.error(function (data, status, headers) {
                    $scope.main.loadingMainBody = false;
                    $state.reload();
                    common.showAlertError(data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                    // $scope.main.loadingMainBody = false;
                });
                $timeout(timer, 2000);
            }
            $timeout(timer, 2000);
            */
        };

        ct.fn.createFolder = function($event) {
            var dialogOptions =  {
                // controller       : "iaasObjectStorageCreateFolderCtrl" ,
                controller       : "gpuObjectStorageCreateFolderCtrl" ,
                bucketName       : ct.data.bucketName,
                path             : ct.objectStorageObjectList.currentPath,
                callBackFunction : ct.objectStorageCallBackFunction2
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.objectStorageCallBackFunction2 = function () {
            ct.fn.refreshObjectStorage();
        };

        ct.fn.renameObject = function($event) {
            var items = ct.fn.getCheckedFileItems();
            if (items != null && items.length == 1) { // 1?????? ??????
                var subName = items[0].name.indexOf(ct.objectStorageObjectList.currentPath) == 0 ? items[0].name.substring(ct.objectStorageObjectList.currentPath.length) : items[0].name;
                var dialogOptions = {
                    // controller: "iaasObjectStorageRenameCtrl",
                    controller: "gpuObjectStorageRenameCtrl",
                    bucketName: ct.data.bucketName,
                    key: subName,
                    path: ct.objectStorageObjectList.currentPath,
                    callBackFunction: ct.objectStorageCallBackFunction2
                };
                $scope.actionBtnHied = false;
                common.showDialog($scope, $event, dialogOptions);
                $scope.actionLoading = true; // action loading
            }
        };

        ct.fn.showObjectStorageInformation = function ($event) {
            var dialogOptions = {
                // controller: "iaasObjectStorageInformationCtrl",
                controller: "gpuObjectStorageInformationCtrl",
                okBtnHide: true
            };
            $scope.actionBtnHied = false;
            common.showDialog($scope, $event, dialogOptions);
            $scope.actionLoading = true; // action loading
        };

        ct.fn.cutObject = function () {
            var items = ct.fn.getCheckedFileItems();
            if (items != null && items.length == 1) { // 1?????? ??????
                ct.data.cutObjectPath = ct.objectStorageObjectList.currentPath;
                ct.data.cutObjectName = items[0].name.indexOf(ct.objectStorageObjectList.currentPath) == 0 ? items[0].name.substring(ct.objectStorageObjectList.currentPath.length) : items[0].name;
            }
        };

        ct.fn.pasteObject = function () {
            if (ct.data.cutObjectName.length > 0) {
                if (ct.data.cutObjectPath !== ct.objectStorageObjectList.currentPath) {
                    var param = {
                        tenantId : ct.data.tenantId,
                        sourceBucket : ct.data.bucketName,
                        sourceKey : ct.data.cutObjectPath + ct.data.cutObjectName,
                        destinationBucket : ct.data.bucketName,
                        destinationKey : ct.objectStorageObjectList.currentPath + ct.data.cutObjectName
                    };
                    // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
                    var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
                    returnPromise.success(function (data, status, headers) {
                        ct.fn.refreshObjectStorage();
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlertError(data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                    });
                }
            }
        };

        ct.fn.deleteObject = function () {
            var items = ct.fn.getCheckedFileItems();
            if (items != null && items.length > 0) { // ?????? ??? ??????
                common.showConfirm('?????? ??????','????????? ????????? ?????????????????????????').then(function() {
                    var param = {};
                    param.tenantId = ct.data.tenantId;
                    param.bucket = ct.data.bucketName;
                    param.keys = [];
                    for (var i = 0; i < items.length; i++) {
                        param.keys.push(items[i].name);
                    }
                    // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'DELETE', param);
                    var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object', 'DELETE', param);
                    returnPromise.success(function (data, status, headers) {
                        ct.fn.refreshObjectStorage();
                    });
                    returnPromise.error(function (data, status, headers) {
                        common.showAlertError(data.message);
                    });
                    returnPromise.finally(function (data, status, headers) {
                    });
                })
            }
        };

        ct.fn.downloadFiles = function () {
            var items = ct.fn.getCheckedFileItems();
            if (items != null && items.length > 0) { // ?????? ??? ??????
                var param = {};
                param.tenantId = ct.data.tenantId;
                param.bucket = ct.data.bucketName;
                param.keys = [];
                for (var i=0; i < items.length; i++) {
                    param.keys.push(items[i].name);
                }
                // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'GET', param, 'application/x-www-form-urlencoded');
                var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object', 'GET', param, 'application/x-www-form-urlencoded');
                returnPromise.success(function (data, status, headers) {
                    if (data) {
                        for (var index = 0;  index < data.content.length; index++ ) {
                            var pos = data.content[index].indexOf("?");
                            var fileName = data.content[index].substring(data.content[index].lastIndexOf("/", pos) + 1, pos);
                            var anchor = angular.element('<a/>');
                            anchor.attr({
                                href: data.content[index],
                                target: '_blank',
                                download: fileName
                            })[0].click();
                        }
                    }
                });

                returnPromise.error(function (data, status, headers) {
                    common.showAlertError(data.message);
                });
                returnPromise.finally(function (data, status, headers) {
                });
            }
        };

         ct.fn.copyDownloadUrl = function () {
             var items = ct.fn.getCheckedFileItems();
             if (items != null && items.length == 1) { // 1?????? ??????
                 var param = {};
                 param.tenantId = ct.data.tenantId;
                 param.bucket = ct.data.bucketName;
                 param.keys = [];
                 for (var i=0; i < items.length; i++) {
                     param.keys.push(items[i].name);
                 }

                 // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'GET', param, 'application/x-www-form-urlencoded');
                 var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object', 'GET', param, 'application/x-www-form-urlencoded');
                 returnPromise.success(function (data, status, headers) {
                     if (data) {
                         if (data.content.length == 1) {
                             common.copyToClipboard(data.content[0]);
                         }
                     }
                 });
                 returnPromise.error(function (data, status, headers) {
                     common.showAlertError(data.message);
                 });
                 returnPromise.finally(function (data, status, headers) {
                 });
             }
         };

        // URL ??????????????? ????????????
        ct.fn.copyUrlToClipboard = function (url) {
            if (url) {
                common.copyToClipboard(url);
                $scope.main.copyToClipboard(url, '"' + url + '"??? ??????????????? ?????? ???????????????.');
            }
        };

         ct.fn.getCheckedFileItems = function() {
            var items = [];
            if (ct.objectStorageObjectList.fileList.length > 0) {
                for (var i=0; i< ct.objectStorageObjectList.fileList.length; i++) {
                    var item = ct.objectStorageObjectList.fileList[i];
                    if (item.checked == true) {
                        items.push(item);
                    }
                }
            }
            return items;
         };

         ct.fn.getCheckedDownloadItems = function() {
             var checked = false;

             if (ct.objectStorageObjectList.fileList.length > 0) {
                 for (var i=0; i< ct.objectStorageObjectList.fileList.length; i++) {
                     var item = ct.objectStorageObjectList.fileList[i];
                     if (item.checked == true) {
                         if (item.type == 'dir') { // ????????? ??????????????? ??? ???
                             return false;
                         }
                         checked = true;
                     }
                 }
             }
             return checked;
         };

         ct.fn.updatePathList = function (currentPath) {
             ct.objectStorageObjectList.currentPathList = [];
             ct.objectStorageObjectList.currentPathList.push("/");
             if (currentPath.length > 0) {
                var pathList = currentPath.split("/");
                for (var i = 0; i < pathList.length; i++ ) {
                    if (pathList[i].length > 0 )
                        ct.objectStorageObjectList.currentPathList.push(pathList[i] + "/");
                }
             }
         };

        ct.fn.refreshObjectStorage = function() {
            ct.data.cutObjectName = "";
            ct.fn.getObjectStorageObject(ct.data.bucketName, ct.objectStorageObjectList.currentPath);
        }
    })
    //???????????????????????? ?????? ?????????
    .controller('gpuObjectStorageFormCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageFormCtrl", 1);
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageFormCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        var ct  = this;
        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.fn 							= {};
        pop.data						= {};
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "????????? ??????";
        $scope.dialogOptions.okName 	= "??????";
        $scope.dialogOptions.closeName 	= "??????";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/popObjectStorageForm.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok ?????? ?????? ??? ?????? ??????
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
            var hyphen = "-";
            var params = {
                tenantId : pop.data.tenantId,
                bucket : ct.data.sltPortalOrgId+hyphen+ pop.data.containerName
            };
            $scope.main.loadingMainBody = true;
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket', 'POST',params, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket', 'POST',params, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("???????????? ?????????????????????.");
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })
    //???????????????????????? ?????? ?????????
    .controller('gpuObjectStorageCreateFolderCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageCreateFolderCtrl", 1);
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageCreateFolderCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        var ct  = this;
        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.fn 							= {};
        pop.data						= {};
        pop.data.bucketName             = $scope.dialogOptions.bucketName;
        pop.data.currentPath            = $scope.dialogOptions.path;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "?????? ?????????";
        $scope.dialogOptions.okName 	= "?????????";
        $scope.dialogOptions.closeName 	= "??????";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageCreateFolder.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/popObjectStorageCreateFolder.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok ?????? ?????? ??? ?????? ??????
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
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
            // var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', params, "multipart/form-data"));
            var returnPromise = common.retrieveResource(common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object', 'POST', params, "multipart/form-data"));
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("????????? ?????????????????????.");
                $scope.main.loadingMainBody = false;
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })
    //???????????????????????? ?????? ?????????
    .controller('gpuObjectStorageRenameCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        // _DebugConsoleLog("objectStorageControllers.js : iaasObjectStorageRenameCtrl", 1);
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageRenameCtrl", 1);
        $scope.contents = common.getMainContentsCtrlScope().contents;
        $scope.dialogOptions = common.getMainContentsCtrlScope().dialogOptions;
        var ct  = this;
        var pop = this;
        pop.validationService 			= new ValidationService({controllerAs: pop});
        pop.formName 					= $scope.dialogOptions.formName;
        // pop.userTenant 					= angular.copy($scope.main.userTenant);
        pop.userTenant 					= angular.copy($scope.main.userTenantGpu);
        pop.fn 							= {};
        pop.data						= {};
        pop.data.bucketName             = $scope.dialogOptions.bucketName;
        pop.data.key                    = $scope.dialogOptions.key;
        pop.data.rename                 = $scope.dialogOptions.key;
        pop.data.currentPath            = $scope.dialogOptions.path;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "?????? ?????? ??????";
        $scope.dialogOptions.okName 	= "??????";
        $scope.dialogOptions.closeName 	= "??????";
        // $scope.dialogOptions.templateUrl = _IAAS_VIEWS_ + "/storage/popObjectStorageRenameForm.html" + _VersionTail();
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/popObjectStorageRenameForm.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok ?????? ?????? ??? ?????? ??????
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
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
            var param = {
                tenantId : ct.data.tenantId,
                sourceBucket : ct.data.bucketName,
                sourceKey : ct.data.currentPath + pop.data.key,
                destinationBucket : ct.data.bucketName,
                destinationKey : ct.data.currentPath + pop.data.rename
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("????????? ?????? ???????????????.");
                $scope.main.loadingMainBody = false;
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })
    .controller('gpuObjectStorageUploadCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageUploadCtrl", 1);
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
        pop.data.key                    = $scope.dialogOptions.key;
        pop.data.rename                 = $scope.dialogOptions.key;
        pop.data.currentPath            = $scope.dialogOptions.path;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "?????? ?????? ??????";
        $scope.dialogOptions.okName 	= "??????";
        $scope.dialogOptions.closeName 	= "??????";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/popObjectStorageUploadForm.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok ?????? ?????? ??? ?????? ??????
        $scope.popDialogOk = function () {
            if ($scope.actionBtnHied) return;
            $scope.actionBtnHied = true;

            if (!pop.validationService.checkFormValidity(pop[pop.formName]))
            {
                $scope.actionBtnHied = false;
                return;
            }
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
            var param = {
                tenantId : ct.data.tenantId,
                sourceBucket : ct.data.bucketName,
                sourceKey : ct.data.currentPath + pop.data.key,
                destinationBucket : ct.data.bucketName,
                destinationKey : ct.data.currentPath + pop.data.rename
            };
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("????????? ?????? ???????????????.");
                $scope.main.loadingMainBody = false;
                $mdDialog.hide();
            });
            returnPromise.error(function (data, status, headers) {
                $scope.main.loadingMainBody = false;
                $state.reload();
                common.showAlertError(data.message);
            });
        };
    })
    .controller('gpuObjectStorageInformationCtrl', function ($scope, $location, $state,$translate,$timeout, $stateParams, $mdDialog, user, common, ValidationService, CONSTANTS ) {
        _DebugConsoleLog("objectStorageControllers.js : gpuObjectStorageInformationCtrl", 1);
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
        pop.data.key                    = $scope.dialogOptions.key;
        pop.data.rename                 = $scope.dialogOptions.key;
        pop.data.currentPath            = $scope.dialogOptions.path;
        pop.callBackFunction 			= $scope.dialogOptions.callBackFunction;

        $scope.dialogOptions.title      = "?????? ??????";
        $scope.dialogOptions.okName 	= "??????";
        $scope.dialogOptions.closeName 	= "??????";
        $scope.dialogOptions.templateUrl = _GPU_VIEWS_ + "/storage/popObjectStorageInformationForm.html" + _VersionTail();
        ct.data.sltPortalOrgId = $scope.main.sltPortalOrgId;

        $scope.actionLoading 			= false;
        pop.btnClickCheck 				= false;
        pop.validDisabled 				= true;

        // Dialog ok ?????? ?????? ??? ?????? ??????
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
            var param = {
                tenantId : ct.data.tenantId,
                sourceBucket : ct.data.bucketName,
                sourceKey : ct.data.currentPath + pop.data.key,
                destinationBucket : ct.data.bucketName,
                destinationKey : ct.data.currentPath + pop.data.rename
            };
            // var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
            var returnPromise = common.resourcePromise(CONSTANTS.gpuApiContextUrl + '/storage/objectStorage/bucket/object/move', 'POST', param, 'application/x-www-form-urlencoded');
            returnPromise.success(function (data, status, headers) {
                $scope.dialogOptions.callBackFunction();
                $scope.actionLoading = false;
                $scope.actionBtnHied = false;
                common.showAlertSuccess("????????? ?????? ???????????????.");
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
