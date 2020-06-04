sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./Popover1",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Popover1, Utilities, History) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.inventarioHiFi.controller.DetalleProducto", {
		handleRouteMatched: function(oEvent) {
			var sAppId = "App5eb38bcf48d24b7ca40dbc0f";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function(oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			if (!this.sContext) {
				this.sContext = "itemsSet('i01')";
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

		},
		_onLinkPress: function(oEvent) {

			var sPopoverName = "Popover1";
			this.mPopovers = this.mPopovers || {};
			var oPopover = this.mPopovers[sPopoverName];

			if (!oPopover) {
				oPopover = new Popover1(this.getView());
				this.mPopovers[sPopoverName] = oPopover;

				oPopover.getControl().setPlacement("Auto");

				// For navigation.
				oPopover.setRouter(this.oRouter);
			}

			var oSource = oEvent.getSource();

			oPopover.open(oSource);

		},
		_onLinkPress1: function() {
			return new Promise(function(fnResolve) {
				var sTargetPos = "center top";
				sTargetPos = (sTargetPos === "default") ? undefined : sTargetPos;
				sap.m.MessageToast.show("Código del producto", {
					onClose: fnResolve,
					duration: 0 || 3000,
					at: sTargetPos,
					my: sTargetPos
				});
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("ListaProductos", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet, sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}

		},
		applyFiltersAndSorters: function(sControlId, sAggregationName, chartBindingInfo) {
			if (chartBindingInfo) {
				var oBindingInfo = chartBindingInfo;
			} else {
				var oBindingInfo = this.getView().byId(sControlId).getBindingInfo(sAggregationName);
			}
			var oBindingOptions = this.updateBindingOptions(sControlId);
			this.getView().byId(sControlId).bindAggregation(sAggregationName, {
				model: oBindingInfo.model,
				path: oBindingInfo.path,
				parameters: oBindingInfo.parameters,
				template: oBindingInfo.template,
				templateShareable: true,
				sorter: oBindingOptions.sorters,
				filters: oBindingOptions.filters
			});

		},
		updateBindingOptions: function(sCollectionId, oBindingData, sSourceId) {
			this.mBindingOptions = this.mBindingOptions || {};
			this.mBindingOptions[sCollectionId] = this.mBindingOptions[sCollectionId] || {};

			var aSorters = this.mBindingOptions[sCollectionId].sorters;
			var aGroupby = this.mBindingOptions[sCollectionId].groupby;

			// If there is no oBindingData parameter, we just need the processed filters and sorters from this function
			if (oBindingData) {
				if (oBindingData.sorters) {
					aSorters = oBindingData.sorters;
				}
				if (oBindingData.groupby || oBindingData.groupby === null) {
					aGroupby = oBindingData.groupby;
				}
				// 1) Update the filters map for the given collection and source
				this.mBindingOptions[sCollectionId].sorters = aSorters;
				this.mBindingOptions[sCollectionId].groupby = aGroupby;
				this.mBindingOptions[sCollectionId].filters = this.mBindingOptions[sCollectionId].filters || {};
				this.mBindingOptions[sCollectionId].filters[sSourceId] = oBindingData.filters || [];
			}

			// 2) Reapply all the filters and sorters
			var aFilters = [];
			for (var key in this.mBindingOptions[sCollectionId].filters) {
				aFilters = aFilters.concat(this.mBindingOptions[sCollectionId].filters[key]);
			}

			// Add the groupby first in the sorters array
			if (aGroupby) {
				aSorters = aSorters ? aGroupby.concat(aSorters) : aGroupby;
			}

			var aFinalFilters = aFilters.length > 0 ? [new sap.ui.model.Filter(aFilters, true)] : undefined;
			return {
				filters: aFinalFilters,
				sorters: aSorters
			};

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("DetalleProducto").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

			var oView = this.getView(),
				oData = {},
				self = this;
			var oModel = new sap.ui.model.json.JSONModel();
			oView.setModel(oModel, "staticDataModel");
			self.oBindingParameters = {};

			oData["sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030"] = {};

			oData["sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030"]["data"] = [{
				"dim0": "India",
				"mea0": "296",
				"mea1": "220",
				"__id": 0
			}, {
				"dim0": "Canada",
				"mea0": "300",
				"mea1": "150",
				"__id": 1
			}, {
				"dim0": "USA",
				"mea0": "489",
				"mea1": "400",
				"__id": 2
			}, {
				"dim0": "Japan",
				"mea0": "400",
				"mea1": "270",
				"__id": 3
			}, {
				"dim0": "Germany",
				"mea0": "350",
				"mea1": "200",
				"__id": 4
			}];

			self.oBindingParameters['sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030'] = {
				"path": "ItemsANDQty",
				"parameters": {
					"entitySet": "itemsSet"
				}
			};

			oData["sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030"]["vizProperties"] = {
				"plotArea": {
					"dataLabel": {
						"visible": true,
						"hideWhenOverlap": true
					}
				}
			};

			oView.getModel("staticDataModel").setData(oData, true);

			function dateDimensionFormatter(oDimensionValue, sTextValue) {
				var oValueToFormat = sTextValue !== undefined ? sTextValue : oDimensionValue;
				if (oValueToFormat instanceof Date) {
					var oFormat = sap.ui.core.format.DateFormat.getDateInstance({
						style: "short"
					});
					return oFormat.format(oValueToFormat);
				}
				return oValueToFormat;
			}

			var aDimensions = oView.byId("sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030").getDimensions();
			aDimensions.forEach(function(oDimension) {
				oDimension.setTextFormatter(dateDimensionFormatter);
			});

		},
		onAfterRendering: function() {

			var oChart,
				self = this,
				oBindingParameters = this.oBindingParameters,
				oView = this.getView();

			oView.getModel(undefined).getMetaModel().loaded().then(function() {
				oChart = oView.byId("sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030");
				var oParameters = oBindingParameters['sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030'];

				oChart.bindData(oBindingParameters['sap_uxap_ObjectPageLayout_0-sections-sap_uxap_ObjectPageSection-3-subSections-sap_uxap_ObjectPageSubSection-1-blocks-sap_chart_CombinedChart-1588860073030']);

			});

		}
	});
}, /* bExport= */ true);
