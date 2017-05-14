"use strict"

describe("controlller:: Metrics View Controller", function () {
    var $httpBackend, $controller, modal, $routeParams, $location, scope, $stateParams, service;
    beforeEach(function () {
        module("MetricsViewModule");
        module("ui.bootstrap");
    });

    beforeEach(inject(function (_$rootScope_, _$controller_, _$location_, _$httpBackend_, $uibModal, _ResourceProviderFactory_) {
        scope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $controller = _$controller_;
        $location = _$location_;
        service = _ResourceProviderFactory_;
    }));

    afterEach(function () {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe("should load data successfully", function () {
        var mockData = readJSON("mock/plan.json");
        var controller;
        beforeEach(function () {
            $stateParams = {
                plan_id: "test-metering-plan",
                metric_name: "memory"
            };
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(200, mockData);
            ResourceProviderFactory.plan = mockData;
            controller = $controller("MetricsViewController", {
                $scope: scope,
                $stateParams: $stateParams
            });
            $httpBackend.flush();

        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });


        it("should set scope plan on succcesful initcontroller ", function () {
            expect(scope.plan).toEqual(mockData);
        });

        it("should test iscreatemode sampletemplate", function () {
            var mockData = readJSON("mock/templates.json");
            spyOn(ResourceProviderFactory, "getMetricCreateMode").and.returnValue(true);
            $httpBackend.expectGET("/components/templates.json").respond(mockData);
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(200, mockData);
            controller.initController();
            $httpBackend.flush();
            expect(scope.templates).toEqual(mockData);

        })

    });

    describe("should  not load data on failure", function () {
        var mockData = readJSON("mock/plan.json");
        var controller;
        beforeEach(function () {
            $stateParams = {
                plan_id: "test-metering-plan",
                metric_name: "memory"
            };
            ResourceProviderFactory.plan = mockData
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(500);
            controller = $controller("MetricsViewController", {
                $scope: scope,
                $stateParams: $stateParams
            });
            $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
            spyOn(ResourceProviderFactory, "getMessage").and.returnValue("");
            $httpBackend.flush();

        });
        it("should set scope plan on succcesful initcontroller ", function () {
            expect(scope.plan).toEqual({});
        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

    });

    describe("should test edit and save action", function () {
        var mockData = readJSON("mock/plan.json");
        var controller, resetReadOnlySpy, initControllerSpy, spinnerOpenSpy, spinnerCloseSpy, setReadOnlySpy;
        beforeEach(function () {
            $stateParams = {
                plan_id: "test-metering-plan",
                metric_name: "memory"
            };
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(200, mockData);
            ResourceProviderFactory.plan = mockData;
            controller = $controller("MetricsViewController", {
                $scope: scope,
                $stateParams: $stateParams
            });
            $httpBackend.flush();
            resetReadOnlySpy = spyOn(controller, "resetReadOnly").and.callThrough();
            setReadOnlySpy = spyOn(controller, "setReadOnly").and.callThrough();
            initControllerSpy = spyOn(controller, "initController").and.callFake(function () {});
            spinnerOpenSpy = spyOn(ResourceProviderFactory, "openLoadingSpinner").and.callThrough();
            spinnerCloseSpy = spyOn(ResourceProviderFactory, "closeLoadingSpinner").and.callThrough();
            spyOn(ResourceProviderFactory, "getMessage").and.returnValue("");

        });

        afterEach(function () {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        it("should successfully call edit function click and succeed", function () {
            controller.onEditMetricClick();
            expect(resetReadOnlySpy).toHaveBeenCalled();
            expect(scope.metricCopy).toEqual(scope.metric);
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
            var updateMetricspy = spyOn(controller, "onUpdateMetricConfirm").and.callThrough();
            controller.onSaveMetricClick();
            $httpBackend.flush();
            expect(updateMetricspy).toHaveBeenCalled();
            expect(setReadOnlySpy).toHaveBeenCalled();
            expect(spinnerCloseSpy).toHaveBeenCalled();
        });

        it("should successfully call edit function click and fail", function () {
            controller.onEditMetricClick();
            expect(resetReadOnlySpy).toHaveBeenCalled();
            expect(scope.metricCopy).toEqual(scope.metric);
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(400);
            $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
            var updateMetricspy = spyOn(controller, "onUpdateMetricConfirm").and.callThrough();
            var paneChangedSpy = spyOn(scope, "paneChanged").and.callFake(function () {});
            controller.onSaveMetricClick();
            $httpBackend.flush();
            expect(setReadOnlySpy).toHaveBeenCalled();
            expect(spinnerCloseSpy).toHaveBeenCalled();
        });

        it("should successfully call create method click and succeed", function () {
            spyOn(ResourceProviderFactory, "getMetricCreateMode").and.returnValue(true);
            var addMetricConfirmSpy = spyOn(controller, "onAddMetricConfirm").and.callThrough();
            var navigateToMeteringSpy = spyOn(controller, "navigateBackToMetering").and.callThrough();
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
            controller.setFlags();
            scope.metric = {
                name: "name",
                unit: "unit"
            };
            controller.onSaveMetricClick();
            $httpBackend.flush();
            expect(addMetricConfirmSpy).toHaveBeenCalled();
            expect(navigateToMeteringSpy).toHaveBeenCalled();
            expect(spinnerCloseSpy).toHaveBeenCalled();
        });

        it("should successfully call create method click and fail", function () {
            spyOn(ResourceProviderFactory, "getMetricCreateMode").and.returnValue(true);
            var addMetricConfirmSpy = spyOn(controller, "onAddMetricConfirm").and.callThrough();
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(401);
            controller.setFlags();
            scope.metric = {
                name: "name",
                unit: "unit"
            };
            $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
            controller.onSaveMetricClick();
            $httpBackend.flush();
            expect(addMetricConfirmSpy).toHaveBeenCalled();
            expect(spinnerCloseSpy).toHaveBeenCalled();
        });



        it("should successfully call delete method click and success", function () {
            scope.metric = {
                name: "name",
                unit: "unit"
            };
            var deleteMetricConfirm = spyOn(controller, "onDeleteMetricConfirm").and.callThrough();
            $httpBackend.expectGET("components/partials/MessageBox.html").respond(200);
            var navigateSpy = spyOn(controller, "navigateBackToMetering").and.callThrough();
            controller.onDeleteMetricClick();
            $httpBackend.flush();
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
            scope.messageBoxInstance.close({
                name: "name",
                unit: "unit"
            });
            $httpBackend.flush();
            expect(spinnerCloseSpy).toHaveBeenCalled();
            expect(navigateSpy).toHaveBeenCalled();
        });

        it("should successfully call delete method click and success", function () {
            scope.metric = {
                name: "name",
                unit: "unit"
            };
            var deleteMetricConfirm = spyOn(controller, "onDeleteMetricConfirm").and.callThrough();
            $httpBackend.expectGET("components/partials/MessageBox.html").respond(200);

            controller.onDeleteMetricClick();
            $httpBackend.flush();
            $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(401);
            $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
            scope.messageBoxInstance.close({
                name: "name",
                unit: "unit"
            });
            $httpBackend.flush();
        });

        it("should test onCancelMetricClick utility method in create mode", function () {
            var setFlagsSpy = spyOn(controller, "setFlags").and.callThrough();
            var navigateMeteringSpy = spyOn(controller, "navigateBackToMetering").and.callThrough();
            spyOn(ResourceProviderFactory, "getMetricCreateMode").and.returnValue(true);
            controller.onCancelMetricClick();
            expect(setFlagsSpy).toHaveBeenCalled();
            expect(navigateMeteringSpy).toHaveBeenCalled();
        });

        it("should test onCancelMetricClick utility method in non create mode", function () {
            //var setReadOnlySpy = spyOn(controller, "setReadOnly").and.callThrough();
            var paneChangedSpy = spyOn(scope, "paneChanged").and.callFake(function () {});
            spyOn(ResourceProviderFactory, "getMetricCreateMode").and.returnValue(false);
            var metricCopy = scope.metricCopy;
            controller.onCancelMetricClick();
            expect(setReadOnlySpy).toHaveBeenCalled();
            expect(paneChangedSpy).toHaveBeenCalled();
        });

        it("should test onLoad method", function () {
            var editorSpy = jasmine.createSpyObj("editor", ["setShowPrintMargin", "setOptions"]);
            controller.onLoad(editorSpy);
            expect(editorSpy.setShowPrintMargin).toHaveBeenCalledWith(false);
            expect(editorSpy.setOptions).toHaveBeenCalledWith({
                minLines: 10,
                wrap: true,
                firstLineNumber: 1,
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
        });

        it("should test paneChanged method", function () {
            var pane = {};
            pane.title = "Details";
            scope.selectedPane = pane;
            scope.paneChanged();
            expect(scope.selectedPane === false);
            pane.title = "Meter";
            scope.editor = jasmine.createSpyObj("editor", ["getSession", "setValue"]);
            scope.editor.getSession.and.returnValue(scope.editor);
            scope.paneChanged(pane);
            expect(scope.editor.setValue).toHaveBeenCalledWith("(m) => ({previous_consuming: new BigNumber(m.previous_instance_memory || 0).div(1073741824).mul(m.previous_running_instances || 0)+.mul(-1).toNumber(),consuming: new BigNumber(m.current_instance_memory || 0).div(1073741824).mul(m.current_running_instances || 0).toNumber()})");
        });

        it("should test onChange method", function () {
            scope.editor = jasmine.createSpyObj("editor", ["getSession", "getValue"]);
            scope.editor.getSession.and.returnValue(scope.editor);
            scope.editor.getValue.and.returnValue("test12345")
            scope.selectedPane = {}
            scope.selectedPane.title = "meter";
            controller.onChange();
            expect(scope.metric[scope.selectedPane.title]).toEqual("test12345");
        })
    });

});