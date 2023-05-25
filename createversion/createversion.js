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
		<script 
				src="https://openui5.hana.ondemand.com/resources/sap-ui-core.js"
				data-sap-ui-libs="sap.m"
				data-sap-ui-xx-bindingSyntax="complex"
				data-sap-ui-theme="sap_belize"
				data-sap-ui-compatVersion="edge"
				data-sap-ui-preload="async"'>
			</script>      
    `;

	class CreateVersion extends HTMLElement {

		constructor() {
			super();

			_shadowRoot = this.attachShadow({
				mode: "open"
			});
			_shadowRoot.appendChild(oTmpl.content.cloneNode(true));

			_id = createGuid();
			this._export_settings = {};
			this._export_settings.custValue = "";

			this._firstConnection = 0;
			this._firstConnectionUI5 = 0;

			this._onDataSavedEvent = new Event("onDataSaved");
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

		_fireDataSaved() {			
			that.dispatchEvent(new CustomEvent("onDataSaved", {
				detail: {
					properties: {
					}
				}
			}));
		}

		get custValue() {
			return this._export_settings.custValue;
		}
		set custValue(value) {
			this._export_settings.custValue = value;
		}

		static get observedAttributes() {
			return [
				"custValue",
				"hierData"
			];
		}

		attributeChangedCallback(name, oldValue, newValue) {
			if (oldValue != newValue) {
				this[name] = newValue;
			}
		}

	}


	customElements.define("t4data-sac-widget-createversion", CreateVersion);


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

						
						sap.ui.getCore().getEventBus().publish("versionLoaded", data);

						that._firePropertiesChanged();
						that._fireDataSaved();

						this.settings = {};
						this.settings.sessionid = "";

						that.dispatchEvent(new CustomEvent("onClick", {
							detail: {
								settings: this.settings
							}
						}));
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
					
					<script id="createVersionView" name="createVersionView" type="sapui5/xmlview">
						<mvc:View
							controllerName="createVersion.Template"
							xmlns:mvc="sap.ui.core.mvc"
							xmlns:core="sap.ui.core" xmlns:form="sap.ui.layout.form"
							xmlns="sap.m">
							<VBox>
								<form:SimpleForm id="versionForm">								
									<form:toolbar>
										<Toolbar>
											<Title text="Добавить версию"/>
											<ToolbarSpacer />
											<Button text="Сохранить" enabled="{view>/isEnabledToSave}" press="onSaveVersionPress"/>
										</Toolbar>
									</form:toolbar>
									<Label text="Название версии" required="true"/>
									<Input value="{view>name}" valueLiveUpdate="true" liveChange="checkSavingEnabled"/>
									<Label text="Отчетный месяц" required="true"/>
									<DatePicker value="{view>date}" displayFormat="MM.y" change="checkSavingEnabled"/>
									<Label text="Тип версии" required="true"/>
										<Select selectedKey="{view>type}" forceSelection="false" change="checkSavingEnabled">
											<core:Item key="FORCAST" text="FORCAST"/>
											<core:Item key="ACTUAL" text="ACTUAL"/>
											<core:Item key="BUDGET" text="BUDGET"/>
										</Select>
									<Label text="Текст" required="true"/>
									<TextArea value="{view>description}" rows="2" valueLiveUpdate="true" liveChange="checkSavingEnabled"/>
								</form:SimpleForm>
							</VBox>							
						</mvc:View>
					</script>        
				`;


			_shadowRoot.appendChild(div0);
			// _shadowRoot.querySelector("#createVersionView").id = _id + "_createVersionView";

			that_.appendChild(content);
			var mapcanvas_divstr = _shadowRoot.getElementById("createVersionView");

			Ar.push({
				'id': "createVersionView",
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

						return Controller.extend("createVersion.Template", {

							onInit: function () {
								if (that._firstConnectionUI5 === 0) {
									that._firstConnectionUI5 = 1;

									let oViewModel = new JSONModel({
										isEnabledToSave: false,
										version: {
											name: null,
											date: null,
											type: null,
											description: null
										}
									});
									this.getView().setModel(oViewModel, "view");
									this.oViewModel = this.getView().getModel("view");
									this.oVersionForm = this.getView().byId("versionForm");
									this.oVersionForm.bindElement("view>/version");
									sap.ui.getCore().getEventBus().subscribe("versionLoaded", this.onVersionLoaded, this);
								}
							},

							onVersionLoaded: function (oResponse) {
								// if (oResponse.status === "OK") {									
									this.oViewModel.setProperty("/version", {
										name: null,
										date: null,
										type: null,
										description: null
									});
								// }
								// this.oVersionForm.setBusy(false);
							},

							checkSavingEnabled: function () {
								let oVersion = this.oViewModel.getProperty("/version");
								let bIsEnabled = oVersion.name && oVersion.date && oVersion.type && oVersion.description;
								this.oViewModel.setProperty("/isEnabledToSave", !!bIsEnabled);
							},

							formatDateToMMYYYY: function (sDate) {
								let sResult = "";
								let aDateProp = sDate.split("/");
								return `${aDateProp[1]}.${aDateProp[2]}`;
							},

							onSaveVersionPress: function (oEvent) {
								let oNewVersion = this.oViewModel.getProperty("/version");
								
								let bIsAbleToSave= oNewVersion.name && oNewVersion.date && oNewVersion.type && oNewVersion.description;
								if (bIsAbleToSave) {									
									oNewVersion.date = this.formatDateToMMYYYY(oNewVersion.date);
									// this.oVersionForm.setBusy(true);						
									ssocket.emit("cmd_create", {
										message: "createVersion",
										socketid: socketid,
										value: oNewVersion
									});						
								}		
							}

						});
					});

				var foundIndex = Ar.findIndex(x => x.id == "createVersionView");
				var divfinal = Ar[foundIndex].div;
				var oView = sap.ui.xmlview({
					viewContent: jQuery(divfinal).html(),
				});
				oView.placeAt(content);
				oCurrentView = oView;
			});
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