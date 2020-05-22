'use strict';

angular.module('app')
    .constant('LOADFILES', {
        modules: [
            {
                name: 'ADM-dateTimePicker',
                files: [
                    'css/components/bootstrap-datetimepicker' + _MIN_ + '.css',
                    'css/components/ADM-dateTimePicker' + _MIN_ + '.css',
                    'js/components/bootstrap-datetimepicker' + _MIN_ + '.js',
                    'js/components/ADM-dateTimePicker' + _MIN_ + '.js',
                ],
                provider: 'js/provider/adMdtpProvider.js',
            },
            {
                name : 'rzModule',
                files: [
                    'css/components/bootstrap-slider.css',
                    'css/components/rzslider' + _MIN_ + '.css',
                    'js/components/bootstrap-slider.js',
                    'js/components/rzslider' + _MIN_ + '.js'
                ],
            },
            {
                name: 'ngStomp',
                files: [
                    'js/components/ng-stomp.standalone.min.js',
                ],
            },
            {
                name: 'nvd3',
                files: [
                    'css/components/nv.d3.css',
                    'js/components/d3.js',
                    'js/components/nv.d3.js',
                    'js/components/angular-nvd3.js',
                ],
            },
            {
                name: 'chart.js',
                files: [
                    'js/components/Chart' + _MIN_ + '.js',
                    'js/components/angular-chart' + _MIN_ + '.js',
                ],
                provider: 'js/provider/chartJsProvider.js',
            },
            {
                name: 'countTo',
                files: ['js/components/angular-count-to' + _MIN_ + '.js'],
            },
            {
                name: 'ui.select2',
                files: [
                    'js/components/bootstrap-select' + _MIN_ + '.js',
                    'css/components/select2' + _MIN_ + '.css',
                    'js/components/select2' + _MIN_ + '.js',
                    'js/components/angular-select2.js',
                ],
            },
            {
                name: 'ngJScrollPane',
                files: [
                    'css/components/jquery.scrolling-tabs' + _MIN_ + '.css',
                    'js/components/jquery.scrolling-tabs' + _MIN_ + '.js',
                    'css/components/jquery.jscrollpane.css',
                    'js/components/jquery.jscrollpane' + _MIN_ + '.js',
                    'js/components/angular-jscrollpane' + _MIN_ + '.js',
                ],
            },
            {
                name: 'Tek.progressBar',
                files: [
                    'css/components/progress-wizard.min.css',
                    'js/components/tek.progress-bar' + _MIN_ + '.js',
                ],
            },
            {
                name: 'slickCarousel',
                files: [
                    'css/components/slick' + _MIN_ + '.css',
                    'css/components/slick-theme' + _MIN_ + '.css',
                    'js/components/slick' + _MIN_ + '.js',
                    'js/components/angular-slick' + _MIN_ + '.js',
                ],
            },
            {
                name: 'scrollable-table',
                files: [
                    'css/components/scrollable-table.css',
                    'css/customs/scrollable-table.css',
                    'js/components/angular-scrollable-table' + _MIN_ + '.js',
                ],
            },
            {
                name: 'ui.sortable',
                files: [
                    'js/components/sortable.js',
                ],
            },
            {
                name: 'dndLists',
                files: [
                    'js/components/angular-drag-and-drop-lists' + _MIN_ + '.js',
                ],
            },
            {
                name: 'toggle-switch',
                files: [
                    'css/components/angular-toggle-switch.css',
                    'js/components/angular-toggle-switch' + _MIN_ + '.js',
                ],
            },
            {
                name: 'checklist-model',
                files: [
                    'js/components/checklistModel.js',
                ],
            },
        ],
        scriptFiles: {
            xterm: [
                'css/components/xterm.css',
                'js/components/xterm.js',
            ],
        },
        customModules: [

        ]
    })
;
