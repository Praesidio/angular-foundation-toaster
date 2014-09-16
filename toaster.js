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

angular.module('toaster', [])
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
    'icon-fa-classes': {
        success: 'fa-check',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle',
        alert: 'fa-ban',
        secondary: 'fa-eye'
    },
    'alert-class': 'alert-box',
    'container-class': 'right toast-container',
    'leave-class': null
})
.directive('toasterContainer', ['toasterConfig', 'toaster', function (toasterConfig, toaster) {
    return {
        replace: true,
        restrict: 'E',
        scope: true,
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
                limit: mergedConfig['limit'],
                leaveClass: mergedConfig['leave-class']
            };
        },
        controller: ['$scope', function($scope) {
            $scope.removeToast = function(id) {
                for (var i = 0; i < $scope.toasts.length; i++) {
                    if ($scope.toasts[i].id === id) {
                        var ignored = $scope.toasts.splice(i, 1);
                        return true;
                    }
                }
                return false;
            };

            $scope.addToast = function(title, body, options) {
                var toast = options;

                toast.id = $scope.nextId();
                toast.iconClass = $scope.config.iconClasses[toast.type];
                toast.title = title;
                toast.body = body;

                var remove;
                if ($scope.config.newestOnTop === true) {
                    $scope.toasts.unshift(toast);
                    remove = $scope.toasts.pop;
                } else {
                    $scope.toasts.push(toast);
                    remove = $scope.toasts.shift;
                }
                if ($scope.config.limit > 0 && $scope.toasts.length > $scope.config.limit) {
                    remove();
                }
            };
        }],
        template:
            '<div ng-class="config.containerClass">' +
                '<toast ng-repeat="toast in toasts" toast="toast" config="config" remove-toast="removeToast(toast.id)"></toast>' +
            '</div>'
    };
}])
.directive('toast', ['$timeout', function ($timeout) {
    return {
        replace: true,
        restrict: 'E',
        scope: {
            config: '=',
            toast: '=',
            removeToast: '&'
        },
        link: function (scope, element) {
            scope.element = element;
            scope.configureTimer();
        },
        controller: ['$scope', '$log', function($scope, $log) {
            var animationEndEvent = null; // use this to check for support and trigger fallback

            // feature detect which vendor prefix is used
            (function getAnimationEventName() {
                var testEl = document.createElement('div'),
                    transEndEventNames = {
                        'WebkitAnimation': 'webkitAnimationEnd',
                        'MozAnimation': 'animationend',
                        'OAnimation': 'oAnimationEnd oanimationend',
                        'msAnimation': 'MSAnimationEnd',
                        'animation': 'animationend'
                    };
                for (var i in transEndEventNames) {
                    if (transEndEventNames.hasOwnProperty(i) && testEl.style[i] !== undefined) {
                        return animationEndEvent = transEndEventNames[i];
                    }
                }
            })();

            function callHandler(handlerName) {
                var handler = $scope.toast[handlerName];
                if (handler && angular.isFunction($scope.$parent.$parent.$eval(handler))) {
                    return $scope.$parent.$parent.$eval(handler)($scope.toast);
                } else {
                    if (angular.isString(handler))
                        $log.info("TOAST-NOTE: Your handler is not inside a parent scope of toaster-container.");
                    return true;
                }
            }

            $scope.$on('destroy', function() {
                callHandler('removeHandler');
            });

            $scope.configureTimer = function() {
                var toast = $scope.toast;
                var timeout = typeof (toast.timeout) == "number" ? toast.timeout : parseInt(toast.timeout);
                if (timeout > 0) {
                    toast.timer = $timeout(function () {
                        if ($scope.config.leaveClass) {
                            var element = angular.element($scope.element);
                            element.addClass($scope.config.leaveClass).one(animationEndEvent, function(event) {
                                $scope.removeToast();
                                element.remove();
                            });
                        } else {
                            $scope.removeToast();
                        }
                    }, timeout);
                }
            };

            $scope.onHover = function () {
                if ($scope.config.leaveClass) {
                    angular.element($scope.element).removeClass($scope.config.leaveClass).unbind(animationEndEvent);
                }
                if ($scope.toast.timer) {
                    $timeout.cancel($scope.toast.timer);
                    $scope.toast.timer = null;
                }
            };

            $scope.restartTimer = function () {
                if (!$scope.toast.timer)
                    $scope.configureTimer();
            };

            $scope.close = function () {
                $scope.removeToast();
            };

            $scope.click = function () {
                if ($scope.config.tap === true) {
                    if (callHandler('clickHandler')) {
                        $scope.removeToast();
                    }
                }
            };
        }],
        template:
            '<div class="{{toast.type}} {{config.alertClass}}" ng-click="click()" ng-mouseover="onHover()" ng-mouseout="restartTimer()">' +
                '<button class="toast-close-button" ng-show="config.closeButton" ng-click="close()"><i class="fa fa-times"></i></button>' +
                '<div ng-class="config.title">{{toast.title}}</div>' +
                '<div ng-class="config.message" ng-switch on="toast.bodyOutputType">' +
                    '<i ng-class="toast.iconClass" class="fa"></i>' +
                    '<span ng-switch-when="trustedHtml" ng-bind-html="toast.body"></span>' +
                    '<span ng-switch-when="template"><span ng-include="toast.body"></span></span>' +
                    '<span ng-switch-default>{{toast.body}}</span>' +
                '</div>' +
            '</div>'
    };
}])
;
