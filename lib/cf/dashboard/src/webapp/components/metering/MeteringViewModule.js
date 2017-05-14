angular.module('MeteringViewModule', ['ResourceProviderService', 'MessageBoxService'])
    .controller('MeteringViewController', ['ResourceProviderFactory', '$scope', '$uibModal', '$stateParams', '$location', 'MessageBox', '$rootScope', function(ResourceProviderFactory, $scope, $uibModal, $routeParams, $location, MessageBox, $rootScope) {
      let vm = this;
      $scope.plan = {};
      $scope.sortType = 'name';
      $scope.sortReverse = false;
      $scope.planId = $routeParams.plan_id;
      $scope.instance_id = $routeParams.instance_id;
      $scope.binding_id = $routeParams.binding_id;
      $scope.selectedPane = $rootScope.selectedPane;

      vm.initController = function(planId) {
        ResourceProviderFactory.resetMetricCreateMode();
        ResourceProviderFactory.openLoadingSpinner();
        ResourceProviderFactory.getMeteringPlan($routeParams.plan_id).then(function(response) {
          $scope.plan = response.data;
                // hack
          ResourceProviderFactory.plan = $scope.plan;
          ResourceProviderFactory.closeLoadingSpinner();
        }, function(response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_GetPlan_XMSG', $scope.planId, response.statusText));
        });
      };

      vm.onAddMeasureClick = function() {
        $scope.modalInstance = $uibModal.open({
          templateUrl: 'components/metering/templates/add-measure-dialog.html',
          backdrop: 'static',
          controller: function($scope, $uibModalInstance) {
            let measurePair = {};
            $scope.measureName = null;
            $scope.measureUnit = null;
            $scope.title = ResourceProviderFactory.getMessage('ResourceProvider_AddMeasure_Dialog_XTIT');
            $scope.onSave = function() {
              measurePair = {
                'name': $scope.measureName,
                'unit': $scope.measureUnit
              };
              $uibModalInstance.close(measurePair);
            };
            $scope.onClose = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        });

        $scope.modalInstance.result.then(function(measure) {
          vm.onAddMeasureConfirm(measure);
        });
      };

      vm.onAddMeasureConfirm = function(measure) {
            // clone plan obj
        ResourceProviderFactory.openLoadingSpinner();
        let tempPlan = angular.copy($scope.plan);
        tempPlan.measures.push(measure);
        ResourceProviderFactory.updateMeteringPlan(tempPlan.plan_id, tempPlan).then(function(response) {
          vm.initController();
        }, function(response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_AddMeasure_XMSG', measure.name, response.statusText));
        });
      };

      vm.onEditMeasureClick = function(measure, index) {
        $scope.modalInstance = $uibModal.open({
          templateUrl: 'components/metering/templates/add-measure-dialog.html',
          backdrop: 'static',
          controller: function($scope, $uibModalInstance) {
            $scope.measureName = measure.name;
            $scope.measureUnit = measure.unit;
            $scope.isEditMode = true;
            $scope.title = ResourceProviderFactory.getMessage('ResourceProvider_UpdateMeasure_Dialog_XTIT');
            $scope.onSave = function() {
              measurePair = {
                'name': $scope.measureName,
                'unit': $scope.measureUnit
              };
              $uibModalInstance.close(measurePair);
            };

            $scope.onClose = function() {
              $uibModalInstance.dismiss('cancel');
            };
          }
        });

        $scope.modalInstance.result.then(function(measure) {
          vm.onUpdateMeasureConfirm(measure);
        });
      };

      vm.onUpdateMeasureConfirm = function(measure) {
            // clone plan obj
        ResourceProviderFactory.openLoadingSpinner();
        let tempPlan = angular.copy($scope.plan);
        let index = _.findIndex($scope.plan.measures, {
          'name': measure.name
        });
        tempPlan.measures[index] = measure;
        ResourceProviderFactory.updateMeteringPlan(tempPlan.plan_id, tempPlan).then(function(response) {
          vm.initController();
        }, function(response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_UpdateMeasure_XMSG', measure.name, response.statusText));
        });
      };

      vm.onDeleteMeasureClick = function(measure, index) {
        let title = ResourceProviderFactory.getMessage('ResourceProvider_Measure_DeleteAction_Box_XTIT');
        let message = ResourceProviderFactory.getMessage('ResourceProvider_Measure_DeleteAction_Box_XMSG') + ' "' + measure.name + '" ?';
        $scope.messageBoxInstance = MessageBox.openMessageBox(title, message);
        $scope.messageBoxInstance.result.then(function(measureUnitPair) {
          vm.onDeleteMeasureConfirm(measure);
        });

      };

      vm.onDeleteMeasureConfirm = function(measure) {
        ResourceProviderFactory.openLoadingSpinner();
        let copyPlan = angular.copy($scope.plan);
        _.remove(copyPlan.measures, {
          'name': measure.name
        });
        ResourceProviderFactory.updateMeteringPlan(copyPlan.plan_id, copyPlan).then(function(response) {
          vm.initController();
        }, function(response) {
          ResourceProviderFactory.closeLoadingSpinner();
          MessageBox.openErrorBox(ResourceProviderFactory.constructErrorMessage('ResourceProvider_ErrorBox_DeleteMeasure_XMSG', measure.name, response.statusText));
        });
      };

      vm.onAddMetricClick = function() {
        ResourceProviderFactory.setMetricCreateMode(true);
        $location.path($location.$$path + '/metric');
      };

      $scope.paneChanged = function(tab) {
        $scope.selectedPane = tab;
        $rootScope.selectedPane = tab;
      };

      vm.initController();
    }]);
