angular.module('HomeViewModule', ['ResourceProviderService', 'MessageBoxService'])
    .controller('HomeViewController', ['ResourceProviderFactory', '$scope', '$stateParams', 'MessageBox', function(ResourceProviderFactory, $scope, $routeParams, MessageBox) {
      let vm = this;
      $scope.plans = [];

      $scope.planId = $routeParams.plan_id;
      $scope.instance_id = $routeParams.instance_id;
      $scope.binding_id = $routeParams.binding_id;
      ResourceProviderFactory.instance_id = $routeParams.instance_id;
      ResourceProviderFactory.binding_id = $routeParams.binding_id;
      ResourceProviderFactory.plan_id = $routeParams.plan_id;
      vm.initController = function(planId) {
        ResourceProviderFactory.openLoadingSpinner();
        ResourceProviderFactory.getMeteringPlan($scope.planId).then(function(response) {
          $scope.plans.push(response.data);
          ResourceProviderFactory.closeLoadingSpinner();
        }, function(response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_GetPlan_XMSG', $scope.planId, response.statusText));
        });
      };

      vm.formatMeasures = function(measures) {
        let mapFunc = function(item) {
          return item.name;
        };
        return measures.map(mapFunc).join(', ');
      };

      vm.initController();
    }]);
