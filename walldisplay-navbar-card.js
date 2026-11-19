/*
 * Standalone wrapper for the original Wall Display Dashboards navigation card.
 * Original source: https://github.com/RapierXbox/walldisplay-dashboards
 * Original author/copyright: Martin Czermin
 * Licensed under MIT; see LICENSE.
 */

function navigate(path) {
  if (location.pathname === path) return;
  history.pushState(null, "", path);
  window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true, detail: { replace: false } }));
}

const NAV_CSS = `
:host { display: block; height: 100%; }
.pill { box-sizing: border-box; display: flex; height: 56px; max-width: 100%; margin: 0 auto; padding: 4px;
  border-radius: 28px; background: var(--ha-card-background, var(--card-background-color, #fff));
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2), 0 6px 20px rgba(0, 0, 0, 0.18); border: 1px solid rgba(127, 127, 127, 0.25); }
button { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2px; padding: 0 4px; border: 0; border-radius: 24px; background: none; font: inherit; cursor: pointer;
  color: var(--secondary-text-color); -webkit-tap-highlight-color: transparent; outline: none; }
button:focus-visible { box-shadow: 0 0 0 2px var(--primary-color) inset; }
ha-icon { --mdc-icon-size: 24px; color: var(--secondary-text-color); }
.icon { display: flex; }
.label { max-width: 100%; font-size: 14px; line-height: 16px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
button.active { background: color-mix(in srgb, var(--primary-color) 20%, transparent); color: var(--primary-color); }
button.active .label { font-weight: 700; }
button.active ha-icon { color: var(--primary-color); }
.live ha-icon { color: var(--state-media_player-active-color, #03a9f4); }
.heat ha-icon { color: var(--state-climate-heat-color, #ff5722); }
.cool ha-icon { color: var(--state-climate-cool-color, #2196f3); }
button.active.live ha-icon, button.active.heat ha-icon, button.active.cool ha-icon { color: var(--primary-color); }`;

// Number formatting that follows the user's HA number-format setting.
function formatNumber(value, hass) {
  const fmt = hass?.locale?.number_format;
  const lang = hass?.locale?.language || hass?.language || navigator.language;
  const locale = { comma_decimal: "en-US", decimal_comma: "de", space_comma: "fr", system: undefined }[fmt] ?? lang;
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 1, useGrouping: fmt !== "none" }).format(value);
  } catch {
    return String(value);
  }
}

class WallDisplayNavbarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._onLocation = () => setTimeout(() => this._markActive(), 0);
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.items)) throw new Error("walldisplay-navbar-card: `items` must be a list");
    this._config = config;
    this._render();
  }

  // Re-render only when an entity shown in the pill changes.
  set hass(hass) {
    this._hass = hass;
    const sig = (this._config?.items || []).map((i) => {
      const st = i.entity && hass?.states?.[i.entity];
      const a = st?.attributes || {};
      const room = i.temperature_entity && hass?.states?.[i.temperature_entity];
      const live = st ? `${st.state}|${a.current_temperature}|${a.temperature}|${a.hvac_action}` : "";
      return room ? `${live}|${room.state}` : live;
    }).join(";");
    if (sig !== this._sig) {
      this._sig = sig;
      this._updateLive();
    }
  }

  getCardSize() { return 1; }
  getGridOptions() { return { columns: "full", rows: 1, min_rows: 1 }; }

  connectedCallback() {
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
    this._markActive();
  }

  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
  }

  _render() {
    const items = this._config.items;
    const pill = document.createElement("nav");
    pill.className = "pill";
    pill.style.width = `${items.length * 76 + 8}px`; // 76 px per item + 2 × 4 px padding (contracts.md)
    for (const item of items) {
      const btn = document.createElement("button");
      btn.dataset.path = String(item.path || "");
      btn.setAttribute("aria-label", item.label || item.path || "");
      btn._item = item;
      const wrap = document.createElement("span");
      wrap.className = "icon";
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", item.icon || "mdi:circle-medium");
      wrap.append(icon);
      const label = document.createElement("span");
      label.className = "label";
      label.textContent = item.label || "";
      btn.append(wrap, label);
      btn.addEventListener("click", () => {
        navigate(`/${location.pathname.split("/")[1]}/${btn.dataset.path}`);
        this._markActive();
      });
      pill.append(btn);
    }
    const style = document.createElement("style");
    style.textContent = NAV_CSS;
    this.shadowRoot.replaceChildren(style, pill);
    this._markActive();
    this._updateLive();
  }

  // Climate items show the current temperature as label; media players glow while playing.
  _updateLive() {
    const hass = this._hass;
    this.shadowRoot.querySelectorAll("button").forEach((b) => {
      const item = b._item || {};
      const st = item.entity && hass?.states?.[item.entity];
      const domain = (item.entity || "").split(".")[0];
      let text = item.label || "";
      const room = item.temperature_entity && hass?.states?.[item.temperature_entity];
      if (room) {
        const t = Number(room.state);
        if (room.state !== "" && Number.isFinite(t)) text = `${formatNumber(t, hass)}°`;
      } else if (st && domain === "climate") {
        const t = Number(st.attributes.current_temperature);
        if (st.attributes.current_temperature != null && Number.isFinite(t)) text = `${formatNumber(t, hass)}°`;
      }
      b.querySelector(".label").textContent = text;
      // Playing: speaker-play icon in the media colour (not colour-only). Climate: heat/cool tint.
      const playing = !!st && domain === "media_player" && st.state === "playing";
      b.classList.toggle("live", playing);
      b.querySelector("ha-icon").setAttribute("icon", playing ? "mdi:speaker-play" : item.icon || "mdi:circle-medium");
      let mode = "";
      if (st && domain === "climate") {
        const { hvac_action: action, current_temperature: cur, temperature: target } = st.attributes;
        if (action === "heating" || (!action && st.state === "heat" && cur < target)) mode = "heat";
        else if (action === "cooling" || (!action && st.state === "cool" && cur > target)) mode = "cool";
      }
      b.classList.toggle("heat", mode === "heat");
      b.classList.toggle("cool", mode === "cool");
    });
  }

  _markActive() {
    const parts = location.pathname.split("/").filter(Boolean);
    const current = parts.length > 1 ? parts[parts.length - 1] : "home";
    this.shadowRoot.querySelectorAll("button").forEach((b) => {
      const on = b.dataset.path === current;
      b.classList.toggle("active", on);
      b.setAttribute("aria-current", on ? "page" : "false");
    });
  }

  static getConfigElement() {
    return document.createElement("walldisplay-navbar-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:walldisplay-navbar-card",
      items: [
        { path: "home", label: "Start", icon: "mdi:home" },
        { path: "climate", label: "Klima", icon: "mdi:thermostat" },
      ],
    };
  }
}





// Visual Lovelace editor. The card itself continues to use the upstream
// WallDisplayNav rendering and styling without modifications.
class WallDisplayNavbarCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = { items: [] };
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = {
      ...config,
      items: Array.isArray(config.items) ? config.items.map((item) => ({ ...item })) : [],
    };
    this._renderEditor();
  }

  _emitConfig() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: { ...this._config, items: this._config.items.map((item) => ({ ...item })) } },
    }));
  }

  _field(label, value, key, index, placeholder = "") {
    const wrap = document.createElement("label");
    wrap.className = "field";
    const caption = document.createElement("span");
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "editor-input";
    input.value = value || "";
    input.placeholder = placeholder;
    input.autocomplete = "off";
    input.spellcheck = false;
    input.setAttribute("aria-label", label);
    input.addEventListener("input", () => {
      this._config.items[index][key] = input.value;
      this._emitConfig();
    });
    wrap.append(caption, input);
    return wrap;
  }

  _button(text, title, action, disabled = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.title = title;
    button.disabled = disabled;
    button.addEventListener("click", action);
    return button;
  }

  _renderEditor() {
    const style = document.createElement("style");
    style.textContent = `
      :host { display:block; color:var(--primary-text-color); }
      .intro { color:var(--secondary-text-color); margin:0 0 12px; }
      .item { border:1px solid var(--divider-color); border-radius:12px; padding:12px; margin:0 0 12px; }
      .item-head { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
      .item-title { flex:1; font-weight:600; }
      .fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .field { display:flex; flex-direction:column; gap:5px; min-width:0; }
      .field span { font-size:12px; color:var(--secondary-text-color); }
      .editor-input {
        box-sizing:border-box; width:100%; min-width:0; height:42px; padding:0 10px;
        border:1px solid var(--input-idle-line-color, var(--divider-color));
        border-radius:6px; background:var(--input-fill-color, var(--card-background-color));
        color:var(--primary-text-color); font:inherit; font-size:14px;
        outline:none; pointer-events:auto; user-select:text; -webkit-user-select:text;
      }
      .editor-input:focus { border-color:var(--primary-color); box-shadow:0 0 0 1px var(--primary-color); }
      .editor-input::placeholder { color:var(--secondary-text-color); opacity:.8; }
      .actions { display:flex; gap:6px; }
      button { border:1px solid var(--divider-color); background:var(--secondary-background-color); color:var(--primary-text-color); border-radius:8px; padding:7px 11px; cursor:pointer; }
      button[disabled] { opacity:.35; cursor:default; }
      .add { background:var(--primary-color); color:var(--text-primary-color,#fff); border:0; padding:10px 14px; font-weight:600; }
      .footer { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-top:14px; flex-wrap:wrap; }
      .hint { color:var(--secondary-text-color); font-size:12px; }
      @media(max-width:480px) { .fields { grid-template-columns:1fr; } }
    `;

    const root = document.createElement("div");
    const intro = document.createElement("p");
    intro.className = "intro";
    intro.textContent = "Konfiguriere die Einträge deiner WallDisplay-Navigation.";
    root.append(intro);

    this._config.items.forEach((item, index) => {
      const card = document.createElement("section");
      card.className = "item";
      const head = document.createElement("div");
      head.className = "item-head";
      const title = document.createElement("div");
      title.className = "item-title";
      title.textContent = `Navigation ${index + 1}`;
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        this._button("↑", "Nach oben", () => this._move(index, -1), index === 0),
        this._button("↓", "Nach unten", () => this._move(index, 1), index === this._config.items.length - 1),
        this._button("✕", "Eintrag löschen", () => this._remove(index))
      );
      head.append(title, actions);
      const fields = document.createElement("div");
      fields.className = "fields";
      fields.append(
        this._field("View-Pfad", item.path, "path", index, "z. B. home oder climate"),
        this._field("Beschriftung", item.label, "label", index, "z. B. Start"),
        this._field("Icon (MDI)", item.icon, "icon", index, "mdi:home"),
        this._field("Entity (optional)", item.entity, "entity", index, "climate.wohnzimmer"),
        this._field("Temperatursensor (optional)", item.temperature_entity, "temperature_entity", index, "sensor.wohnzimmer_temperatur")
      );
      card.append(head, fields);
      root.append(card);
    });

    const footer = document.createElement("div");
    footer.className = "footer";
    footer.append(
      this._button("+ Navigation hinzufügen", "Neuen Navigationseintrag hinzufügen", () => this._add(), false)
    );
    footer.lastChild.classList.add("add");
    const hint = document.createElement("span");
    hint.className = "hint";
    hint.textContent = "Pfade sind View-IDs, z. B. home oder climate.";
    footer.append(hint);
    root.append(footer);
    this.shadowRoot.replaceChildren(style, root);
  }

  _add() {
    this._config.items.push({ path: "home", label: "Neu", icon: "mdi:circle" });
    this._renderEditor();
    this._emitConfig();
  }

  _remove(index) {
    this._config.items.splice(index, 1);
    this._renderEditor();
    this._emitConfig();
  }

  _move(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= this._config.items.length) return;
    const [item] = this._config.items.splice(index, 1);
    this._config.items.splice(target, 0, item);
    this._renderEditor();
    this._emitConfig();
  }
}

if (!customElements.get("walldisplay-navbar-card-editor")) {
  customElements.define("walldisplay-navbar-card-editor", WallDisplayNavbarCardEditor);
}

if (!customElements.get("walldisplay-navbar-card")) {
  customElements.define("walldisplay-navbar-card", WallDisplayNavbarCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "walldisplay-navbar-card")) {
  window.customCards.push({
    type: "walldisplay-navbar-card",
    name: "WallDisplay Navbar Card (Alpha)",
    description: "ALPHA — Standalone version of the original Wall Display Dashboards navigation pill.",
    preview: false,
    documentationURL: "https://github.com/artur90226/walldisplay-navbar-card",
  });
}
