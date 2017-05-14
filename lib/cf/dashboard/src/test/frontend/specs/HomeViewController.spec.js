'use strict';

describe('controller:: HomeViewModuleController', function() {
  let $controller, scope, $httpBackend, controller, $stateParams;
  beforeEach(function() {
    module('HomeViewModule');
    module('ui.bootstrap');
  });

  beforeEach(inject(function(_$rootScope_, _$controller_, _$httpBackend_) {
    $controller = _$controller_;
    scope = _$rootScope_;
    $httpBackend = _$httpBackend_;

  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('should load data successfully', function() {
    let mockData = readJSON('mock/plan.json');
    beforeEach(function() {
      $stateParams = {
        plan_id: 'test-metering-plan'
      };
      $httpBackend.expectGET('v1/metering/plans/test-metering-plan').respond(200, mockData);
      controller = $controller('HomeViewController', {
        $scope: scope,
        $stateParams: $stateParams
      });
      $httpBackend.flush();

    });
    it('should set scope plan on succcesful initcontroller ', function() {
      expect(scope.plans).toEqual([mockData]);
    });

    it('should validate formatMetric metrhid', function() {
      expect(controller.formatMeasures(scope.plans[0].measures)).toBe('current_instance_memory, current_running_instances, previous_instance_memory, previous_running_instances');
    });

    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

  });

  describe('should fail on loadData', function() {
    beforeEach(function() {
      $stateParams = {
        plan_id: 'test-metering-plan'
      };
      $httpBackend.expectGET('v1/metering/plans/test-metering-plan').respond(500);
      $controller('HomeViewController', {
        $scope: scope,
        $stateParams: $stateParams
      });
      spyOn(ResourceProviderFactory, 'getMessage').and.returnValue('');
      $httpBackend.expectGET('components/partials/ErrorBox.html').respond(200);
      $httpBackend.flush();
    });
    it('should not set scope plan on  initcontroller failure ', function() {
      expect(scope.plans).toEqual([]);
    });
  });
});
