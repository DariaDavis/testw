(function () {
    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
      <style>
          fieldset {
              margin-bottom: 10px;
              border: 1px solid #afafaf;
              border-radius: 3px;
          }
          table {
              width: 100%;
          }
          input, textarea, select {
              font-family: "72",Arial,Helvetica,sans-serif;
              width: 100%;
              padding: 4px;
              box-sizing: border-box;
              border: 1px solid #bfbfbf;
          }
          input[type=checkbox] {
              width: inherit;
              margin: 6px 3px 6px 0;
              vertical-align: middle;
          }
      </style>
      <form id="form" autocomplete="off">
        <fieldset> 
          <legend>General</legend>
          <table>
            <tr>
              <td><label for="custValue">Выберите тип выгрузки</label></td>
              <td>
                <select id="widgetType">
                    <option value="t1">Загрузка Факт</option>
                    <option value="t2"/>Загрузка Excel - Budget|Forcast</option>
                    <option value="t3"/>Загрузка Excel</option>
                    <option value="t4"/>Расчет</option>
                </select>
              </td>
            </tr>
          </table>
        </fieldset>
        <button type="submit" hidden>Применить</button>
      </form>
    `;

    class CalcWidgetStyling extends HTMLElement {
        constructor() {
            super();
            this._shadowRoot = this.attachShadow({ mode: "open" });
            this._shadowRoot.appendChild(tmpl.content.cloneNode(true));

            let form = this._shadowRoot.getElementById("form");
            form.addEventListener("submit", this._submit.bind(this));
            form.addEventListener("change", this._change.bind(this));
        }

        connectedCallback() {
        }

        _submit(e) {
            e.preventDefault();
            let properties = {};
            for (let name of CalcWidgetStyling.observedAttributes) {
                properties[name] = this[name];
            }
            this._firePropertiesChanged(properties);
            return false;
        }
        _change(e) {
            this._changeProperty(e.target.name);
            let properties = {};
            for (let name of CalcWidgetStyling.observedAttributes) {
                properties[name] = this[name];
            }
            this._firePropertiesChanged(properties);
        }
        _changeProperty(name) {
            let properties = {};
            properties[name] = this[name];
            this._firePropertiesChanged(properties);
        }

        _firePropertiesChanged(properties) {
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: properties
                }
            }));
        }

        get widgetType() {
            return this.getValue("widgetType");
        }
        set widgetType(value) {
            this.setValue("widgetType", value);
        }

        getValue(id) {
            return this._shadowRoot.getElementById(id).value;
        }
        setValue(id, value) {
            this._shadowRoot.getElementById(id).value = value;
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
    customElements.define("t4data-sac-widget-calcwidgetstyling", CalcWidgetStyling);
})();