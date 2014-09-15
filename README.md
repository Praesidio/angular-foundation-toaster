angular-foundation-toaster
=================

**Angular Foundation Toaster** is a AngularJS port of the **toastr** non-blocking notification jQuery library using **Foundation** styles and **Font-Awesome** icons. It requires AngularJS v1.2.6 or higher, Zurb/Foundation and Font-Awesome. 

### Current Version 0.0.1

## Prerequisites

1. An angular app

2. Zurb/Foundation

3. A build that recognizes bower components

## Getting started

1. Install the module:

```
bower install praesidio/angular-foundation-toaster
```

2. Add toaster container directive: `<toaster-container></toaster-container>`

3. Prepare the call of toaster method:

```js
	// Display an info toast with no title
	angular.module('main', ['toaster'])
	.controller('myController', function($scope, toaster) {
	    $scope.info = function(){
	        toaster.pop("title", "text");
	    };
	});

	// Display an alert toast with no title
	angular.module('main', ['toaster'])
	.controller('myController', function($scope, toaster) {
	    $scope.alert = function(){
	        toaster.pop("title", "text", {type: 'alert'});
	    };
	});
```

4. Call controller method on button click:

```html
<div ng-controller="myController">
    <button ng-click="info()">Show Info</button>
    <button ng-click="alert()">Show Alert</button>
</div>
```

### Other Options

```html
// Change display position
<toaster-container toaster-options="{'container-class': 'left'}"></toaster-container>
```

### Animations
This library uses jqLite and CSS3 animations.  So far only a 'leave' anination is supported, and can be specified by simply specifying your own @keyframes style animation class in the toaster-options as 'leave-class'.
		
## Author
**Brandon Smith**

## Credits
Forked from AngularJS-Toaster by Jiri Kavulak which was inspired by http://codeseven.github.io/toastr/demo.html.

## Copyright
Copyright © 2014 [Brandon Smith](mailto:brandon@praesid.io).

## License 
angular-foundation-toaster is under MIT license - http://www.opensource.org/licenses/mit-license.php
