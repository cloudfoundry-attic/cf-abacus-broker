"use strict"

describe("controlller:: Metering View Controller", function () {
    var $httpBackend, $controller, modal, $routeParams, $location, scope, modalProvider, $stateParams;
    beforeEach(function () {
        module("MeteringViewModule");
        module("ui.bootstrap");
    });

    beforeEach(inject(function (_$rootScope_, _$controller_, $uibModal, _$location_, _$httpBackend_) {
        scope = _$rootScope_;
        $httpBackend = _$httpBackend_;
        $controller = _$controller_;
        modal = $uibModal;
        $location = _$location_;
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
                plan_id: "test-metering-plan"
            };
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(200, mockData);
            controller = $controller("MeteringViewController", {
                $scope: scope,
                $uibModal: modal,
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

        describe("Add measure Dialog Test", function () {
            var actualOptions, initControllerSpy;
            beforeEach(function () {
                var modalInstance = {
                    close: function () {},
                    dismiss: function () {}
                };
                // var addMeasureController = $controller("AddMeasureDialogController", {
                //     $scope: scope,
                //     $uibModalInstance: modalInstance
                // });
                var modalOptions = {
                    templateUrl: 'components/metering/templates/add-measure-dialog.html',
                    controller: "AddMeasureController",
                    scope: scope
                };

                var fakeModal = {
                    result: {
                        then: function (confirmCallback, cancelCallback) {
                            //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
                            this.confirmCallBack = confirmCallback;
                            this.cancelCallback = cancelCallback;
                        }
                    },
                    close: function (item) {
                        //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
                        this.result.confirmCallBack(item);
                    },
                    dismiss: function (type) {
                        //The user clicked cancel on the modal dialog, call the stored cancel callback
                        this.result.cancelCallback(type);
                    }
                };
                spyOn(ResourceProviderFactory, "getMessage").and.returnValue("");
                //spyOn(modal, "open").and.returnValue(fakeModal);
                initControllerSpy = spyOn(controller, "initController").and.callFake(function () {});
            })

            it("should call updatemetering function on success add measures", function () {
                $httpBackend.expectGET("components/metering/templates/add-measure-dialog.html").respond(200);
                controller.onAddMeasureClick();
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
                scope.modalInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(initControllerSpy).toHaveBeenCalled();
            });

            it("should not call updatemetering function on failure add measures", function () {
                $httpBackend.expectGET("components/metering/templates/add-measure-dialog.html").respond(200);
                controller.onAddMeasureClick();
                controller.onAddMeasureClick();
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(500);
                $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
                scope.modalInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(initControllerSpy).not.toHaveBeenCalled();
            })
        });

        describe("edit measure Dialog Test", function () {
            var actualOptions, initControllerSpy;
            beforeEach(function () {
                var modalInstance = {
                    close: function () {},
                    dismiss: function () {}
                };
               
                var modalOptions = {
                    templateUrl: 'components/metering/templates/add-measure-dialog.html',
                    controller: "AddMeasureController",
                    scope: scope
                };

                var fakeModal = {
                    result: {
                        then: function (confirmCallback, cancelCallback) {
                            //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
                            this.confirmCallBack = confirmCallback;
                            this.cancelCallback = cancelCallback;
                        }
                    },
                    close: function (item) {
                        //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
                        this.result.confirmCallBack(item);
                    },
                    dismiss: function (type) {
                        //The user clicked cancel on the modal dialog, call the stored cancel callback
                        this.result.cancelCallback(type);
                    }
                };
                spyOn(ResourceProviderFactory, "getMessage").and.returnValue("");
                //spyOn(modal, "open").and.returnValue(fakeModal);
                initControllerSpy = spyOn(controller, "initController").and.callFake(function () {});
            })

            it("should call updatemetering function on success edit measure", function () {
                $httpBackend.expectGET("components/metering/templates/add-measure-dialog.html").respond(200);
                controller.onEditMeasureClick({name:"measure",unit:"unit"},0);
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
                scope.modalInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(initControllerSpy).toHaveBeenCalled();
            });

            it("should not call updatemetering function on failure edit measure", function () {
                $httpBackend.expectGET("components/metering/templates/add-measure-dialog.html").respond(200);
                controller.onEditMeasureClick({name:"measure",unit:"unit"},0);
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(500);
                $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
                scope.modalInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(initControllerSpy).not.toHaveBeenCalled();
            })
        });

         describe("delete measure Test", function () {
            var actualOptions, initControllerSpy,deleteConfirmSpy;
            beforeEach(function () {
                var modalInstance = {
                    close: function () {},
                    dismiss: function () {}
                };
               
                var fakeModal = {
                    result: {
                        then: function (confirmCallback, cancelCallback) {
                            //Store the callbacks for later when the user clicks on the OK or Cancel button of the dialog
                            this.confirmCallBack = confirmCallback;
                            this.cancelCallback = cancelCallback;
                        }
                    },
                    close: function (item) {
                        //The user clicked OK on the modal dialog, call the stored confirm callback with the selected item
                        this.result.confirmCallBack(item);
                    },
                    dismiss: function (type) {
                        //The user clicked cancel on the modal dialog, call the stored cancel callback
                        this.result.cancelCallback(type);
                    }
                };
                spyOn(ResourceProviderFactory, "getMessage").and.returnValue("");
                initControllerSpy = spyOn(controller, "initController").and.callFake(function () {});
                deleteConfirmSpy = spyOn(controller, "onDeleteMeasureConfirm").and.callThrough();
            })

            it("should call updatemetering function on success delete measure", function () {
                $httpBackend.expectGET("components/partials/MessageBox.html").respond(200);
                controller.onDeleteMeasureClick({name:"measure",unit:"unit"},0);
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(201);
                scope.messageBoxInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(deleteConfirmSpy).toHaveBeenCalled();
                expect(initControllerSpy).toHaveBeenCalled();
            });

            it("should not call updatemetering function on failure add measures", function () {
                $httpBackend.expectGET("components/partials/MessageBox.html").respond(200);
                controller.onDeleteMeasureClick({name:"measure",unit:"unit"},0);
                $httpBackend.flush();
                $httpBackend.expectPUT("v1/metering/plan/test-metering-plan").respond(500);
                $httpBackend.expectGET("components/partials/ErrorBox.html").respond(200);
                scope.messageBoxInstance.close({
                    'name': "test",
                    "unit": "test1234"
                });
                $httpBackend.flush();
                expect(deleteConfirmSpy).toHaveBeenCalled();
                expect(initControllerSpy).not.toHaveBeenCalled();
            })
        })
    });

    describe("should  not load data on failure", function () {
        var mockData = readJSON("mock/plan.json");
        var controller;
        beforeEach(function () {
            $httpBackend.expectGET("v1/metering/plans/test-metering-plan").respond(500);
            controller = $controller("MeteringViewController", {
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
});