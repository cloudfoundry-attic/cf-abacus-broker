/* eslint-disable max-len*/
angular.module('appRoutes', ['ui.router']).config(['$stateProvider', '$locationProvider', function($stateProvider, $locationProvider) {
  $stateProvider
    .state('home', {
      url: '/manage/instances/:instance_id/bindings/:binding_id/:plan_id',
      templateUrl: 'components/home/HomeView.html',
      controller: 'HomeViewController',
      controllerAs: 'hvc',
      ncyBreadcrumb: {
        label: 'Home'
      }
    })
    .state('metering', {
      url: '/manage/instances/:instance_id/bindings/:binding_id/metering/:plan_id',
      templateUrl: 'components/metering/MeteringView.html',
      controller: 'MeteringViewController',
      controllerAs: 'mvc',
      ncyBreadcrumb: {
        label: '{{planId}}',
        parent: 'home'
      }
    })
    .state('addmetric', {
      url: '/manage/instances/:instance_id/bindings/:binding_id/metering/:plan_id/metric',
      templateUrl: 'components/metrics/MetricsView.html',
      controller: 'MetricsViewController',
      controllerAs: 'metricsCtrl',
      ncyBreadcrumb: {
        label: 'Add metric',
        parent:'metering'
      }
    })
    .state('metric', {
      url: '/manage/instances/:instance_id/bindings/:binding_id/metering/:plan_id/metrics/:metric_name',
      templateUrl: 'components/metrics/MetricsView.html',
      controller: 'MetricsViewController',
      controllerAs: 'metricsCtrl',
      ncyBreadcrumb: {
        label: '<a class="dropdown-toggle" data-toggle="dropdown"  href="#">' +
                    '{{metric_name}} <span class="caret"></span>' +
                    '</a>' +
                    '<ul class="dropdown-menu" role="menu" aria-labelledby="dropdownmenu">' +
                    '{{dropdown}}' +
                    '</ul>',
        parent: 'metering'
      }
    });
  $locationProvider.html5Mode(true);
}]);
