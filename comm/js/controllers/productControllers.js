'use strict';

angular.module('product.controllers')
    .controller('commProductIaasCtrl', function ($scope, $location, $state, $stateParams, $translate, productService, cache, common, CONSTANTS) {
        _DebugConsoleLog("productControllers.js : commProductIaasCtrl", 1);

        var ct = this;
        var productInstance = $scope.productInstance = {};
        productInstance.productInstances = [];

        /* IaaS 상품관리 전체선택 */
        ct.checkedProducts = function (division) {
            productInstance.productInstances.items.forEach(function (product) {
                if (division == 'storage') {
                    product.checked = ct.storageAllCheck;
                } else if (division == 'network') {
                    product.checked = ct.networkAllCheck;
                } else {
                    product.checked = ct.computingAllCheck;
                }
            });
        };

        /* 스토리지 상품 구분 */
        ct.iaasStorageType = CONSTANTS.productCode.type.iaasType.storage;
        ct.iaasStorageUnitCode = CONSTANTS.productCode.unit_code.iaasUnitCode.storage;

       /* console.log("IaaS Storage Tyupe : ");
        console.log(ct.iaasStorageType);
        ct.selIaasStorageType = ct.iaasStorageType[0];
        ct.changeIaasStrorageType = function (storageType){
            console.log(ct.selIaasStorageType);
            console.log(storageType);
        }*/

        /* IaaS 상품관리 */
        ct.listProducts = function (division) {
            $scope.main.loadingMainBody = true;

            var param = {
                service: 'IaaS',
                division: 'computing'
            };
            if (division != undefined) param.division = division;

            var productPromise = productService.listProduct(param);
            productPromise.success(function (data) {
                productInstance.productInstances = data;
                $scope.main.loadingMainBody = false;
            });
            productPromise.error(function (data) {
                productInstance.productInstances = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /* 상품관리 저장 */
        ct.saveProducts = function (division) {
            $scope.main.loadingMainBody = true;
            var saveProduct = [];
            var productData = productInstance.productInstances.items;
            angular.forEach(productData, function(product) {
                if (product.id == undefined) {
                    saveProduct.push(product);
                }
            });

            var productPromise = productService.saveProduct(saveProduct);
            productPromise.success(function (data) {
                common.showAlert("상품 추가", $translate.instant("message.mi_create_success"));
                saveProduct = [];
                ct.listProducts(division);
                $scope.main.loadingMainBody = false;
            });
            productPromise.error(function (data) {
                common.showAlert("상품 추가 오류", data);
                saveProduct = [];
                $scope.main.loadingMainBody = false;
            });
        };

        /* 상품관리 삭제 */
        ct.removeProducts = function ($event) {
            $scope.main.loadingMainBody = true;
            var removeData = [];
            var products = productInstance.productInstances.items;
            var checkIdx = [];

            for (var i=0; i<products.length; i++) {
                if (products[i].checked) {
                    if (products[i].id != undefined) {
                        removeData.push(products[i]);
                    }
                    checkIdx.push(i);
                }
            }

            if (checkIdx.length == 0) {
                //common.showAlert("", "삭제할 상품이 없습니다.");
                common.showAlert("상품 삭제", $translate.instant("message.mi_dont_exist_checked"));//선택하신 건이 없습니다.
                $scope.main.loadingMainBody = false;
                return;
            }

            // 체크된 index를 역순으로 변경한다(순차적으로 삭제시 index가 틀어짐)
            checkIdx = checkIdx.reverse();
            for (var i=0; i<checkIdx.length; i++) {
                productInstance.productInstances.items.splice(checkIdx[i], 1);
            }

            if (removeData.length > 0) {
                var productPromise = productService.removeProduct(removeData);
                productPromise.success(function (data, status, headers) {
                    common.showAlert("상품 삭제", $translate.instant("message.mi_delete"));
                    removeData = [];
                    //ct.listProducts("computing");
                });
                productPromise.error(function (data, status, headers) {
                    if (status == 406) {
                        common.showAlert("상품 삭제 오류", $translate.instant('message.mi_cant_delete_product_quota_current_using'));
                    } else {
                        common.showAlert("상품 삭제 오류", data);
                    }
                    removeData = [];
                });
            }
            $scope.main.loadingMainBody = false;
        };

        /* storage Disk 입력시 max값을 입력값으로 defalut 셋팅 */
        ct.storageDisk = function (product) {
            product.startUseSection = parseInt(product.disk);
            product.endUseSection = parseInt(product.disk);
        };
        /* storage Disk max값 증가 */
        ct.plusDisk = function (product){
            product.endUseSection = parseInt(product.endUseSection) + parseInt(product.disk);
        };
        /* storage Disk max값 감소 */
        ct.minusDisk = function (product){
            if (product.disk >= product.endUseSection) {
                return;
            }
            product.endUseSection = parseInt(product.endUseSection) - parseInt(product.disk);
        };

        /* 서버스펙 검색(IaaS 컴퓨팅 추가) */
        ct.searchServerSpec = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.server_spec_search"),
                form : {
                    name: "searchSpec",
                    options: "",
                },
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_ + "/product/popSearchSpecs.html" + _VersionTail(),
                okName : $translate.instant("label.confirm")
            };

            pop.searchServerSpec();

            common.showDialog($scope, $event, dialogOptions);
        };

        /* IaaS 컴퓨팅 추가 */
        ct.addComputing = function() {
            var computing = {'service' : 'IaaS'
                ,'division' : 'computing'
                ,'type' : 'Server'
                ,'productName' : ''
                ,'vcpus' : 0
                ,'ram' : 0
                ,'disk' : 0
                ,'timeFee' : 0
                ,'monthFee' : 0};
            productInstance.productInstances.items.push(computing);
        };

        /* IaaS 스토리지 추가 */
        ct.addStorage = function() {
            var storageType = ct.iaasStorageType[0];
            if (productInstance.productInstances.items.length > 0) {
                var itemLength = productInstance.productInstances.items.length;
                storageType = productInstance.productInstances.items[itemLength-1].type;
            }

            var storage = {'service' : 'IaaS'
                          ,'division' : 'storage'
                          ,'type' : storageType
                          ,'productName' : ''
                          ,'disk' : 0
                          ,'unitCd' : 'HDD'
                          ,'endUseSection' : 0
                          ,'timeFee' : 0
                          ,'monthFee' : 0};
            productInstance.productInstances.items.push(storage);
        };

        /* IaaS 네트워크 추가 */
        ct.addNetwork = function() {
            var network = {'service' : 'IaaS'
                          ,'division' : 'network'
                          ,'type' : 'inBound'
                          ,'productName' : 'Server'
                          ,'unitCd' : 'GB'
                          ,'startUseSection' : 0
                          ,'endUseSection' : 0
                          ,'timeFee' : 0
                          ,'monthFee' : 0};
            productInstance.productInstances.items.push(network);
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.serverSpecData = [];
        pop.serverSpecInstances = {};

        /* 서버스펙 검색 */
        pop.searchServerSpec = function() {
            var sText = $scope.schText == null?"%":"%"+$scope.schText+"%";
            //서버스펙 : 검색구분/검색어
            var param = {'schType': 'spec_name'
                        ,'schText': sText};

            var searchPromise = productService.searchServerSpec(param);
            searchPromise.success(function(data, status, headers){
                pop.serverSpecInstances = data.tokenInfo;
            });
            searchPromise.error(function(data) {
                common.showAlert("", data);
            });

            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.addServerSpec(pop.serverSpecData);
            }
        };

        //서버스펙 선택시 serverSpecData(temp) 객체에 splice & push
        pop.specCheckFn = function(specData) {
            var idx = pop.serverSpecData.indexOf(specData);
            if (idx > -1) {
                pop.serverSpecData.splice(idx, 1);
            } else {
                pop.serverSpecData.push(specData);
            }
        };

        //서버스펙 확인 클릭시 선택된 객체를 부모창의 객체에 전달
        pop.addServerSpec = function(serverSpecData) {
            var productData = productInstance.productInstances.items;
            var duplicateData = [];
            angular.forEach(serverSpecData, function(item) {
                var flag = true;
                angular.forEach(productData, function(product) {
                    if (item.uuid == product.uuid) {
                        flag = false;
                        duplicateData.push(item.name);
                        return;
                    }
                });
                if (flag) {
                    item.service = 'IaaS';
                    item.division = 'computing';
                    item.type = 'Server';
                    item.productName = 'Standard';
                    item.timeFee = 0;
                    item.monthFee = 0;
                    item.unitCd = 'GB';
                    item.ram = (item.ram*1024)/1048576; // MB -> GB로 변환
                    productInstance.productInstances.items.push(item);
                } else {
                    return;
                }
            });
            pop.serverSpecData = [];
            pop.serverSpecInstances = {};
            $scope.popHide();
            if (duplicateData.length > 0) {
                //common.showAlert("추가된 스펙이 존재합니다.", duplicateData.join(', '));
                common.showAlert("상품 추가", duplicateData.join(', ') + '(은)는 이미 등록된 상품입니다.');
                duplicateData = [];
            }
            duplicateData = [];
        };

        $scope.main.loadingMainBody = false;

    })
    .controller('commProductPaasCtrl', function ($scope, $location, $state, $stateParams, $translate, productService, cache, common, CONSTANTS) {
        _DebugConsoleLog("productControllers.js : commProductPaasCtrl", 1);

        var ct = this;

        var productInstance = $scope.productInstance = {};
        productInstance.productInstances = [];

        /* PaaS 상품관리 전체선택 */
        ct.checkedProducts = function (productName) {
            productInstance.productInstances.items.forEach(function (product) {
                product.checked = ct.paasAllCheck;
            });
        };

        /* PaaS 상품관리 */
        ct.paasProducts = function () {
            $scope.main.loadingMainBody = true;

            var param = {
                'service': 'PaaS'
            };

            var productPromise = productService.listProduct(param);
            productPromise.success(function (data) {
                productInstance.productInstances = data;
                $scope.main.loadingMainBody = false;
            });
            productPromise.error(function (data) {
                productInstance.productInstances = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.paasProducts();

        /* PaaS 용량계획 검색 */
        ct.searchPaasQuota = function ($event) {
            var dialogOptions = {
                title : $translate.instant("label.paas_quota_search"),
                form : {
                    name: "searchQuota",
                    options: ""
                },
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_ + "/product/popSearchQuotas.html" + _VersionTail(),
                okName : $translate.instant("label.confirm")
            };

            pop.searchPaasQuota();

            common.showDialog($scope, $event, dialogOptions);
        };

        /* 상품관리 저장 */
        ct.saveProducts = function (productName) {
            $scope.main.loadingMainBody = true;
            var saveProduct = [];
            var productData = productInstance.productInstances.items;
            angular.forEach(productData, function(product) {
                if (product.id == undefined) {
                    saveProduct.push(product);
                }
            });

            var productPromise = productService.saveProduct(saveProduct);
            productPromise.success(function (data) {
                common.showAlert("상품 추가", $translate.instant("message.mi_create_success"));
                saveProduct = [];
                //ct.paasProducts();
                $scope.main.loadingMainBody = false;
            });
            productPromise.error(function (data) {
                common.showAlert("상품 추가 오류", data);
                saveProduct = [];
                $scope.main.loadingMainBody = false;
            });

        };

        /* 상품관리 삭제 */
        ct.removeProducts = function ($event) {
            $scope.main.loadingMainBody = true;
            var removeData = [];
            var products = productInstance.productInstances.items;
            var checkIdx = [];

            for (var i=0; i<products.length; i++) {
                if (products[i].checked) {
                    if (products[i].id != undefined) {
                        removeData.push(products[i]);
                    }
                    checkIdx.push(i);
                }
            }

            if (checkIdx.length == 0) {
                //common.showAlert("","삭제할 상품이 없습니다.");
                common.showAlert("상품 삭제",$translate.instant("message.mi_dont_exist_checked"));//선택하신 건이 없습니다.
                $scope.main.loadingMainBody = false;
                return;
            }

            // 체크된 index를 역순으로 변경한다(순차적으로 삭제시 index가 틀어짐)
            checkIdx = checkIdx.reverse();
            for (var i=0; i<checkIdx.length; i++) {
                productInstance.productInstances.items.splice(checkIdx[i], 1);
            }

            if (removeData.length > 0) {
                var productPromise = productService.removeProduct(removeData);
                productPromise.success(function (data, status, headers) {
                    common.showAlert("상품 삭제", $translate.instant("message.mi_delete"));
                    removeData = [];
                    //ct.paasProducts();
                });
                productPromise.error(function (data, status, headers) {
                    if (status == 406) {
                        common.showAlert("상품 삭제 오류", $translate.instant('message.mi_cant_delete_product_quota_current_using'));
                    } else {
                        common.showAlert("상품 삭제 오류", data);
                    }
                    removeData = [];
                });
            }
            $scope.main.loadingMainBody = false;
        };

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.paasQuotaData = [];
        pop.paasQuotaInstances = {};

        /* 용량계획 검색 */
        pop.searchPaasQuota = function() {
            var sText = $scope.schText == null?"%":"%"+$scope.schText+"%";
            //용량검색 : 검색구분/검색어
            var param = {'schType': 'spec_name'
                        ,'schText': sText};

            var searchPromise = productService.searchPaasQuota(param);
            searchPromise.success(function(data, status, headers){
                pop.paasQuotaInstances = data.items;
            });
            searchPromise.error(function(data) {
                //common.alert(data);
                //common.showAlert("", data);
            });

            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.addPaasQuota(pop.paasQuotaData);
            }
        };

        //용량계획 선택시 paasQuotaData(temp) 객체에 splice & push
        pop.quotaCheckFn = function(quotaData) {
            var idx = pop.paasQuotaData.indexOf(quotaData);
            if (idx > -1) {
                pop.paasQuotaData.splice(idx, 1);
            } else {
                pop.paasQuotaData.push(quotaData);
            }
        };

        //서버스펙 확인 클릭시 선택된 객체를 부모창의 객체에 전달
        pop.addPaasQuota = function(paasQuotaData) {
            var productData = productInstance.productInstances.items;
            var duplicateData = [];
            angular.forEach(paasQuotaData, function(item) {
                var flag = true;
                angular.forEach(productData, function(product) {
                    if (item.guid == product.guid) {
                        flag = false;
                        duplicateData.push(item.name);
                        return;
                    }
                });
                if (flag) {
                    var quota = {
                        'service'     : 'PaaS'
                       ,'productName' : item.name
                       ,'division'    : 'public'
                       ,'ram'         : (item.memoryLimit*1024)/1048576 // MB -> GB로 변환
                       ,'paasService' : item.totalServices
                       ,'route'       : item.totalRoutes
                       ,'appInstance' : item.appInstanceLimit
                       ,'timeFee'     : 0
                       ,'monthFee'    : 0
                       ,'uuid'        : item.guid
                    };
                    productInstance.productInstances.items.push(quota);
                } else {
                    return;
                }
            });
            pop.paasQuotaData = [];
            pop.paasQuotaInstances = {};
            $scope.popHide();

            if (duplicateData.length > 0) {
                //common.showAlert("","추가된 서버가 존재합니다.\n(" + duplicateData.join(', ') + ")");
                //common.showAlert("추가된 상품이 존재합니다.", duplicateData.join(', '));
                common.showAlert("상품 추가 오류", duplicateData.join(', ') + '(은)는 이미 등록된 상품입니다.');
                duplicateData = [];
            }

        };

        $scope.main.loadingMainBody = false;

    })
    .controller('commProductDevopsCtrl', function ($scope, $location, $state, $stateParams, $translate, productService, cache, common, CONSTANTS) {
            _DebugConsoleLog("productControllers.js : commProductDevopsCtrl", 1);

        var ct = this;

        var productInstance = $scope.productInstance = {};
        productInstance.productInstances = [];

        var pop = $scope.pop = {}; // popup modal에서 사용 할 객체 선언
        pop.productInstance = [];

        /* DevOps 추가 */
        ct.addDevops = function($event) {
            var dialogOptions = {
                title : 'DevOps ' + $translate.instant("label.product_add"),
                form : {
                    name: "devopsForm",
                    options: "",
                },
                dialogClassName : "modal-lg",
                templateUrl: _COMM_ADMIN_VIEWS_ + "/product/popProductDevopsForm.html" + _VersionTail(),
                okName : $translate.instant("label.confirm")
            };
            pop.productInstance = [];
            pop.productInstance.timeFee = 0;
            pop.productInstance.monthFee = 0;

            common.showDialog($scope, $event, dialogOptions);

            // Dialog ok 버튼 클릭 시 액션 정의
            $scope.popDialogOk = function () {
                pop.addDevops();
            }
        };

        /* DevOps 상품관리 전체선택 */
        ct.checkedProducts = function (productName) {
            productInstance.productInstances.items.forEach(function (product) {
                product.checked = ct.devopsAllCheck;
            });
        };

        /* DevOps 상품관리 */
        ct.devopsProducts = function () {
            $scope.main.loadingMainBody = true;
            var param = {'service': 'DevOps'};
            var productPromise = productService.listProduct(param);
            productPromise.success(function (data) {
                productInstance.productInstances = data;
                $scope.main.loadingMainBody = false;
            });
            productPromise.error(function (data) {
                productInstance.productInstances = [];
                $scope.main.loadingMainBody = false;
            });
        };

        ct.devopsProducts();

        /* 상품관리 삭제 */
        ct.removeProducts = function ($event) {
            $scope.main.loadingMainBody = true;
            var removeData = [];
            var products = productInstance.productInstances.items;

            for (var i=0; i<products.length; i++) {
                if (products[i].checked) {
                    removeData.push(products[i]);
                }
            }

            if (removeData.length == 0) {
                //common.showAlert("","삭제할 상품이 없습니다.");
                common.showAlert("상품 삭제", $translate.instant("message.mi_dont_exist_checked"));//선택하신 건이 없습니다.
                $scope.main.loadingMainBody = false;
                return;
            }

            var productPromise = productService.removeProduct(removeData);
            productPromise.success(function (data, status, headers) {
                common.showAlert("", $translate.instant("message.mi_delete"));
                removeData = [];
                ct.devopsProducts();
            });
            productPromise.error(function (data, status, headers) {
                if (status == 406) {
                    common.showAlert("상품 삭제 오류", $translate.instant('message.mi_cant_delete_product_quota_current_using'));
                } else {
                    common.showAlert("상품 삭제 오류", data);
                }
                removeData = [];
            });
            $scope.main.loadingMainBody = false;
        };

        /* DevOps 상품 추가 */
        pop.addDevops = function () {
            var saveProduct = [];
            var unitCds = {"GIT" : "Repository", "CI" : "Pipeline", "IDE" : "Container"};
            for (var key in unitCds) {
                var product = {
                    'service' : 'DevOps'
                    , 'productName' : pop.productInstance.productName
                    , 'division' : key
                    , 'type' : unitCds[key]
                    , 'startUseSection' : 1
                    , 'endUseSection' : pop.productInstance[key] < 0 ? 0 : pop.productInstance[key]
                    , 'timeFee' : pop.productInstance.timeFee
                    , 'monthFee' : pop.productInstance.monthFee
                };
                saveProduct.push(product);
            }

            var productData = productInstance.productInstances.items;
            var productNames = [];
            var duplicateName = "";
            var isuplicate = false;
            angular.forEach(productData, function(product) {
                if (product.productName == pop.productInstance.productName) {
                    isuplicate = true;
                    return;
                }
            });

            if (isuplicate) {
                common.showAlert("상품 추가 오류", pop.productInstance.productName + '(은)는 이미 등록된 상품입니다.');
                saveProduct = [];
                return;
            }

            var productPromise = productService.saveProduct(saveProduct);
            productPromise.success(function (data) {
                common.showAlert("상품 추가", $translate.instant("message.mi_create_success"));
                saveProduct = [];
                ct.devopsProducts();
            });
            productPromise.error(function (data) {
                common.showAlert("상품 추가 오류", data);
                saveProduct = [];
            });

            $scope.main.loadingMainBody = false;
        };

        $scope.main.loadingMainBody = false;
    })
;