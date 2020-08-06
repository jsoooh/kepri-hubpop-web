'use strict';

angular.module('app')
// text를 angujerjs로 컴파일 하여 적용
    .directive('dynamicTemplate', function ($compile) {
        return {
            restrict: 'EA',
            replace: true,
            link: function (scope, element, attrs) {
                scope.$watch(
                    function (scope) {
                        return scope.$eval(attrs.dynamicTemplate);
                    },
                    function (value) {
                        element.html(value);
                        $compile(element.contents())(scope);
                    });
            }
        }
    })
    // progress-bar
    .directive('loadingProgressBar', ['$timeout', function ($timeout) {
        var templateHtml = '<div class="progress-striped progress">\n'
            + '<div class="progress-bar" role="progressbar">\n'
            + '<span max="{{ max }}" count-to="{{ bar }}" count-from="{{ from }}" duration="{{ duration }}" filter="number"></span><span ng-transclude></span>\n'
            + '</div>\n</div>\n';
        return {
            restrict: 'EA',
            template: templateHtml,
            scope: {
                max : "@",
                bar : "@",
                top : "@",
                down : "@",
                from : "@",
                duration : "@"
            },
            replace: false,
            transclude: true,
            link: function (scope, element, attrs){
                var max = parseInt(attrs.max, 10);
                var top = parseInt(attrs.top, 10);
                var down = parseInt(attrs.down, 10);
                var bar = parseInt(attrs.bar, 10);

                var progressbarLoading = function (progressbar, level)	{
                    if(level == 3) {
                        progressbar.addClass("progress-bar-high");
                    } else if(level == 2) {
                        progressbar.addClass("progress-bar-middle");
                    } else {
                        progressbar.addClass("progress-bar-low");
                    }
                };
                var start = function () {
                    var percent = 0;
                    if (max < 0) {
                        max = 0;
                    }
                    if (bar < 0) {
                        bar = 0;
                    }
                    if (max > 0 && bar > 0) {
                        percent = parseInt(bar * 100 / max, 10);
                        if (percent > 100) percent = 100;
                    }
                    scope.percent = percent;
                    var level = 1;
                    if (bar > top) {
                        level = 3;
                    } else if (bar > down) {
                        level = 2
                    }
                    $(document).ready(function () {
                        var progressbar = element.find(".progress-bar");
                        progressbar.css("width", percent + "%");
                        progressbar.removeClass("progress-bar-high");
                        progressbar.removeClass("progress-bar-middle");
                        progressbar.removeClass("progress-bar-low");
                        $timeout(function () {
                            progressbarLoading(progressbar, level);
                        }, 400);
                    });
                };

                var timoutId;
                var timeoutStart = function (time) {
                    if (timoutId) $timeout.cancel(timoutId);
                    timoutId = $timeout(function () {
                        start();
                    }, time)
                };

                attrs.$observe('bar', function (val) {
                    bar = parseInt(val, 10);
                    timeoutStart(200);
                });
                attrs.$observe('max', function (val) {
                    max = parseInt(val, 10);
                    timeoutStart(200);
                });
                attrs.$observe('top', function (val) {
                    top = parseInt(val, 10);
                    timeoutStart(200);
                });
                attrs.$observe('down', function (val) {
                    down = parseInt(val, 10);
                    timeoutStart(200);
                });
            }
        }
    }
    ])
    // progress-bar
    .directive('uiSelectTwo', [
        '$timeout', '$compile',
        function ($timeout, $compile) {

            return {
                restrict: 'EA',
                scope: {
                    placeholder: "@",
                    allowClear: "@",
                    noSearch: "@"
                },
                replace: true,
                link: function (scope, element, attrs){
                    var start = function () {
                        var options = {
                            placeholder : attrs.placeholder,
                            allowClear : attrs.allowClear,
                            templateResult: function (state, container) {
                                var option = $(state.element);
                                var optionHtml = option.attr("option-html");
                                if (!state.id || !optionHtml) {
                                    return state.text;
                                }
                                optionHtml = optionHtml.replace(new RegExp("{value}", "gim"), state.id);
                                optionHtml = optionHtml.replace(new RegExp("{text}", "gim"), state.text);
                                return $(optionHtml);
                            }
                        };
                        if (attrs && (attrs.noSearch == true || attrs.noSearch == "true")) {
                            options.minimumResultsForSearch = Infinity;
                        }
                        $(element).select2(options);
                    };
                    start();
                }
            }
        }
    ])
    .directive('stopWatchProgressBar', function($timeout) {
        return {
            restrict : 'EA',
            template : "<div class='progress'><div class='progress-bar' role='progressbar'>{{current}} / {{max}}</div></div>",
            replace : true,
            scope: {
                max: '@',
                start: '@',
                onStop: '&',
                delay : '@'
            },
            controller : ['$scope', '$timeout', function($scope, $timeout) {
                $scope.stop = function() {
                    $timeout.cancel($scope.mytimeout);
                }
            }],

            link : function (scope, element, attrs) {
                scope.onTimeout = function() {
                    scope.startAt++;
                    scope.current = scope.startAt;
                    scope.percent = Number(100 * scope.current / parseInt(scope.max, 10));
                    if(scope.startAt >= scope.max) {
                        scope.stop();
                        scope.onStop();
                    } else {
                        scope.mytimeout = $timeout(scope.onTimeout,1000);
                    }
                    $(document).ready(function () {
                        var progressbar = element.find(".progress-bar");
                        progressbar.css("width", scope.percent + "%");
                    });
                };

                attrs.$observe('start', function(value) {
                    scope.delay = scope.delay ? scope.delay : 1;
                    if(value === 'true') {
                        scope.startAt = -scope.delay;
                        scope.mytimeout = $timeout(scope.onTimeout,1000);
                    }else if(value ==='false') {
                        scope.stop();
                    }
                });
            }
        }
    })
    .controller('d3CircularProgressCtrl', function($scope) {
        var vm = this;
        vm.τ = 2 * Math.PI;
        vm.width = 200;
        vm.height = 200;
        vm.font = 1;
        vm.rad = (vm.width / 2) - 10;
        vm.offset = vm.rad * 0.02;

        vm.arc = function(radius) {
            return d3.svg.arc().outerRadius(radius).innerRadius(radius).startAngle(0);
        };

        vm.line = function(color, width, d) {
            return vm.svg.append('path').datum({
                endAngle: 0
            }).style('stroke', color).style('stroke-width', width).attr('d', d).attr('stroke-linejoin', 'round');
        };

        vm.getColor = function(value) {
            return "#184eda";
            if (value > 0.8) {
                return '#ff0000';
            } else if (value > 0.50) {
                return '#F7640A';
            } else {
                return '#78c000';
            }
        };

        vm.getFontSize = function(value) {
            var length;
            length = (Number(value) || 0).toFixed(0).length;
            if (length >= 7) {
                return (1.7*vm.font)+'em';
            } else if (length >= 6) {
                return (2*vm.font)+'em';
            } else if (length >= 4) {
                return (2.5*vm.font)+'em';
            } else {
                return (3*vm.font)+'em';
            }
        };

        vm.createTween = function(arc) {
            return function(transition, newAngle) {
                return transition.attrTween('d', function(d) {
                    var interpolate;
                    interpolate = d3.interpolate(d.endAngle, newAngle);
                    return function(t) {
                        d.endAngle = interpolate(t);
                        return arc(d);
                    };
                });
            };
        };

        vm.clear = function(element) {
            element[0].innerHTML = "";
        };
        
        var type;
        if (vm.options.type == 'seconds') {
        	type = 's';
        } else {
        	type = '%';
        }
        
        vm.render = function(element) {
            var circle, line1, line2;
            this.svg = d3.select(element[0]).append('svg').attr('width', vm.width).attr('height', vm.height).append('g').attr('transform', 'translate(' + vm.width / 2 + ',' + vm.height / 2 + ')');
            circle = vm.svg.append('circle').attr('r', vm.rad + 4).attr('fill', '#f5f5f5');
            circle = vm.svg.append('circle').attr('r', vm.rad - vm.offset * 2).attr('fill', '#fff');
            vm.outerArc = vm.arc(vm.rad);
            vm.innerArc = vm.arc(vm.rad - (vm.offset + 8));
            vm.outer = vm.line(vm.options.actualColor, '8px', vm.outerArc);
            vm.inner = vm.line(vm.options.expectedColor, '4px', vm.innerArc);
            line1 = vm.svg.append('text').style("text-anchor", "middle");
            vm.number = line1.append('tspan').style('font-size', vm.getFontSize(0)).style('fill', '#444').text('0');
            line1.append('tspan').style('font-size', (1.5*vm.font)+'em').text(type);
            return line2 = vm.svg.append('text').attr('dy', '10%').style("text-anchor", "middle").style('font-size', vm.font+'em').style('fill', '#888').text(vm.options.bottomText);
        };

        vm.update = function() {
            var actual, actualPercentage, expected;
            actual = [0, parseFloat(vm.actual) || 0, 1].sort()[1];
            expected = [0, parseFloat(vm.expected) || 0, 1].sort()[1];
            actualPercentage = (parseFloat(vm.actual) || 0) * 100;
            vm.outer.transition().duration(1000).style('stroke', vm.getColor(actual)).call(vm.createTween(vm.outerArc), actual * vm.τ);
            vm.inner.transition().duration(1000).call(vm.createTween(vm.innerArc), expected * vm.τ);
            return vm.number.text(actualPercentage.toFixed(0)).style('font-size', vm.getFontSize(actualPercentage));
        };

        return vm;

    })
    .directive('d3CircularProgress', function($timeout) {
        return {
            scope: {},
            bindToController: {
                size: '=',
                actual: '=',
                expected: '=',
                options: '='
            },
            controller: 'd3CircularProgressCtrl as ctrl',
            link: function(scope, element, attrs, ctrl) {
                function sizeSetting() {
                    ctrl.width = (ctrl.size ? ctrl.size : 200);
                    ctrl.height = (ctrl.size ? ctrl.size : 200);
                    if (angular.isUndefined(ctrl.options)) ctrl.options = {};
                    ctrl.options.actualColor = (ctrl.options.actualColor ? ctrl.options.actualColor : '#17a0ce');
                    ctrl.options.expectedColor = (ctrl.options.expectedColor ? ctrl.options.expectedColor : '#c7e596');
                    ctrl.options.bottomText = (ctrl.options.bottomText ? ctrl.options.bottomText : 'Progress');
                    ctrl.options.type = (ctrl.options.type ? ctrl.options.type : 'percent');
                    ctrl.font = ctrl.width/200;
                    ctrl.rad = (ctrl.width/2) - 10;
                    ctrl.offset = ctrl.rad * 0.02;
                    ctrl.clear(element);
                    ctrl.render(element);
                    ctrl.update();
                }
                sizeSetting();
                scope.$watch('ctrl.actual', function() {
                    return ctrl.update();
                });
                scope.$watch('ctrl.expected', function() {
                    return ctrl.update();
                });
                scope.$watch('ctrl.options', function() {
                    sizeSetting();
                });
                scope.$watch('ctrl.size', function() {
                    sizeSetting();
                });
            }
        };
    })
    .directive('stopWatchD3CircularProgress', function($timeout) {
        return {
            restrict : 'EA',
            scope: {
                max: '=',
                start: '@',
                onStop: '&',
                delay : '@',
                size : '=',
                options: '='
            },
            template : "<div d3-circular-progress data-actual='percent' data-expected='percent' data-size='size' data-options='options' class='progress-indicator'></div>",
            replace : false,
            controller : ['$scope', '$timeout', function($scope, $timeout) {
                $scope.onTimeout = function() {
                    $scope.startAt++;
                    $scope.current = $scope.startAt;
                    $scope.percent = Number($scope.current / parseInt($scope.max, 10));
                    if($scope.startAt >= $scope.max) {
                        $scope.stop();
                        $scope.onStop();
                    } else {
                        $scope.mytimeout = $timeout($scope.onTimeout,1000);
                    }
                };

                $scope.stop = function() {
                    $timeout.cancel($scope.mytimeout);
                }
            }],
            link : function (scope, elem, attrs, ctrl) {
                attrs.$observe('start', function(value) {
                    scope.delay = scope.delay ? scope.delay : 0;
                    if (value === 'true') {
                        scope.startAt = scope.delay;
                        scope.mytimeout = $timeout(scope.onTimeout,1000);
                    } else if(value ==='false') {
                        scope.stop();
                    }
                });
            }
        }
    })
    .directive('percentProgressBar', ['$timeout', function ($timeout) {
        var templateHtml = '<div class="progress">\n'
            + '<div class="progress-bar" style="width: 0%; background-color: #86e01e;"></div>\n'
            + '</div>\n';
        return {
            restrict: 'EA',
            template: templateHtml,
            scope: {
                percent : "@"
            },
            replace: false,
            transclude: true,
            link: function (scope, element, attrs){
                var percent = parseInt(attrs.percent, 10);
                var bgColor = "#86e01e";
                var start = function () {
                    if (percent > 75) {
                        bgColor = "#f63a0f";
                    } else if (percent > 50) {
                        bgColor = "#f27011";
                    } else if (percent > 25) {
                        bgColor = "#f2b01e";
                    } else if (percent > 5) {
                        bgColor = "#f2d31b";
                    } else {
                        bgColor = "#86e01e";
                    }
                    $(document).ready(function () {
                        var progressbar = element.find(".progress-bar");
                        progressbar.css("width", percent + "%");
                        progressbar.css("backgroundColor", bgColor);
                    });
                };

                var timoutId;
                var timeoutStart = function (time) {
                    if (timoutId) $timeout.cancel(timoutId);
                    timoutId = $timeout(function () {
                        start();
                    }, time)
                };
                attrs.$observe('percent', function (val) {
                    percent = parseInt(val, 10);
                    timeoutStart(200);
                });
            }
        }
    }])
    .directive('percentProgressBarAnimate', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            template: '',
            scope: {
                barType : "=",
                percent : "@"
            },
            replace: false,
            transclude: false,
            link: function (scope, element, attrs){
            	var percent = parseInt(scope.percent, 10);
                var barType = attrs.barType;
                if (!barType) {
                    barType = "width";
                }
                var start = function () {
                    $(document).ready(function () {
                        var progressbar = element.find(".progress-bar");
                        progressbar.css(barType, percent + "%");
                    });
                };

                var timoutId;
                var timeoutStart = function (time) {
                    if (timoutId) $timeout.cancel(timoutId);
                    timoutId = $timeout(function () {
                        start();
                    }, time)
                };
                attrs.$observe('percent', function (val) {
                    percent = parseInt(val, 10);
                    timeoutStart(200);
                });
            }
        }
    }])
    .directive('angRoundProgress', ['$timeout', function ($timeout) {
        var compilationFunction = function (templateElement, templateAttributes, transclude) {
            if (templateElement.length === 1) {
                var node = templateElement[0];

                var width = node.getAttribute('data-round-progress-width') || '300';
                var height = node.getAttribute('data-round-progress-height') || '300';

                var outerCircleWidth = node.getAttribute('data-round-progress-outer-circle-width') || '40';
                var outerCircleBackgroundColor = node.getAttribute('data-round-progress-outer-circle-background-color') || '#505769';
                var outerCircleForegroundColor = node.getAttribute('data-round-progress-outer-circle-foreground-color') || '#12eeb9';
                var outerCircleRadius = node.getAttribute('data-round-progress-outer-circle-radius') || '100';

                var labelColor = node.getAttribute('data-round-progress-label-color') || '#12eeb9';
                var labelFont = node.getAttribute('data-round-progress-label-font') || 'Calibri';
                var labelFontSize = node.getAttribute('data-round-progress-label-font-size') || '26pt';

                var innerCircleWidth = node.getAttribute('data-round-progress-inner-circle-width') || '';
                var innerCircleColor = node.getAttribute('data-round-progress-inner-circle-color') || '';
                var innerCircleRadius = node.getAttribute('data-round-progress-inner-circle-radius') || '';

                var roundDiv = document.createElement('div');
                roundDiv.setAttribute("style", "display: inline-block; position: relative; width: " + width + "px; height: " + height + "px;");

                var percentageLabel = document.createElement('span');
                percentageLabel.setAttribute("style",
                    "position: absolute;" +
                    " top: 0;" +
                    " left: 0;" +
                    " bottom: 0;" +
                    " right: 0;" +
                    " text-align: center;" +
                    " width: " + width + "px;" +
                    " height: " + height + "px;" +
                    " line-height: " + height + "px;" +
                    " font-family: " + labelFont + ";" +
                    " font-size: " + labelFontSize + ";" +
                    " color: " + labelColor + ";");

                roundDiv.appendChild(percentageLabel);

                var canvas = document.createElement('canvas');
                canvas.setAttribute('width', width);
                canvas.setAttribute('height', height);
                canvas.setAttribute('data-round-progress-model', node.getAttribute('data-round-progress-model'));

                roundDiv.appendChild(canvas);

                node.parentNode.replaceChild(roundDiv, node);

                return {
                    pre: function preLink(scope, instanceElement, instanceAttributes, controller) {
                    },
                    post: function postLink(scope, instanceElement, instanceAttributes, controller) {
                        var expression = canvas.getAttribute('data-round-progress-model');
                        scope.$watch(expression, function (newValue, oldValue) {
                            // Create the content of the canvas
                            var percentage = oldValue.percentage ? parseInt(oldValue.percentage, 10) : 0;
                            var endPercentage = newValue.percentage ? parseInt(newValue.percentage, 10) : 0;
                            if (percentage == endPercentage) {
                                percentage = 0;
                            }

                            var ctx = canvas.getContext('2d');
                            ctx.clearRect(0, 0, width, height);

                            // The "background" circle
                            var x = width / 2;
                            var y = height / 2;
                            ctx.beginPath();
                            ctx.arc(x, y, parseInt(outerCircleRadius, 10), 0, Math.PI * 2, false);
                            ctx.lineWidth = parseInt(outerCircleWidth, 10);
                            ctx.strokeStyle = outerCircleBackgroundColor;
                            ctx.stroke();

                            if (innerCircleWidth != "") {
                                // The inner circle
                                ctx.beginPath();
                                ctx.arc(x, y, parseInt(innerCircleRadius, 10), 0, Math.PI * 2, false);
                                ctx.lineWidth = parseInt(innerCircleWidth, 10);
                                ctx.strokeStyle = innerCircleColor;
                                ctx.stroke();
                            }

                            // The inner number
                            /*
                                                        ctx.font = labelFont;
                                                        ctx.textAlign = 'center';
                                                        ctx.textBaseline = 'middle';
                                                        ctx.fillStyle = labelColor;
                            */

                            var tick = function (vpercentage) {
                                //ctx.clearRect(x - 40, y - 40, 80, 80);
                                //ctx.fillText(vpercentage + "%", x, y);
                                percentageLabel.innerHTML = newValue.label.replace('{percentage}', vpercentage);

                                var startAngle = - (Math.PI / 2);
                                var endAngle = ((Math.PI * 2 ) * (vpercentage/100)) - (Math.PI / 2);
                                var anticlockwise = false;
                                ctx.beginPath();
                                ctx.arc(x, y, parseInt(outerCircleRadius, 10), startAngle, endAngle, anticlockwise);
                                ctx.lineWidth = parseInt(outerCircleWidth, 10);
                                ctx.strokeStyle = outerCircleForegroundColor;
                                ctx.stroke();
                            };

                            var timeTick = function () {
                                percentage += parseInt(((endPercentage - percentage)*10/endPercentage), 10) + 1;
                                if (percentage >= endPercentage) {
                                    percentage = endPercentage;
                                }
                                tick(percentage);
                                if (percentage < endPercentage) {
                                    $timeout(function () {
                                        timeTick();
                                    }, 20);
                                }

                            };
                            $timeout(function () {
                                if (endPercentage == 0) {
                                    tick(endPercentage);
                                } else {
                                    timeTick();
                                }
                            }, 200)
                        }, true);
                    }
                };
            }
        };

        return {
            restrict: 'EA',
            replace: true,
            compile: compilationFunction
        };
    }])
    // 이미지 작게 미리보기
    .directive('ngThumb', ['$window', function($window) {
        var helper = {
            support: !!($window.FileReader && $window.CanvasRenderingContext2D),
            isFile: function(item) {
                return angular.isObject(item) && item instanceof $window.File;
            },
            isImage: function(file) {
                return file.type.toLowerCase().indexOf("image") !== -1;
            }
        };
        return {
            restrict: 'A',
            template: '<canvas style="display: none; border: {{ canvasBorder }}px; border-style: solid; border-color: rgba(200, 200, 200, 0.5);" width="0" height="0"/>',
            link: function(scope, element, attributes) {
                var canvas = element.find('canvas');
                if (!helper.support) return;
                var params = {};
                scope.canvasBorder = 1;
                attributes.$observe('ngThumb', function (ngThumb) {
                    params = scope.$eval(ngThumb);
                    if (params.fileUrl) {
                        var img = new Image();
                        img.onload = onLoadImage;
                        img.src = params.fileUrl;
                    } else {
                        if (!helper.isFile(params.file)) return;
                        if (!helper.isImage(params.file)) return;
                        var reader = new FileReader();
                        reader.onload = onLoadFile;
                        reader.readAsDataURL(params.file)
                    }
                    if (params.canvasBorder) {
                        if (params.canvasBorder == "no") {
                            scope.canvasBorder = 0;
                        } else if (angular.isNumber(params.canvasBorder)) {
                            scope.canvasBorder = params.canvasBorder;
                        }
                    }
                });

                function onLoadFile(event) {
                    var img = new Image();
                    img.onload = onLoadImage;
                    img.src = event.target.result;
                }

                function onLoadImage() {

                    var width = (params.width) ? params.width : ((params.height) ? (this.width * params.height) / this.height : this.width);
                    var height = (params.height) ? params.height : ((params.width) ? (this.height * params.width) / this.width : this.height);

                    if (!params.width && params.maxWidth && width > params.maxWidth) {
                        height = height * params.maxWidth / width;
                        width = params.maxWidth;
                    }
                    if (!params.height && params.maxHeight && height > params.maxHeight) {
                        width = width * params.maxHeight / height;
                        height = params.maxHeight;
                    }
                    if (!params.width && params.minWidth && width < params.minWidth) {
                        height = height * params.minWidth / width;
                        width = params.minWidth;
                    }
                    if (!params.height && params.minHeight && height < params.minHeight) {
                        width = width * params.minHeight / height;
                        height = params.minHeight;
                    }

                    var canvasWidth = (params.canvasWidth) ? params.canvasWidth : width;
                    var canvasHeight = (params.canvasHeight) ? params.canvasHeight : height;

                    var drawX = (canvasWidth - width) / 2;
                    var drawY = (canvasHeight - height) / 2;

                    canvas.attr({ width: canvasWidth, height: canvasHeight });
                    canvas.css({ display: "block" });
                    canvas[0].getContext('2d').drawImage(this, drawX, drawY, width, height);
                    if (params.imgClick) {
                        $(canvas).addClass("mouse-cursor-zoom-in");
                        $(canvas).on("click", function (event) {
                            params.imgClick(canvas, event, params);
                        });
                    }
                }
            }
        };
    }])
	.directive('listCheckBox', ['$parse', '$compile', function($parse, $compile) {
		// contains
		function contains(arr, item, comparator) {
			if (angular.isArray(arr)) {
				for (var i = arr.length; i--;) {
					if (comparator(arr[i], item)) {
						return true;
					}
				}
			}
			return false;
		}

		// add
		function add(arr, item, comparator) {
			arr = angular.isArray(arr) ? arr : [];
			if(!contains(arr, item, comparator)) {
				arr.push(item);
			}
			return arr;
		}

		// remove
		function remove(arr, item, comparator) {
			if (angular.isArray(arr)) {
				for (var i = arr.length; i--;) {
					if (comparator(arr[i], item)) {
						arr.splice(i, 1);
						break;
					}
				}
			}
			return arr;
		}

		// http://stackoverflow.com/a/19228302/1458162
		function postLinkFn(scope, elem, attrs) {
			// exclude recursion, but still keep the model
			var listCheckBox = attrs.listCheckBox;
			attrs.$set("listCheckBox", null);
			// compile with `ng-model` pointing to `checked`
			$compile(elem)(scope);
			attrs.$set("listCheckBox", listCheckBox);

			// getter / setter for original model
			var getter = $parse(listCheckBox);
			var setter = getter.assign;
			var checklistChange = $parse(attrs.checklistChange);
			var checklistBeforeChange = $parse(attrs.checklistBeforeChange);

			// value added to list
			var value = attrs.listCheckValue ? $parse(attrs.listCheckValue)(scope.$parent) : attrs.value;

			var comparator = angular.equals;
			if (attrs.hasOwnProperty('checklistComparator')){
				if (attrs.checklistComparator[0] == '.') {
					var comparatorExpression = attrs.checklistComparator.substring(1);
					comparator = function (a, b) {
						return a[comparatorExpression] === b[comparatorExpression];
					};
				} else {
					comparator = $parse(attrs.checklistComparator)(scope.$parent);
				}
			}

			// watch UI checked change
			scope.$watch(attrs.ngModel, function(newValue, oldValue) {
				if (newValue === oldValue) {
					return;
				}
				if (checklistBeforeChange && (checklistBeforeChange(scope) === false)) {
					scope[attrs.ngModel] = contains(getter(scope.$parent), value, comparator);
					return;
				}
				setValueInChecklistModel(value, newValue);
				if (checklistChange) {
					checklistChange(scope);
				}
			});

			function setValueInChecklistModel(value, checked) {
				var current = getter(scope.$parent);
				if (angular.isFunction(setter)) {
					if (checked === true) {
						setter(scope.$parent, add(current, value, comparator));
					} else {
						setter(scope.$parent, remove(current, value, comparator));
					}
				}

			}

			// declare one function to be used for both $watch functions
			function setChecked(newArr, oldArr) {
				if (checklistBeforeChange && (checklistBeforeChange(scope) === false)) {
					setValueInChecklistModel(value, scope[attrs.ngModel]);
					return;
				}
				scope[attrs.ngModel] = contains(newArr, value, comparator);
			}

			// watch original model change
			// use the faster $watchCollection method if it's available
			if (angular.isFunction(scope.$parent.$watchCollection)) {
				scope.$parent.$watchCollection(listCheckBox, setChecked);
			} else {
				scope.$parent.$watch(listCheckBox, setChecked, true);
			}
		}

		return {
			restrict: 'A',
			priority: 1000,
			terminal: true,
			scope: true,
			compile: function(tElement, tAttrs) {
				if ((tElement[0].tagName !== 'INPUT' || tAttrs.type !== 'checkbox') && (tElement[0].tagName !== 'MD-CHECKBOX') && (!tAttrs.btnCheckbox)) {
					throw 'checklist-model should be applied to `input[type="checkbox"]` or `md-checkbox`.';
				}
				if (!tAttrs.listCheckValue && !tAttrs.value) {
					throw 'You should provide `value` or `checklist-value`.';
				}
				// by default ngModel is 'checked', so we set it if not specified
				if (!tAttrs.ngModel) {
					// local scope var storing individual checkbox model
					tAttrs.$set("ngModel", "checked");
				}
				return postLinkFn;
			}
		};
	}])
    .directive('listCheckAll', ['$parse', '$compile', function($parse, $compile) {
        return {
            restrict: 'A',
            scope : {
                model : "=listCheckAll",
                list : "=listCheckData",
                key : "@listCheckKey"
            },
            link: function (scope, element, attrs, modelCtrl) {
                element.bind('click', function() {
                    scope.model = [];
                    if(element[0].checked) {
                        for(var i=0; i < scope.list.length; i++) {
                            if (scope.key) {
                                scope.model.push(scope.list[i][scope.key]);
                            } else {
                                scope.model.push(scope.list[i]);
                            }
                        }
                    }
                    scope.$apply();
                });
            }
        };
    }])
    .directive('draggable', function() {
        return {
            restrict: 'A',
            scope : {
                handle : "@dragHandle"
            },
            link: function(scope, element, attrs) {
                var options = {
                    stop: function(event, ui) {
                        event.stopPropagation();
                    }
                };
                if (scope.handle) {
                    options.handle = scope.handle;
                }
                element.draggable(options);
            }
        };
    })
    .directive("maxNumberLength", [function() {
        return {
            restrict: "A",
            link: function(scope, elem, attrs) {
                var maxNumberLength = parseInt(attrs.maxNumberLength);
                angular.element(elem).on("keypress", function(e) {
                    if (this.value.length == maxNumberLength) e.preventDefault();
                });
            }
        }
    }])
    .directive('scalableProgressBar', [
        '$timeout',
		function ($timeout) {

			var templateHtml = '<div class="progress-striped progress"  style="width:{{swidth}}%">\n'
				+ '<div class="progress-bar default" role="progressbar">\n'
				+ '</div>\n'
				+ '<div class="progress-bar add" role="progressbar">\n'
				+ '</div>\n'
				+ '<div class="progress-bar persent" style="background:bottom;width:100%;top:-100%;" role="progressbar">\n'
				+ '<span style="z-index:1" max="{{ max }}" count-to="{{ bar }}" count-from="{{ bar+base }}" duration="{{ duration }}" filter="number"></span><span style="z-index:1" ng-transclude></span>'
				+ '</div>\n'
				+ '</div>\n';

			return {
				restrict: 'EA',
                template: templateHtml,
                scope: {
                    max : "@",
                    bar : "@",
					top : "@",
					base : "@",
					scalable : "@",
					swidth : "@",
                    from : "@",
                    duration : "@",
					level : "@",
                },
                replace: false,
                transclude: true,
				link: function (scope, element, attrs){
					var max = parseInt(attrs.max, 10);
                    var bar = parseInt(attrs.bar, 10);
					var top = parseInt(attrs.top, 10);
					var base = parseInt(attrs.base, 10);
					var scalable = parseInt(attrs.scalable,10);
					var progressbarLoading = function (progressbar, level)	{
						if($(progressbar).hasClass('add')) {
							if(level == 3) {
								progressClass(progressbar,"progress-bar-high");
							} else if(level == 2) {
								progressClass(progressbar,"progress-bar-middle");
							}
						} else {
							progressClass(progressbar,"progress-bar-low");
						}
                    };

					var progressClass = function(prbar,className) {
						prbar.addClass(className);
						if(className == 'progress-bar-high') {
							prbar.removeClass('progress-bar-middle');
							prbar.removeClass('progress-bar-low');
						} else if( className == 'progress-bar-middle') {
							prbar.removeClass('progress-bar-high');
							prbar.removeClass('progress-bar-low');
						} else {
							prbar.removeClass('progress-bar-high');
							prbar.removeClass('progress-bar-middle');
						}
					};
                    var start = function () {
						var checkPersent = 0;
                        var defaultPersent = 0;
                        if (base > 0) {
                            defaultPersent = parseInt(base * 100 / max, 10);
							checkPersent += defaultPersent;
                        }
						var addPersent = 0;
                        if (scalable > 0) {
                            addPersent = parseInt(scalable * 100 / max, 10);
							checkPersent += addPersent;
							if((addPersent+defaultPersent) > 100) addPersent = 100-defaultPersent;
                        }
                        scope.persent = defaultPersent + addPersent;
						// if(scope.persent > 100 ) scope.persent = 100;
                        var level = 1;

                        // if (bar > top) {
                        //     level = 3;
                        // } else if(scalable > 0) {
						// 	level = 2;
						// }
						if (checkPersent > 100) {
                            level = 3;
                        } else {
							if(scalable > 0) {
								level = 2;
							}
						}
                        $(document).ready(function () {
                            var defaultbar = element.find(".progress-bar.default");
							defaultbar.css("width", defaultPersent + "%");
							$timeout(function () {
                                progressbarLoading(defaultbar, level);
                            }, 400);
							var progressbar = element.find(".progress-bar.add");
                            progressbar.css("width", addPersent + "%");
                            $timeout(function () {
                                progressbarLoading(progressbar, level);
                            }, 400);
                        });
					};

                    var timoutId;
                    var timeoutStart = function (time) {
                        if (timoutId) $timeout.cancel(timoutId);
                        timoutId = $timeout(function () {
                            start();
                        }, time)
                    };

                    attrs.$observe('bar', function (val) {
                        bar = parseInt(val, 10);
                        timeoutStart(200);
                    });
                    attrs.$observe('max', function (val) {
                        max = parseInt(val, 10);
                        timeoutStart(200);
                    });
					attrs.$observe('top', function (val) {
                        top = parseInt(val, 10);
                        timeoutStart(200);
                    });
					attrs.$observe('base', function (val) {
                        base = parseInt(val, 10);
                        timeoutStart(200);
                    });
					attrs.$observe('scalable', function (val) {
                        scalable = parseInt(val, 10);
                        timeoutStart(200);
                    });
                }
			}
    	}
    ])
    .directive('datepicker', function () {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function (scope, element, attrs, ngModelCtrl) {
                element.datepicker({
                    showOn: "button",
                    dateFormat: 'yy-mm-dd',
                    buttonImageOnly: false,
                    buttonText: "Select date",
                    zIndex: 200,
                    onSelect: function (dateText) {
                        scope.$apply(function () {
                            ngModelCtrl.$setViewValue(dateText);
                        });
                    }
                });
            }
        };
    })
    // // File Upload 적용
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
    .directive('ngKeyEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if(event.which === 13) {
                    scope.$apply(function (){
                        scope.$eval(attrs.ngKeyEnter);
                    });
                    event.preventDefault();
                }
            });
        };
    })
    .directive('input', [ '$parse', function($parse) {
        return {
            priority : 2,
            restrict : 'E',
            compile : function(element) {
                element.on('compositionstart', function(e) {
                    e.stopImmediatePropagation();
                });
             }
        };
    }])
    .directive('textarea', [ '$parse', function($parse) {
        return {
            priority : 2,
            restrict : 'E',
            compile : function(element) {
                element.on('compositionstart', function(e) {
                    e.stopImmediatePropagation();
                });
            }
        };
    }])
    .directive('copyToClipboard', function () {
        return {
            restrict: 'A',
            link: function (scope, elem, attrs) {
                elem.click(function () {
                    if (attrs.copyToClipboard) {
                        var $temp_input = $("<input>");
                        $("body").append($temp_input);
                        $temp_input.val(attrs.copyToClipboard).select();
                        document.execCommand("copy");
                        $temp_input.remove();
                    }
                });
            }
        };
    })
    .directive("featherDirective", [function() {
        return {
            restrict: 'C',
            link: function(scope, elem, attrs) {
                feather.replace({width: '1em', height: '1em'});
            }
        }
    }]);
;