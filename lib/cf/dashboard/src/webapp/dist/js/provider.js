/*
 abacus-ext-service-dashboard 2017-05-26 
*/
angular.module("HomeViewModule", [ "ResourceProviderService", "MessageBoxService" ]).controller("HomeViewController", [ "ResourceProviderFactory", "$scope", "$stateParams", "MessageBox", function(a, b, c, d) {
    var e = this;
    b.plans = [], b.planId = c.plan_id, b.instance_id = c.instance_id, b.binding_id = c.binding_id, 
    a.instance_id = c.instance_id, a.binding_id = c.binding_id, a.plan_id = c.plan_id, 
    e.initController = function(c) {
        a.openLoadingSpinner(), a.getMeteringPlan(b.planId).then(function(c) {
            b.plans.push(c.data), a.closeLoadingSpinner();
        }, function(c) {
            a.closeLoadingSpinner(), d.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_GetPlan_XMSG", b.planId, c.statusText));
        });
    }, e.formatMeasures = function(a) {
        var b = function(a) {
            return a.name;
        };
        return a.map(b).join(", ");
    }, e.initController();
} ]), angular.module("MeteringViewModule", [ "ResourceProviderService", "MessageBoxService" ]).controller("MeteringViewController", [ "ResourceProviderFactory", "$scope", "$uibModal", "$stateParams", "$location", "MessageBox", "$rootScope", function(a, b, c, d, e, f, g) {
    var h = this;
    b.plan = {}, b.sortType = "name", b.sortReverse = !1, b.planId = d.plan_id, b.instance_id = d.instance_id, 
    b.binding_id = d.binding_id, b.selectedPane = g.selectedPane, h.initController = function(c) {
        a.resetMetricCreateMode(), a.openLoadingSpinner(), a.getMeteringPlan(d.plan_id).then(function(c) {
            b.plan = c.data, a.plan = b.plan, a.closeLoadingSpinner();
        }, function(c) {
            a.closeLoadingSpinner(), f.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_GetPlan_XMSG", b.planId, c.statusText));
        });
    }, h.onAddMeasureClick = function() {
        b.modalInstance = c.open({
            templateUrl: "components/metering/templates/add-measure-dialog.html",
            backdrop: "static",
            controller: [ "$scope", "$uibModalInstance", function(b, c) {
                var d = {};
                b.measureName = null, b.measureUnit = null, b.title = a.getMessage("ResourceProvider_AddMeasure_Dialog_XTIT"), 
                b.onSave = function() {
                    d = {
                        name: b.measureName,
                        unit: b.measureUnit
                    }, c.close(d);
                }, b.onClose = function() {
                    c.dismiss("cancel");
                };
            } ]
        }), b.modalInstance.result.then(function(a) {
            h.onAddMeasureConfirm(a);
        });
    }, h.onAddMeasureConfirm = function(c) {
        a.openLoadingSpinner();
        var d = angular.copy(b.plan);
        d.measures.push(c), a.updateMeteringPlan(d.plan_id, d).then(function(a) {
            h.initController();
        }, function(b) {
            a.closeLoadingSpinner(), f.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_AddMeasure_XMSG", c.name, b.statusText));
        });
    }, h.onEditMeasureClick = function(d, e) {
        b.modalInstance = c.open({
            templateUrl: "components/metering/templates/add-measure-dialog.html",
            backdrop: "static",
            controller: [ "$scope", "$uibModalInstance", function(b, c) {
                b.measureName = d.name, b.measureUnit = d.unit, b.isEditMode = !0, b.title = a.getMessage("ResourceProvider_UpdateMeasure_Dialog_XTIT"), 
                b.onSave = function() {
                    measurePair = {
                        name: b.measureName,
                        unit: b.measureUnit
                    }, c.close(measurePair);
                }, b.onClose = function() {
                    c.dismiss("cancel");
                };
            } ]
        }), b.modalInstance.result.then(function(a) {
            h.onUpdateMeasureConfirm(a);
        });
    }, h.onUpdateMeasureConfirm = function(c) {
        a.openLoadingSpinner();
        var d = angular.copy(b.plan), e = _.findIndex(b.plan.measures, {
            name: c.name
        });
        d.measures[e] = c, a.updateMeteringPlan(d.plan_id, d).then(function(a) {
            h.initController();
        }, function(b) {
            a.closeLoadingSpinner(), f.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_UpdateMeasure_XMSG", c.name, b.statusText));
        });
    }, h.onDeleteMeasureClick = function(c, d) {
        var e = a.getMessage("ResourceProvider_Measure_DeleteAction_Box_XTIT"), g = a.getMessage("ResourceProvider_Measure_DeleteAction_Box_XMSG") + ' "' + c.name + '" ?';
        b.messageBoxInstance = f.openMessageBox(e, g), b.messageBoxInstance.result.then(function(a) {
            h.onDeleteMeasureConfirm(c);
        });
    }, h.onDeleteMeasureConfirm = function(c) {
        a.openLoadingSpinner();
        var d = angular.copy(b.plan);
        _.remove(d.measures, {
            name: c.name
        }), a.updateMeteringPlan(d.plan_id, d).then(function(a) {
            h.initController();
        }, function(b) {
            a.closeLoadingSpinner(), f.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_DeleteMeasure_XMSG", c.name, b.statusText));
        });
    }, h.onAddMetricClick = function() {
        a.setMetricCreateMode(!0), e.path(e.$$path + "/metric");
    }, b.paneChanged = function(a) {
        b.selectedPane = a, g.selectedPane = a;
    }, h.initController();
} ]), angular.module("MetricsViewModule", [ "ResourceProviderService", "MessageBoxService" ]).controller("MetricsViewController", [ "ResourceProviderFactory", "$scope", "$stateParams", "$location", "MessageBox", "$rootScope", function(a, b, c, d, e, f) {
    var g = this;
    b.plan = a.getPlan(), b.planId = c.plan_id, b.instance_id = c.instance_id, b.binding_id = c.binding_id, 
    b.metric_name = c.metric_name, b.selectedPane = null, b.dropdown = a.getMetricsDropdown(b.plan, b.metric_name, b), 
    g.initController = function() {
        g.setFlags(), a.openLoadingSpinner(), b.metric = {}, a.getMetricCreateMode() && a.getSampleFunctions().then(function(a) {
            b.templates = a.data, _.forOwn(b.templates, function(a, c) {
                b.metric[c] = a;
            }), b.metric.type = "discrete";
        }), a.getMeteringPlan(c.plan_id).then(function(d) {
            b.plan = d.data, g.plan = b.plan, b.metric = _.find(b.plan.metrics, {
                name: c.metric_name
            }) || b.metric, a.closeLoadingSpinner();
        }, function(c) {
            b.plan = {}, a.closeLoadingSpinner(), e.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_GetPlan_XMSG", b.planId, c.statusText));
        });
    }, g.setFlags = function() {
        b.isReadOnly = !a.getMetricCreateMode(), b.isCreateMetricMode = !a.getMetricCreateMode();
    }, g.onLoad = function(a) {
        a.setShowPrintMargin(!1), b.editor = a, b.editor.setOptions({
            minLines: 10,
            wrap: !0,
            firstLineNumber: 1,
            enableBasicAutocompletion: !0,
            enableSnippets: !0,
            enableLiveAutocompletion: !0
        });
    }, g.onEditMetricClick = function() {
        g.resetReadOnly(), b.metricCopy = angular.copy(b.metric);
    }, g.navigateBackToMetering = function() {
        if (a.getMetricCreateMode()) d.path(d.$$path.substr(0, d.$$path.lastIndexOf("/"))), 
        a.resetMetricCreateMode(); else {
            var b = d.$$path.substr(0, d.$$path.lastIndexOf("/"));
            d.path(b.substr(0, b.lastIndexOf("/")));
        }
    }, g.onCancelMetricClick = function() {
        a.getMetricCreateMode() ? (g.setFlags(), g.navigateBackToMetering()) : (g.setReadOnly(), 
        b.metric = b.metricCopy, b.paneChanged());
    }, g.onDeleteMetricClick = function(c) {
        var c = b.metric, d = a.getMessage("ResourceProvider_Metric_DeleteAction_Box_XTIT"), f = a.getMessage("ResourceProvider_Metric_DeleteAction_Box_XMSG") + ' "' + c.name + '" ?';
        b.messageBoxInstance = e.openMessageBox(d, f), b.messageBoxInstance.result.then(function() {
            g.onDeleteMetricConfirm(c);
        });
    }, g.onDeleteMetricConfirm = function() {
        var c = angular.copy(b.plan), d = angular.copy(b.metric);
        _.remove(c.metrics, {
            name: d.name
        }), a.openLoadingSpinner(), a.updateMeteringPlan(c.plan_id, c).then(function() {
            g.setReadOnly(), a.closeLoadingSpinner(), g.navigateBackToMetering();
        }, function(b) {
            g.setReadOnly(), a.closeLoadingSpinner(), e.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_UpdateMetric_XMSG", d.name, b.statusText));
        });
    }, g.onAddMetricConfirm = function() {
        var c = angular.copy(b.plan), d = angular.copy(b.metric), d = angular.copy(b.metric);
        c.metrics.push(d), a.openLoadingSpinner(), a.updateMeteringPlan(c.plan_id, c).then(function() {
            a.closeLoadingSpinner(), g.navigateBackToMetering();
        }, function(b) {
            a.closeLoadingSpinner(), g.navigateBackToMetering(), e.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_UpdateMetric_XMSG", d.name, b.statusText));
        });
    }, g.onUpdateMetricConfirm = function() {
        var c = angular.copy(b.plan), d = angular.copy(b.metric);
        d = _.omitBy(d, _.isEmpty);
        var f = _.findIndex(b.plan.metrics, {
            name: d.name
        });
        c.metrics[f] = d, a.updateMeteringPlan(c.plan_id, c).then(function() {
            g.setReadOnly(), a.closeLoadingSpinner();
        }, function(c) {
            g.setReadOnly(), b.metric = b.metricCopy, b.paneChanged(), a.closeLoadingSpinner(), 
            e.openErrorBox(a.constructErrorMessage("ResourceProvider_ErrorBox_UpdateMetric_XMSG", d.name, c.statusText));
        });
    }, g.onSaveMetricClick = function() {
        a.openLoadingSpinner(), a.getMetricCreateMode() ? g.onAddMetricConfirm() : g.onUpdateMetricConfirm();
    }, g.setReadOnly = function() {
        b.isReadOnly = !0;
    }, g.resetReadOnly = function() {
        b.isReadOnly = !1;
    }, b.paneChanged = function(a) {
        var c = null;
        if (a ? (b.selectedPane = a, c = a) : c = b.selectedPane, "Details" === c.title) b.showAceEditor = !1; else {
            if (b.plan && b.plan.metrics) {
                var d = b.metric[c.title.toLowerCase()];
                b.editor.getSession().setValue(d || "");
            }
            b.showAceEditor = !0;
        }
    }, g.onChange = function() {
        var a = b.editor.getSession().getValue(), c = b.selectedPane.title.toLowerCase();
        "details" !== c && (b.metric[c] = a);
    }, b.tabChanged = function(a) {
        b.selectedTab = a;
    }, g.initController();
} ]).directive("tabs", function() {
    return {
        restrict: "E",
        transclude: !0,
        scope: {
            paneChanged: "&"
        },
        controller: [ "$scope", "$element", function(a, b) {
            var c = a.panes = [], d = null;
            a.isSelected = function(b) {
                var c = a.$parent.selectedPane;
                return c ? c.title === b.title ? (b.selected = !0, !0) : (b.selected = !1, !1) : b.selected;
            }, a.select = function(b) {
                b.selected = !0, a.paneChanged({
                    selectedPane: b
                });
            }, this.addPane = function(a) {
                0 != c.length || d ? a.selected = !1 : a.selected = !0, c.push(a);
            };
        } ],
        template: '<div class="tabbable"><ul class="nav nav-tabs tabs-advanced"><li ng-repeat="pane in panes" ng-class="{active:isSelected(pane)}"><a href="" ng-click="select(pane)">{{pane.title}}</a></li></ul><div class="tab-content" ng-transclude></div></div>',
        replace: !0
    };
}).directive("pane", function() {
    return {
        require: "^tabs",
        restrict: "E",
        transclude: !0,
        scope: {
            title: "@"
        },
        link: function(a, b, c, d) {
            d.addPane(a);
        },
        template: '<div class="tab-pane" ng-class="{active: selected}" ng-transclude></div>',
        replace: !0
    };
}), angular.module("MessageBoxService", []).factory("MessageBox", [ "$uibModal", "$rootScope", function(a, b) {
    var c = {};
    return c.openMessageBox = function(b, c) {
        var d = function(a, d) {
            a.message = c, a.messageBoxTitle = b, a.onOk = function() {
                d.close();
            }, a.onClose = function() {
                d.dismiss("cancel");
            };
        };
        return d.$inject = [ "$scope", "$uibModalInstance" ], a.open({
            templateUrl: "components/partials/MessageBox.html",
            controller: d
        });
    }, c.openErrorBox = function(b) {
        var c = function(a, c) {
            a.message = b, a.onOk = function() {
                c.dismiss("cancel");
            };
        };
        c.$inject = [ "$scope", "$uibModalInstance" ], a.open({
            templateUrl: "components/partials/ErrorBox.html",
            controller: c
        });
    }, c;
} ]), angular.module("ResourceProviderService", []).factory("ResourceProviderFactory", [ "$http", "$rootScope", "$compile", "$interpolate", function(a, b, c, d) {
    return ResourceProviderFactory = {}, ResourceProviderFactory.isMetricEditMode = !1, 
    ResourceProviderFactory.defaultMeteringPane = "measures", ResourceProviderFactory.getMeteringPlan = function(b) {
        return a.get("v1/metering/plans/" + b);
    }, ResourceProviderFactory.updateMeteringPlan = function(b, c, d) {
        return a.put("v1/metering/plans/" + b, c);
    }, ResourceProviderFactory.openLoadingSpinner = function(a) {
        b.isLoadingSpinnerActive = !0;
    }, ResourceProviderFactory.setMetricCreateMode = function(a) {
        ResourceProviderFactory.isMetricCreateMode = !0;
    }, ResourceProviderFactory.getMetricCreateMode = function(a) {
        return ResourceProviderFactory.isMetricCreateMode;
    }, ResourceProviderFactory.resetMetricCreateMode = function(a) {
        ResourceProviderFactory.isMetricCreateMode = !1;
    }, ResourceProviderFactory.closeLoadingSpinner = function() {
        b.isLoadingSpinnerActive = !1;
    }, ResourceProviderFactory.constructErrorMessage = function(a, b, c) {
        return ResourceProviderFactory.getMessage(a) + ' "' + b + '" : ' + c + ".";
    }, ResourceProviderFactory.getMessage = function(a) {
        return b.messagebundle[a];
    }, ResourceProviderFactory.getPlan = function() {
        return ResourceProviderFactory.plan;
    }, ResourceProviderFactory.getMetricsDropdown = function(a, b, c) {
        for (var d = a.plan_id, e = c.binding_id, f = c.instance_id, g = _.sortBy(a.metrics, [ function(a) {
            return a.name;
        } ]), h = "", i = 0; i < g.length; i++) {
            var j = g[i].name, k = angular.equals(b, j), l = k ? "showIcon" : "hideIcon";
            h += '<li><a href="/manage/instances/' + f + "/bindings/" + e + "/metering/" + d + "/metrics/" + j + '">' + j + '<span class="glyphicon glyphicon-ok pull-right clickable ' + l + '"', 
            h += '"></span></a></a></li>';
        }
        return h;
    }, ResourceProviderFactory.getSampleFunctions = function() {
        return a.get("/components/templates.json");
    }, ResourceProviderFactory;
} ]);