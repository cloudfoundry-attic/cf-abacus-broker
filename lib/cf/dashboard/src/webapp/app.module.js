/* eslint-disable max-len*/
angular.module('Resource-Provider', ['appRoutes', 'ui.bootstrap', 'HomeViewModule', 'ngSanitize',
  'ngAnimate', 'MeteringViewModule', 'MetricsViewModule', 'ui.ace', 'ResourceProviderService',
  'MessageBoxService', 'ncy-angular-breadcrumb', 'ngclipboard','httpInterceptor','Resource-Provider.userProfile'
]).controller('rootController', ['$rootScope', 'rootService', function($scope, service) {
  service.loadMessageBundle($scope);
}])
  .service('rootService', ['$http', 'ResourceProviderFactory', function($http, resourceProviderFactory) {
    this.loadMessageBundle = function(scope) {

      $http.get('/components/messagebundle.json').then(function(response) {
        scope.messagebundle = response.data;
        resourceProviderFactory.openLoadingSpinner(scope);
      });
    };
  }])
  .filter('trustAsHtml', function($sce) {
    return $sce.trustAsHtml;
  })
  .directive('contenteditable', function() {
    return {
      require: 'ngModel',
      scope: {},
      link: function(scope, elm, attr, ctrl) {
        elm.bind('blur', function() {
          scope.$apply(function() {
            ctrl.$setViewValue(elm.html().trim());
          });
        });

        ctrl.$render = function() {
          elm.html(ctrl.$viewValue);
        };
      }
    };
  })
  .config(['$breadcrumbProvider', function($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
      templateUrl: 'components/partials/breadcrumb.html'
    });
  }]); 
angular.element(function() {
  angular.bootstrap(document, ['Resource-Provider']);
});
