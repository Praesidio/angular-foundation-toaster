'use strict';

/*
 * Angular Foundation Toaster
 *
 * Copyright 2014 Praesidio, Inc
 * All Rights Reserved.  
 * Use, reproduction, distribution, and modification of this code is subject to the terms and 
 * conditions of the MIT license, available at http://www.opensource.org/licenses/mit-license.php
 *
 * Author: Brandon Smith
 * Forked from AngularJS-Toaster by Jiri Kavulak
 * Which was related to project of John Papa and Hans Fjällemark
 */

angular.module('toaster', ['ngAnimate'])
.service('toaster', function () {
    var toastDefaults = {
        type: 'info',
        bodyOutputType: 'plain',
        timeout: 5000
    };
    var defaultContainer;
    var containers = {};
    this.register = function(container, scope) {
        if (!angular.isDefined(defaultContainer)) {
            defaultContainer = container;
        }
        containers[container] = scope;
    };
    /*
    @param title title text for toast
    @param body template filename or trusted HTML body for toast
    @param options (all optional): {
        type: foundation class (success, info, warning, alert, secondary) (defaults to info),
        container: name of the toaster container to pop into (defaults to first created),
        bodyOutputType: plain | trustedHtml | template (defaults to plain),
        timeout: milliseconds to display (defaults to 5000),
        clickHandler: function to call on click (defaults to none),
        removeHandler: function to call when toast is removed (defaults to none)
    }
     */
    this.pop = function(title, body, options) {
        containers[options && options.container || defaultContainer]
            .addToast(title, body, angular.extend(angular.copy(toastDefaults), options || {}));
    };
})
.constant('toasterConfig', {
    'limit': 0,                   // limits max number of toasts 
    'tap-to-dismiss': true,
    'close-button': false,
    'newest-on-top': true,
    //'fade-in': 1000,            // done in css
    //'on-fade-in': undefined,    // not implemented
    //'fade-out': 1000,           // done in css
    // 'on-fade-out': undefined,  // not implemented
    //'extended-time-out': 1000,    // not implemented
    'icon-fa-classes': {
        success: 'fa-check',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        alert: 'fa-ban',
        secondary: 'fa-eye'
    },
    'alert-class': 'alert-box',
    'container-class': 'right toast-container'
})
.directive('toasterContainer', ['$timeout', 'toasterConfig', 'toaster', function ($timeout, toasterConfig, toaster) {
    return {
        replace: true,
        restrict: 'EA',
        scope: true, // creates an internal scope for this directive
        link: function (scope, elm, attrs) {

            toaster.register(attrs.name || '$$default', scope);

            var id = 0;
            scope.nextId = function () {
                return id++;
            };
            scope.toasts = [];

            var mergedConfig = angular.extend({}, toasterConfig, scope.$eval(attrs.toasterOptions));

            scope.config = {
                containerClass: mergedConfig['container-class'],
                alertClass: mergedConfig['alert-class'],
                tap: mergedConfig['tap-to-dismiss'],
                closeButton: mergedConfig['close-button'],
                iconClasses: mergedConfig['icon-fa-classes'],
                newestOnTop: mergedConfig['newest-on-top'],
                limit: mergedConfig['limit']
            };
        },
        controller: ['$scope', '$log', function($scope, $log) {
            function callHandler(handler, toast) {
                if (handler && angular.isFunction($scope.$parent.$eval(handler))) {
                    return $scope.$parent.$eval(handler)(toast);
                } else {
                    if (angular.isString(toaster.clickHandler))
                        $log.info("TOAST-NOTE: Your handler is not inside a parent scope of toaster-container.");
                    return true;
                }
            }

            function removeToast(id) {
                var i = 0;
                for (i; i < $scope.toasts.length; i++) {
                    if ($scope.toasts[i].id === id) {
                        var removed = $scope.toasts.splice(i, 1)[0];
                        return callHandler(removed.removeHandler, removed);
                    }
                }
            }

            function configureTimer(toast) {
                var timeout = typeof (toast.timeout) == "number" ? toast.timeout : parseInt(toast.timeout);
                if (timeout > 0) {
                    toast.timer = $timeout(function () {
                        removeToast(toast.id);
                    }, timeout);
                }
            }

            $scope.addToast = function(title, body, options) {
                var toast = options;

                toast.id = $scope.nextId();
                toast.iconClass = $scope.config.iconClasses[toast.type];
                toast.title = title;
                toast.body = body;

                configureTimer(toast);

                var remove;
                if ($scope.config.newestOnTop === true) {
                    $scope.toasts.unshift(toast);
                    remove = $scope.toasts.pop;
                } else {
                    $scope.toasts.push(toast);
                    remove = $scope.toasts.shift;
                }
                if ($scope.config.limit > 0 && $scope.toasts.length > $scope.config.limit) {
                    var removed = remove();
                    callHandler(removed.removeHandler, removed);
                }
            };

            $scope.stopTimer = function (toast) {
                if (toast.timer) {
                    $timeout.cancel(toast.timer);
                    toast.timer = null;
                }
            };

            $scope.restartTimer = function (toast) {
                if (!toast.timer)
                    configureTimer(toast);
            };

            $scope.click = function (toast) {
                if ($scope.config.tap === true) {
                    if (callHandler(toast.clickHandler, toast)) {
                        removeToast(toast.id);
                    }
                }
            };
        }],
        template:
        '<div ng-class="config.containerClass">' +
            '<div ng-repeat="toast in toasts" class="{{toast.type}} {{config.alertClass}}" ng-click="click(toast)" ng-mouseover="stopTimer(toast)" ng-mouseout="restartTimer(toast)">' +
              '<button class="toast-close-button" ng-show="config.closeButton"><i class="fa fa-times"></i></button>' +
              '<div ng-class="config.title">{{toast.title}}</div>' +
              '<div ng-class="config.message" ng-switch on="toast.bodyOutputType">' +
                '<i ng-class="toast.iconClass" class="fa"></i>' +
                '<span ng-switch-when="trustedHtml" ng-bind-html="toast.body"></span>' +
                '<span ng-switch-when="template"><span ng-include="toast.body"></span></span>' +
                '<span ng-switch-default>{{toast.body}}</span>' +
              '</div>' +
            '</div>' +
        '</div>'
    };
}]);
