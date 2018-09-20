'use strict';

angular.module('app')
	.directive('onlyDigits', function ($filter) {
	    return {
	        restrict: 'A',
	        require: '?ngModel',
			scope: {
				maxField : "@"
			},
	        link: function (scope, element, attrs, modelCtrl) {
	            modelCtrl.$parsers.push(function (inputValue) {
	                if (inputValue == undefined) return '';
	                var transformedInput = inputValue.replace(/[^0-9]/g, '');
					transformedInput = transformedInput.substring(0,scope.maxField);
	                if (transformedInput !== inputValue) {
	                    modelCtrl.$setViewValue(transformedInput);
	                    modelCtrl.$render();
	                }
	                return transformedInput;
	            });
	        }
	    };
	})
	.directive('onlyDigitsPlus', function ($filter) {
	    return {
	        restrict: 'A',
	        require: '?ngModel',
			scope: {
				maxField : "@"
			},
	        link: function (scope, element, attrs, modelCtrl) {
	            modelCtrl.$parsers.push(function (inputValue) {
	                if (inputValue == undefined) return '';
	                var transformedInput = inputValue.replace(/[^0-9]/g, '');
					transformedInput = transformedInput.substring(0,scope.maxField);
					if(Number(transformedInput) < 1) transformedInput = '1';
	                if (transformedInput !== inputValue) {
	                    modelCtrl.$setViewValue(transformedInput);
	                    modelCtrl.$render();
	                }
	                return transformedInput;
	            });
	        }
	    };
	})
	.directive('nonHangeul', function ($filter) {
	    return {
	        restrict: 'A',
	        require: '?ngModel',
	        link: function (scope, element, attrs, modelCtrl) {
	            modelCtrl.$parsers.push(function (inputValue) {
	                if (inputValue == undefined) return '';
	                var transformedInput = inputValue.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
	                if (transformedInput !== inputValue) {
	                    modelCtrl.$setViewValue(transformedInput);
	                    modelCtrl.$render();
	                }
	                return transformedInput;
	            });
	        }
	    };
	})
	.directive('ipDivide', function () {
	    return {
	        restrict: 'A',
	        require: '?ngModel',
			scope: {
				divide : "@"
			},
	        link: function (scope, element, attrs, modelCtrl) {
	            modelCtrl.$parsers.push(function (inputValue) {
	                if (inputValue == undefined) return '';
					var ipArray = inputValue.split('.');
	                var transformedInput = ipArray[scope.divide];
	                if (transformedInput !== inputValue) {
	                    modelCtrl.$setViewValue(transformedInput);
	                    modelCtrl.$render();
	                }
	                return transformedInput;
	            });
	        }
	    };
	})
	.directive('readOnly', function () {
	    return {
	        restrict: 'A',
	        link: function (scope, element, attrs, modelCtrl) {
				$(element).css('pointer-events','none');
				$(element).css('background-color','#eee');
	        }
	    };
	})
	.directive('serverStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
	    return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var instance = scope.$parent.instance;
				var tenantId = scope.$parent.$parent.contents.data.tenantId;

				var recursive = function() {
					var param = {
		                instanceId : instance.id,
		                action : action,
		                tenantId : tenantId
		            }
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/instance', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
		                if (status == 200 && data) {
							var requestAction = $filter('lowercase')(action);
							var responseAction = $filter('lowercase')(data.content.instances[0].vmState);
							if(requestAction == responseAction || responseAction == "error") {
								instance.vmState = responseAction;
								instance.fixedIps = data.content.instances[0].fixedIps;
								instance.taskState = "";
								attrs.observeAction = "ready";
								if(responseAction == 'deleted') {
									instance.keypair = [];
									instance.fixedIps = [];
									instance.floatingIp = "";
								}
							}else {
								instance.taskState = data.content.instances[0].taskState;
								directiveWatch(scope);
							}
		                } else {
							instance.vmState = "error";
							attrs.observeAction = "ready";
		                }
		            });
		            returnPromise.error(function (data, status, headers) {
						instance.vmState = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){
						if(instance.vmState == 'building') {
							value="START";
							attrs.observeAction = "START";
						}

						if(instance.taskState == "deleting") {
							value="DELETE";
							attrs.observeAction = "DELETE";
						}

						if(value != "ready") {
							console.log('observeAction has changed ' + value);
							// if(value == "DELETE") {
							// 	$timeout(scope.$parent.$parent.contents.fnGetServerMainList,5000);
							// } else {
								if(value == 'STOP') {
									action = "stopped"
								}else if(value == 'PAUSE') {
									action = "paused"
								}else if(value == "START") {
									action = "active";
								}else if(value == "UNPAUSE") {
									action = "active";
								}else if(value == "DELETE") {
									action = "deleted";
								}else if(value == "REBOOT") {
									action = "active";
								}
								$timeout(recursive,5000);
							// }
						}
					});
				}

				directiveWatch(scope);

	        }
	    };
	})
	.directive('snapshotStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
		return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var snapshot = scope.$parent.snapshot;
				var tenantId = scope.$parent.$parent.contents.data.tenantId;
				var recursive = function() {
					console.log('run recursive');
					var param = {
						tenantId : tenantId,
		                snapShotId : snapshot.snapShotId
		            }
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/server/snapshot', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.image) {
							snapshot.status = data.content.image.status;
							if(snapshot.status == 'active' || snapshot.status == 'deleted') {
								snapshot.size = data.content.image.size/1024/1024/1024;
								attrs.observeAction = "ready";
							} else {
								directiveWatch(scope);
							}
						} else {
							snapshot.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						snapshot.status = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){

						if(snapshot.status == 'active' || snapshot.status == 'deleted') {
							value="ready";
						} else {
							value="unready";
						}
						if(value != "ready") {
							console.log('observeAction has changed ' + value);
							$timeout(recursive,10000,false);
						}
					});
				}
				directiveWatch(scope);
	        }
	    };
	})
	.directive('volumeStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
	    return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var volume = scope.$parent.volume;
				var tenantId = scope.$parent.$parent.contents.data.tenantId;

				var recursive = function() {
					console.log('run recursive');
					var param = {
		                volumeId : volume.volumeId,
		                tenantId : tenantId
		            }
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.volumes.length > 0) {
							volume.status = $filter('lowercase')(data.content.volumes[0].status);
							if(volume.status == 'available') {
								attrs.observeAction = "ready";
							} else {
								directiveWatch(scope);
							}
						} else {
							volume.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						volume.status = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){
						if(volume.status == 'creating') {
							value="CREATE";
						}

						if(volume.status == 'unrecognized') {
							value="UNRECOGNIZED";
						}

						if(volume.status == "deleting") {
							value="DELETE";
						}

						if(value != "ready") {
							console.log('observeAction has changed ' + value);
								$timeout(recursive,5000);
							// }
						}
					});
				}

				directiveWatch(scope);

	        }
	    };
	})
	.directive('volumeSnapshotStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
		return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var snapshot = scope.$parent.snapshot;
				var tenantId = scope.$parent.$parent.contents.data.tenantId;
				var recursive = function() {
					console.log('run recursive');
					var param = {
						tenantId : tenantId,
		                snapshotId : snapshot.snapshotId
		            }
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/storage/volume/snapshot', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.volumeSnapShot) {
							snapshot.status = data.content.volumeSnapShot.status;
							if(snapshot.status == 'available' || snapshot.status == 'deleted') {
								snapshot.size = data.content.volumeSnapShot.size;
								attrs.observeAction = "ready";
							} else {
								directiveWatch(scope);
							}
						} else {
							snapshot.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						snapshot.status = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){

						if(snapshot.status == 'available' || snapshot.status == 'deleted') {
							value="ready";
						} else {
							value="unready";
						}

						if(value != "ready") {
							console.log('observeAction has changed ' + value);
							$timeout(recursive,10000,false);
						}
					});
				}
				directiveWatch(scope);
	        }
	    };
	})
	.directive('imageStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
	    return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var image = scope.$parent.image;

				var recursive = function() {
					console.log('run recursive');
					var param = {
		                queryType : 'all'
		            };
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/admin/image', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.images.length > 0) {
							image.status = $filter('lowercase')(data.content.images[0].status);
							image.minDisk = data.content.images[0].minDisk;
							image.minRam = data.content.images[0].minRam;
							image.size = data.content.images[0].size;
							image.type = data.content.images[0].type;
							if(image.status == 'active') {
								attrs.observeAction = "ready";
							} else {
								directiveWatch(scope);
							}
						} else {
							image.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						image.status = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){
						if(image.status == 'queued') {
							value="queued";
						}

						if(image.status == "saving") {
							value="saving";
						}

						if(image.status == "deleting") {
							value="DELETE";
						}

						if(value != "ready") {
							console.log('observeAction has changed ' + value);
								$timeout(recursive,5000);
						}
					});
				}

				directiveWatch(scope);

	        }
	    };
	})
	.directive('interfacerStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
	    return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var interfacer = scope.$parent.interfacer;
				var router = scope.$parent.$parent.contents.router;

				var recursive = function() {
					console.log('run recursive');
					var param = {
		                routerId : router.id
		            };
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/network/router/interface', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.routerPorts.length > 0) {
							for(var i=0; i < data.content.routerPorts.length; i++) {
								if(data.content.routerPorts[i].id == interfacer.id) {
									interfacer.status = data.content.routerPorts[i].status;
									if(interfacer.status == 'active') {
										attrs.observeAction = "ready";
									} else {
										directiveWatch(scope);
									}
								}
							}
						} else {
							interfacer.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						interfacer.status = "error";
						attrs.observeAction = "ready";
		            });
				}
				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){
						if(interfacer.status == 'DOWN') {
							value="DOWN";
						}

						if(value != "ready") {
							console.log('observeAction has changed ' + value);
								$timeout(recursive,5000);
						}
					});
				}

				directiveWatch(scope);

	        }
	    };
	})
	.directive('lbServiceStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
	    return {
	        restrict: 'A',
			scope: {
				observeAction : "="
			},
	        link: function (scope, element, attrs, modelCtrl) {
				var action = "";
				var lb = scope.$parent.lb;
				var tenantId = scope.$parent.$parent.contents.data.tenantId;
				var recursive = function() {
					console.log('run recursive');
					var param = {
		                nsId : lb.nsId,
		                tenantId : tenantId
		            }
		            var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/lb/lbService', 'GET', param, 'application/x-www-form-urlencoded');
		            returnPromise.success(function (data, status, headers) {
						if(data.content.lbNetworkService) {
							lb.status = data.content.lbNetworkService.status;
							if(lb.status == 'DOWN' || lb.status == 'UP' || lb.status == 'SHUTOFF') {
								attrs.observeAction = "ready";
							} else {
								directiveWatch(scope);
							}
						} else {
							lb.status = "error";
							attrs.observeAction = "ready";
						}
		            });
		            returnPromise.error(function (data, status, headers) {
						lb.status = "error";
						attrs.observeAction = "ready";
		            });
				}

				var directiveWatch = function(scope) {
					scope.$watch('observeAction',function(value){

						if(lb.status == 'VM_STARTING') {
							value="VM_STARTING";
						}

						if(lb.status == 'VM_DELETING') {
							value="VM_DELETING";
						}

						if(lb.status == 'READY') {
							value="ready for start";
						}

						if(lb.status == "NF_STARTING") {
							value="NF_STARTING";
						}
						if(value != "ready") {
							console.log('observeAction has changed ' + value);
							$timeout(recursive,10000,false);
						}
					});
				}
				directiveWatch(scope);
	        }
	    };
	})
    .directive('vrouterServiceStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
        return {
            restrict: 'A',
            scope: {
                observeAction : "="
            },
            link: function (scope, element, attrs, modelCtrl) {
                var action = "";
                var vrouter = scope.$parent.vrouter;
                var tenantId = scope.$parent.$parent.contents.data.tenantId;
                var recursive = function() {
                   // alert('run recursive');
                    console.log('run recursive');
                    var param = {
                        nsId : vrouter.nsid,
                        tenantId : tenantId
                    }
                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vrouter/vRouterServiceStatus', 'GET', param, 'application/x-www-form-urlencoded');
                    returnPromise.success(function (data, status, headers) {
                        if(data.content.vRouterInfo) {
                            vrouter.status = data.content.vRouterInfo.status;
                            if(vrouter.status == 'DOWN' || vrouter.status == 'UP' || vrouter.status == 'DELETED') {
                                attrs.observeAction = "ready";
                            } else {
                                directiveWatch(scope);
                            }
                        } else {
                            vrouter.status = "error";
                            attrs.observeAction = "ready";
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                        vrouter.status = "error";
                        attrs.observeAction = "ready";
                    });
                }

                var directiveWatch = function(scope) {
                    scope.$watch('observeAction',function(value){
						//alert(vrouter.status);
                        if(vrouter.status == 'VM_STARTING') {
                            value="VM_STARTING";
                        }

                        if(vrouter.status == 'VM_DELETING') {
                            value="VM_DELETING";
                        }

                        if(vrouter.status == 'VM_START_FAILED') {
                            value="VM_START_FAILED";
                        }

                        if(vrouter.status == 'READY') {
                            value="ready for start";
                        }

                        if(vrouter.status == "NF_STARTING") {
                            value="NF_STARTING";
                        }
                        if(value != "ready") {
                            console.log('observeAction has changed ' + value);
                            $timeout(recursive,10000,false);
                        }
                    });
                }
                directiveWatch(scope);
            }
        };
    })
    .directive('vpnServiceStatusObserve', function (common,CONSTANTS,$filter,$timeout) {
    	//alert("directive");
        return {
            restrict: 'A',
            scope: {

                statusAction : "="
            },
            link: function (scope, element, attrs, modelCtrl) {
                var action = "";

                var recursive = function() {

                    var tenantId=scope.$parent.contents.data.tenantId;
                    var pvpn=scope.$parent.contents.vpn;
                    if (pvpn.status == 'DOWN' || pvpn.status == 'UP')
					{
                        console.log('run recursive ===========>Stop');
                        return;
					}
                    console.log('run recursive'+tenantId);
                    var param = {
                        tenantId : tenantId
                    }


                    var returnPromise = common.resourcePromise(CONSTANTS.iaasApiContextUrl + '/nfv/vpn/VpnServiceStatus', 'GET', param, 'application/x-www-form-urlencoded');
                    returnPromise.success(function (data, status, headers) {
                        //console.log('data  check'+data.content.vpninfo);
                        if(data.content.vpninfo) {
                            scope.$parent.contents.vpn.status=data.content.vpninfo.status;
                            var pvpn=scope.$parent.contents.vpn;
                            //console.log('run recursive ===========>'+pvpn.psk);
                            //pvpn.status = data.content.vpninfo.status;


                            //attrs.statusAction =vpn.status;
                            if(pvpn.status == 'DOWN' || pvpn.status == 'UP' || pvpn.status == 'DELETED') {

                                console.log('run recursive ===========>END');
                                if (scope.$parent.contents.reccovery=="Y")
								{
                                    scope.$parent.contents.fn.getVpnInfo();
                                    scope.$parent.contents.reccovery="N";
								}

                            } else {
                                sleepCustom(500);
                                directiveWatch(scope);
                        	}
                        } else {
                            scope.$parent.contents.vpn.status= "error";
                           // attrs.statusAction = "ready";
                        }
                    });
                    returnPromise.error(function (data, status, headers) {
                       // scope.$parent.contents.vpn.status= "ready";
                    });
                }





                var directiveWatch = function(scope) {

                    scope.$watch('statusAction', function(value){


						console.log('statusAction has changed ' + value);

                        //
						$timeout(recursive, 10000, true);

                    });
                }
                var sleepCustom=function (delay) {
                    var start = new Date().getTime();
                    while (new Date().getTime() < start + delay);
                }
                directiveWatch(scope);
            }
        };
    })
	.directive('fileModel', function($parse) {
		return {
	        restrict: 'A',
	        link: function(scope, element, attrs) {
	            var model = $parse(attrs.fileModel);
	            var modelSetter = model.assign;
	            element.bind('change', function(){
	                scope.$apply(function(){
	                    modelSetter(scope, element[0].files[0]);
	                });
	            });
	        }
	    };
	})
	.directive('slider', ['$parse', '$timeout', '$rootScope', function ($parse, $timeout, $rootScope) {
        return {
            restrict: 'AE',
            replace: true,
            template: '<div><input class="slider-input" type="text" style="width:100%" /></div>',
            require: 'ngModel',
            scope: {
                max: "=",
                min: "=",
                step: "=",
                value: "=",
                ngModel: '=',
                ngDisabled: '=',
                range: '=',
                sliderid: '=',
                ticks: '=',
                ticksLabels: '=',
                ticksSnapBounds: '=',
                ticksPositions: '=',
                ticksTooltip: "=",
                scale: '=',
                focus: '=',
                rangeHighlights: '=',
                formatter: '&',
                onStartSlide: '&',
                onStopSlide: '&',
                onSlide: '&'
            },
            link: function ($scope, element, attrs, ngModelCtrl, $compile) {
            	var ngModelDeregisterFn, ngDisabledDeregisterFn;

                var slider = initSlider();

                function initSlider() {
                    var options = {};

                    function setOption(key, value, defaultValue) {
                        options[key] = value || defaultValue;
                    }

                    function setFloatOption(key, value, defaultValue) {
                        options[key] = value || value === 0 ? parseFloat(value) : defaultValue;
                    }

                    function setBooleanOption(key, value, defaultValue) {
                        options[key] = value ? value + '' === 'true' : defaultValue;
                    }

                    function getArrayOrValue(value) {
                        return (angular.isString(value) && value.indexOf("[") === 0) ? angular.fromJson(value) : value;
                    }

                    setOption('id', $scope.sliderid);
                    setOption('orientation', attrs.orientation, 'horizontal');
                    setOption('selection', attrs.selection, 'before');
                    setOption('handle', attrs.handle, 'round');
                    setOption('tooltip', attrs.sliderTooltip || attrs.tooltip, 'show');
                    setOption('tooltip_position', attrs.sliderTooltipPosition, 'top');
                    setOption('tooltipseparator', attrs.tooltipseparator, ':');
                    setOption('ticks', $scope.ticks);
                    setOption('ticks_labels', $scope.ticksLabels);
                    setOption('ticks_snap_bounds', $scope.ticksSnapBounds);
                    setOption('ticks_positions', $scope.ticksPositions);
                    setOption('ticks_tooltip', $scope.ticksTooltip, false);
                    setOption('rangeHighlights', $scope.rangeHighlights);
                    setOption('scale', $scope.scale, 'linear');
                    setOption('focus', $scope.focus);

                    setFloatOption('min', $scope.min, 0);
                    setFloatOption('max', $scope.max, 10);
                    setFloatOption('step', $scope.step, 1);
                    var strNbr = options.step + '';
                    var dotPos = strNbr.search(/[^.,]*$/);
                    var decimals = strNbr.substring(dotPos);
                    setFloatOption('precision', attrs.precision, decimals.length);

                    setBooleanOption('tooltip_split', attrs.tooltipsplit, false);
                    setBooleanOption('enabled', attrs.enabled, true);
                    setBooleanOption('naturalarrowkeys', attrs.naturalarrowkeys, false);
                    setBooleanOption('reversed', attrs.reversed, false);

                    setBooleanOption('range', $scope.range, false);
                    if (options.range) {
                        if (angular.isArray($scope.value)) {
                            options.value = $scope.value;
                        }
                        else if (angular.isString($scope.value)) {
                            options.value = getArrayOrValue($scope.value);
                            if (!angular.isArray(options.value)) {
                                var value = parseFloat($scope.value);
                                if (isNaN(value)) value = 5;

                                if (value < $scope.min) {
                                    value = $scope.min;
                                    options.value = [value, options.max];
                                }
                                else if (value > $scope.max) {
                                    value = $scope.max;
                                    options.value = [options.min, value];
                                }
                                else {
                                    options.value = [options.min, options.max];
                                }
                            }
                        }
                        else {
                            options.value = [options.min, options.max]; // This is needed, because of value defined at $.fn.slider.defaults - default value 5 prevents creating range slider
                        }
                        $scope.ngModel = options.value; // needed, otherwise turns value into [null, ##]
                    }
                    else {
                        setFloatOption('value', $scope.value, 5);
                    }

                    if (attrs.formatter) {
                        options.formatter = function(value) {
                            return $scope.formatter({value: value});
                        }
                    }

                    // check if slider jQuery plugin exists
                    if (typeof window.$ !== 'undefined' && typeof $.fn === 'object' && $.fn.slider) {
                        // adding methods to jQuery slider plugin prototype
                        $.fn.slider.constructor.prototype.disable = function () {
                            this.picker.off();
                        };
                        $.fn.slider.constructor.prototype.enable = function () {
                            this.picker.on();
                        };
                    }

                    // destroy previous slider to reset all options
                    if (element[0].__slider)
                        element[0].__slider.destroy();

                    var slider = new Slider(element[0].getElementsByClassName('slider-input')[0], options);
                    element[0].__slider = slider;

                    // everything that needs slider element
                    var updateEvent = getArrayOrValue(attrs.updateevent);
                    if (angular.isString(updateEvent)) {
                        // if only single event name in string
                        updateEvent = [updateEvent];
                    }
                    else {
                        // default to slide event
                        updateEvent = ['slide'];
                    }
                    angular.forEach(updateEvent, function (sliderEvent) {
                        slider.on(sliderEvent, function (ev) {
                            ngModelCtrl.$setViewValue(ev);
                        });
                    });
                    slider.on('change', function (ev) {
                        ngModelCtrl.$setViewValue(ev.newValue);
                    });


                    // Event listeners
                    var sliderEvents = {
                        slideStart: 'onStartSlide',
                        slide: 'onSlide',
                        slideStop: 'onStopSlide'
                    };
                    angular.forEach(sliderEvents, function (sliderEventAttr, sliderEvent) {
                        var fn = $parse(attrs[sliderEventAttr]);
                        slider.on(sliderEvent, function (ev) {
                            if ($scope[sliderEventAttr]) {
                                $scope.$apply(function () {
                                    fn($scope.$parent, { $event: ev, value: ev });
                                });
                            }
                        });
                    });

                    // deregister ngDisabled watcher to prevent memory leaks
                    if (angular.isFunction(ngDisabledDeregisterFn)) {
                        ngDisabledDeregisterFn();
                        ngDisabledDeregisterFn = null;
                    }

                    ngDisabledDeregisterFn = $scope.$watch('ngDisabled', function (value) {
                        if (value) {
                            slider.disable();
                        }
                        else {
                            slider.enable();
                        }
                    });

                    // deregister ngModel watcher to prevent memory leaks
                    if (angular.isFunction(ngModelDeregisterFn)) ngModelDeregisterFn();
                    ngModelDeregisterFn = $scope.$watch('ngModel', function (value) {
                        if($scope.range){
                            slider.setValue(value);
                        }else{
                            slider.setValue(parseFloat(value));
                        }
                        slider.relayout();
                    }, true);

                    return slider;
                }


                var watchers = ['min', 'max', 'step', 'range', 'scale', 'ticksLabels', 'ticks', 'rangeHighlights'];
                angular.forEach(watchers, function (prop) {
                    $scope.$watch(prop, function () {
                        slider = initSlider();
                    });
                });

                var globalEvents = ['relayout', 'refresh', 'resize'];
                angular.forEach(globalEvents, function(event) {
                    if(angular.isFunction(slider[event])) {
                        $scope.$on('slider:' + event, function () {
                            slider[event]();
                        });
                    }
                });
            }
        };
    }])
;
