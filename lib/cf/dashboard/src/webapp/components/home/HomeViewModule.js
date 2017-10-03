/* eslint-disable */
angular.module('HomeViewModule', ['ResourceProviderService', 'MessageBoxService', 'ngclipboard'])
  .controller('HomeViewController', ['ResourceProviderFactory', '$scope', '$stateParams',
    'MessageBox', '$uibModal', function (ResourceProviderFactory, $scope, $routeParams, MessageBox, $uibModal) {
      var vm = this;
      $scope.plans = [];

      $scope.planId = $routeParams.plan_id;
      $scope.instance_id = $routeParams.instance_id;
      $scope.binding_id = $routeParams.binding_id;
      ResourceProviderFactory.instance_id = $routeParams.instance_id;
      ResourceProviderFactory.binding_id = $routeParams.binding_id;
      ResourceProviderFactory.plan_id = $routeParams.plan_id;
      vm.initController = function (planId) {
        ResourceProviderFactory.openLoadingSpinner();
        ResourceProviderFactory.getMeteringPlan($scope.planId).then(function (response) {
          $scope.plans.push(response.data);
          ResourceProviderFactory.closeLoadingSpinner();
        }, function (response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_GetPlan_XMSG', $scope.planId, response.statusText));
        });
      };

      vm.formatMeasures = function (measures) {
        var mapFunc = function (item) {
          return item.name;
        };
        return measures.map(mapFunc).join(', ');
      };

      vm.onSubmitUsageClick = function () {
        ResourceProviderFactory.openLoadingSpinner();
        ResourceProviderFactory.getSampleUsageDocument($scope.planId)
          .then(function (response) {
            ResourceProviderFactory.closeLoadingSpinner();
            $scope.modalInstance = $uibModal.open({
              templateUrl: 'components/home/submitUsageDocDialog.html',
              backdrop: 'static',
              windowClass: 'usage-modal',
              controller: 'SubmitUsageController',
              resolve: {
                data: response.data
              }
            });
          })
          .catch(function (err) {
            ResourceProviderFactory.closeLoadingSpinner();
            MessageBox.openErrorBox(ResourceProviderFactory.getMessage('ResourceProvider_ErrorBox_usageDialog_XMSG'));
          })
      }

      vm.onViewUsageClick = function () {
        ResourceProviderFactory.openLoadingSpinner();
        ResourceProviderFactory.getSampleUsageDocument($scope.planId)
          .then(function (response) {
            ResourceProviderFactory.closeLoadingSpinner();
            $scope.modalInstance = $uibModal.open({
              templateUrl: 'components/home/viewUsageDocDialog.html',
              backdrop: 'static',
              windowClass: 'usage-modal',
              controller: 'ViewUsageController',
              resolve: {
                data: response.data
              }
            })
          }).catch(function (err) {
            ResourceProviderFactory.closeLoadingSpinner();
            MessageBox.openErrorBox(ResourceProviderFactory.getMessage('ResourceProvider_ErrorBox_usageDialog_XMSG'));
          })
      };

      vm.initController();
    }])
  .controller('ViewUsageController', function ($scope, $uibModalInstance, data) {
    $scope.doc = {};
    $scope.doc.usageDoc = JSON.stringify(data, undefined, 2);
    $scope.onOk = function () {
      $uibModalInstance.dismiss('cancel');
    }
  })
  .controller('SubmitUsageController', function ($scope, $uibModalInstance, data) {
    $scope.doc = {};
    $scope.doc.isUsageDocSubmitted = false;
    $scope.doc.oneAtATime = false;
    $scope.doc.isUsageDocOpen = true;
    $scope.doc.isUsageRespDisable = true;
    $scope.doc.usageDoc = JSON.stringify(data, undefined, 2);
    $scope.onOk = function () {
      $uibModalInstance.dismiss('cancel');
    }
    $scope.onSubmit = function () {
      ResourceProviderFactory.openLoadingSpinner();
      ResourceProviderFactory.pushSampleUsageDocument($scope.doc.usageDoc)
        .then((function (response) {
          $scope.doc.isUsageRespSuccess = true;
          $scope.doc.usageResp = JSON.stringify(response.data, undefined, 2);
        }))
        .catch(function (err) {
          $scope.doc.isUsageRespSuccess = false;
          $scope.doc.usageResp = JSON.stringify(err.data, undefined, 2);
        })
        .finally(function () {
          $scope.doc.isUsageDocSubmitted = true;
          $scope.doc.isUsageRespOpen = true;
          $scope.doc.isUsageDocOpen = false;
          $scope.doc.isUsageRespDisable = false;
          ResourceProviderFactory.closeLoadingSpinner();
        });
    }
  });

