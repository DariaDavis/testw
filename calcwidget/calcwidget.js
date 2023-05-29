(function () {
	let _shadowRoot;

	let Ar = [];
	let _id;
	let oTmpl = document.createElement("template");
	let oCurrentView;
	let ssocket;
	let socketid;

	oTmpl.innerHTML = `
      <style>
      </style>	    
    `;

	class CalcWidget extends HTMLElement {

		constructor() {
			super();

			_shadowRoot = this.attachShadow({
				mode: "open"
			});
			_shadowRoot.appendChild(oTmpl.content.cloneNode(true));

			_id = createGuid();
			this._export_settings = {};
			this._export_settings.widgetType = "";

			this._firstConnection = 0;
			this._firstConnectionUI5 = 0;

			this._onProcedureHandledEvent = new Event("onProcedureHandled");
		}

		connectedCallback() {
			try {
				if (window.commonApp) {
					let outlineContainer = commonApp.getShell().findElements(true, oElement => {
						oElement.hasStyleClass && oElement.hasStyleClass("sapAppBuildingOutline")
					}
					)[0];

					if (outlineContainer && outlineContainer.getReactProps) {
						let parseReactState = state => {
							let components = {};

							let globalState = state.globalState;
							let instances = globalState.instances;
							let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
							let names = app.names;

							for (let key in names) {
								let name = names[key];

								let obj = JSON.parse(key).pop();
								let type = Object.keys(obj)[0];
								let id = obj[type];

								components[id] = {
									type: type,
									name: name
								};
							}

							for (let componentId in components) {
								let component = components[componentId];
							}

							let metadata = JSON.stringify({
								components: components,
								vars: app.globalVars
							});

							if (metadata != this.metadata) {
								this.metadata = metadata;

								this.dispatchEvent(new CustomEvent("propertiesChanged", {
									detail: {
										properties: {
											metadata: metadata
										}
									}
								}));
							}
						};

						let subscribeReactStore = store => {
							this._subscription = store.subscribe({
								effect: state => {
									parseReactState(state);
									return {
										result: 1
									};
								}
							});
						};

						let props = outlineContainer.getReactProps();
						if (props) {
							subscribeReactStore(props.store);
						} else {
							let oldRenderReactComponent = outlineContainer.renderReactComponent;
							outlineContainer.renderReactComponent = e => {
								let props = outlineContainer.getReactProps();
								subscribeReactStore(props.store);

								oldRenderReactComponent.call(outlineContainer, e);
							}
						}
					}
				}
			} catch (e) { }
		}

		disconnectedCallback() {
			if (this._subscription) {
				this._subscription();
				this._subscription = null;
			}
		}

		onCustomWidgetBeforeUpdate(changedProperties) {
			if ("designMode" in changedProperties) {
				this._designMode = changedProperties["designMode"];
			}
		}

		onCustomWidgetAfterUpdate(changedProperties) {
			var that = this;
			loadthis(that, changedProperties);
		}

		_renderExportButton() {
			let components = this.metadata ? JSON.parse(this.metadata)["components"] : {};
		}

		_firePropertiesChanged() {
			this.dispatchEvent(new CustomEvent("propertiesChanged", {
				detail: {
					properties: {
					}
				}
			}));
		}

		_fireProcedureHandled() {
			var oEvent = new Event("onProcedureHandled");
			this.dispatchEvent(oEvent);
		}

		get widgetType() {
			return this._export_settings.widgetType;
		}
		set widgetType(value) {
			this._export_settings.widgetType = value;
		}

		static get observedAttributes() {
			return [
				"widgetType"
			];
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (oldValue != newValue) {
				this[name] = newValue;
			}
		}

	}


	customElements.define("t4data-sac-widget-calcwidget", CalcWidget);


	function loadthis(that, changedProperties, mode) {
		if (that._firstConnection === 0) {

			let socketiojs = "https://dariadavis.github.io/testw/socket.io.js";
			let socketurl = "http://localhost:3090";

			async function LoadLibs() {
				try {
					await loadScript(socketiojs, _shadowRoot);
				} catch (e) {
					alert(e);
				} finally {
					//Socket Connection
					//****************************************** 
					ssocket = io(socketurl, {
						withCredentials: true,
						transportOptions: {
							polling: {
								extraHeaders: {
									"my-custom-header": "abcd"
								}
							}
						}
					});

					ssocket.on('disconnect', function () {
						console.log("socket disconnected: " + socketid);
						UI5(changedProperties, that, "");
					});

					ssocket.on('connect', function () {
						socketid = ssocket.id;
						console.log("socket connected: " + socketid);
						UI5(changedProperties, that, "msg");
					});

					ssocket.on('cmd_req_srv', function (data) {
						_message = data.status;
						console.log('Message from server: ' + _message);

						UI5(changedProperties, that, "msg");


						sap.ui.getCore().getEventBus().publish("procedureCompleted", "ui5", data);

						that._firePropertiesChanged();
						that._fireProcedureHandled();

						this.settings = {};
						this.settings.sessionid = "";
					});

					that._firstConnection = 1;
				}
			}
			LoadLibs();
		}

		UI5(changedProperties, that, "");
		that._renderExportButton();
	}

	function UI5(changedProperties, that, mode) {
		var that_ = that;
		let content = document.createElement('div');
		//widgetName = that._export_settings.name;
		content.slot = "content";		
		if (that._firstConnectionUI5 === 0) {

			let div0 = document.createElement('div');

			div0.innerHTML = `
					<?xml version="1.0"?>
					<div id="ui5_content" name="ui5_content">				 
					<slot name="content">
					<script id="sap-ui-bootstrap"
						src="https://openui5.hana.ondemand.com/resources/sap-ui-core.js"
						data-sap-ui-libs="sap.m"
						data-sap-ui-xx-bindingSyntax="complex"
						data-sap-ui-theme="sap_belize"
						data-sap-ui-compatVersion="edge"
						data-sap-ui-preload="async"'>
					</script></slot>
					</div>
					
					<script id="calcWidgetView" name="calcWidgetView" type="sapui5/xmlview">
						<mvc:View
							controllerName="calcWidget.Template"
							xmlns:mvc="sap.ui.core.mvc"
							xmlns:core="sap.ui.core"
							xmlns="sap.m">
							<HBox>
								<VBox>
									<DatePicker id="idDate" displayFormat="MM.y" visible="false" width="200px"/>
									<Select id="idSelectVersion" forceSelection="false" visible="false" width="200px">
										<core:Item key="{view>name}" text="{view>name}"/>
									</Select>
								</VBox>
								<Button id="idButton" text="Выберите тип" press="onRunProcedurePressed" type="Ghost" class="sapUiSmallMarginBegin"/>
							</HBox>							
						</mvc:View>
					</script>        
				`;


			_shadowRoot.appendChild(div0);

			that_.appendChild(content);
			var mapcanvas_divstr = _shadowRoot.getElementById("calcWidgetView");

			Ar.push({
				'id': _id + "calcWidgetView",
				'div': mapcanvas_divstr
			});
			console.log(Ar);



			sap.ui.getCore().attachInit(function () {
				"use strict";

				//### Controller ###

				sap.ui.define([
					"sap/ui/core/mvc/Controller",
					"sap/ui/model/json/JSONModel"
				],
					function (Controller, JSONModel) {
						"use strict";

						return Controller.extend("calcWidget.Template", {

							onInit: function () {
								if (that._firstConnectionUI5 === 0) {
									that._firstConnectionUI5 = 1;
									let oViewModel = new JSONModel({
										widgetType: that._export_settings.widgetType,
										versions: []
									});
									this.getView().setModel(oViewModel, "view");
									this.oViewModel = this.getView().getModel("view");
									this.oDatePicker = this.getView().byId("idDate");
									this.oSelectVerion = this.getView().byId("idSelectVersion");
									this.oButton = this.getView().byId("idButton");

									if (that._export_settings.widgetType) {										
										this.prepareWidgetByType(that._export_settings.widgetType);
									}

									sap.ui.getCore().getEventBus().subscribe("procedureCompleted", "ui5", this.onProcedureCompleted, this);
									sap.ui.getCore().getEventBus().subscribe("typeChanged", "ui5", this.prepareWidgetByType, this);
								}
							},

							getVersions: function () {
								ssocket.emit("cmd_req_version", {
									message: "requestVersion",
									socketid: socketid
								});
							},

							prepareWidgetByType: function () {
								const sType = that._export_settings.widgetType;
								let sName = "";
								let bShowDP = true;
								switch (sType) {
									case "t1":
										sName = "Загрузка Факт";
										break;
									case "t2":
										sName = "Загрузка Excel - Budget|Forcast";
										bShowDP = false;
										// this.getVersions();
										break;
									case "t3":
										sName = "Загрузка Excel";
										break;
									case "t4":
										sName = "Расчет";
										bShowDP = false;
										// this.getVersions();
										break;
									default:
										break;
								}
								this.oDatePicker.setVisible(bShowDP);
								this.oSelectVerion.setVisible(!bShowDP);
								this.oButton.setText(sName);
							},

							onProcedureCompleted: function (sEventName, sChannel, oResponse) {								
								if (oResponse.status === "error") {
									sap.m.MessageBox.error.show("Произошла ошибка при выполнении процедуры");
									return;
								}
								if (oResponse.procName === "requestVersion") {
									this.setVersions(oResponse.data);
								}
							},

							onRunProcedurePressed: function (oEvent) {
								const sWidgetType = this.oViewModel.getProperty("/widgetType");
								let sProcName = "";
								let oPayload = {};

								switch (sWidgetType) {
									case "t1":
										sProcName = "cmd_req_fact";
										oPayload.date = this.formatDateToMMYYYY(this.oDatePicker.getValue());
										break;
									case "t2":
										sProcName = "cmd_req_ex_t";
										oPayload.version = this.oSelectVerion.getSelectedKey();
										break;
									case "t3":
										sProcName = "cmd_req_ex";
										oPayload.date = this.formatDateToMMYYYY(this.oDatePicker.getValue());
										break;
									case "t4":
										sProcName = "cmd_req_calc";
										oPayload.version = this.oSelectVerion.getSelectedKey();
										break;
									default:
										break;
								}

								ssocket.emit(sProcName, {
									message: "loadProccess",
									socketid: socketid,									
									value: oPayload
								});
							},

							formatDateToMMYYYY: function (sDate) {
								let sResult = "";
								let aDateProp = sDate.split("/");
								return `${aDateProp[1]}.${aDateProp[2]}`;
							}
						});
					});

				var foundIndex = Ar.findIndex(x => x.id == _id + "calcWidgetView");
				var divfinal = Ar[foundIndex].div;
				var oView = sap.ui.xmlview({
					viewContent: jQuery(divfinal).html(),
				});
				oView.placeAt(content);
				oCurrentView = oView;
			});
		} else if (changedProperties.widgetType) {
			
			sap.ui.getCore().getEventBus().publish("typeChanged", "ui5", changedProperties);

		}

	}

	function createGuid() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
			let r = Math.random() * 16 | 0,
				v = c === "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	}

	function loadScript(src, shadowRoot) {
		return new Promise(function (resolve, reject) {
			let script = document.createElement('script');
			script.src = src;

			script.onload = () => {
				console.log("Load: " + src);
				resolve(script);
			}
			script.onerror = () => reject(new Error(`Script load error for ${src}`));

			shadowRoot.appendChild(script)
		});
	}
})();