angular.module('Resource-Provider', ['appRoutes', 'ui.bootstrap', 'HomeViewModule', "ngSanitize",
        'ngAnimate', "MeteringViewModule", "MetricsViewModule", "ui.ace", "ResourceProviderService", "MessageBoxService", "ncy-angular-breadcrumb"
    ])

    .controller("rootController", ["$rootScope", "rootService", function ($scope, service) {
        service.loadMessageBundle($scope);
    }])
    .service("rootService", ["$http", "ResourceProviderFactory", function ($http, resourceProviderFactory) {
        this.loadMessageBundle = function (scope) {

            $http.get("/components/messagebundle.json").then(function (response) {
                scope.messagebundle = response.data;
                resourceProviderFactory.openLoadingSpinner(scope);
            });
        }
    }])
    .filter('trustAsHtml', function ($sce) {
        return $sce.trustAsHtml;
    })
    .config(["$breadcrumbProvider", function ($breadcrumbProvider) {
        $breadcrumbProvider.setOptions({
            templateUrl: 'components/partials/breadcrumb.html'
        })
    }])



angular.element(function () {
    angular.bootstrap(document, ['Resource-Provider']);
});