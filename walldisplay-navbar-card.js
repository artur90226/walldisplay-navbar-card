/*
 * WallDisplay Navbar Card
 * Based on the navigation pill from Wall Display Dashboards.
 * Original project: https://github.com/RapierXbox/walldisplay-dashboards
 * Copyright (c) 2026 Martin Czermin
 * This derivative is distributed under the MIT License; see LICENSE.
 */

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

class WallDisplayNavbarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._sig = "";
    this._onLocation = () => setTimeout(() => this._markActive(), 0);
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.items) || config.items.length === 0) {
      throw new Error("walldisplay-navbar-card: 'items' muss eine Liste mit mindestens einem Eintrag sein.");
    }
    this._config = {
      position: "bottom",
      show_labels: true,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const sig = (this._config?.items || []).map((item) => {
      const st = item.entity && hass?.states?.[item.entity];
      const a = st?.attributes || {};
      const room = item.temperature_entity && hass?.states?.[item.temperature_entity];
      return [st?.state, a.current_temperature, a.temperature, a.hvac_action, room?.state].join("|");
    }).join(";");
    if (sig !== this._sig) {
      this._sig = sig;
      this._updateLive();
    }
  }

  connectedCallback() {
    window.addEventListener("location-changed", this._onLocation);
    window.addEventListener("popstate", this._onLocation);
    this._markActive();
  }

  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLocation);
    window.removeEventListener("popstate", this._onLocation);
  }

  getCardSize() { return 1; }
  getGridOptions() { return { columns: "full", rows: 1, min_rows: 1 }; }

  _currentPath() {
    return window.location.pathname.replace(/\/$/, "") || "/";
  }

  _isActive(item) {
    const current = this._currentPath();
    const target = String(item.path || "").replace(/\/$/, "") || "/";
    if (item.exact === false) return current === target || current.startsWith(target + "/");
    // Accept a full dashboard URL or just the view's final URL segment.
    return current === target || current.split("/").filter(Boolean).at(-1) === target.replace(/^\//, "");
  }

  _navigate(item) {
    if (!item?.path) return;
    let target = String(item.path);
    if (!target.startsWith("/")) {
      const dashboard = window.location.pathname.split("/").filter(Boolean)[0] || "lovelace";
      target = `/${dashboard}/${target}`;
    }
    if (this._hass && typeof this._hass.navigate === "function") {
      this._hass.navigate(target);
    } else {
      history.pushState(null, "", target);
      window.dispatchEvent(new CustomEvent("location-changed", {
        bubbles: true, composed: true, detail: { replace: false }
      }));
    }
    this._markActive();
  }

  _render() {
    if (!this._config) return;
    const items = this._config.items;
    const pill = document.createElement("nav");
    pill.className = "pill";
    pill.setAttribute("aria-label", this._config.aria_label || "Dashboard navigation");
    pill.style.width = `${items.length * 76 + 8}px`;
    pill.style.maxWidth = "100%";

    for (const [index, item] of items.entries()) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.index = String(index);
      btn.setAttribute("aria-label", item.title || item.label || item.path || "");
      btn._item = item;

      const wrap = document.createElement("span");
      wrap.className = "icon";
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", item.icon || "mdi:circle-medium");
      wrap.append(icon);

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = this._config.show_labels === false ? "" : (item.label || "");
      btn.append(wrap, label);

      btn.addEventListener("click", () => this._navigate(item));
      pill.append(btn);
    }

    const style = document.createElement("style");
    style.textContent = NAV_CSS;
    this.shadowRoot.replaceChildren(style, pill);
    this._markActive();
    this._updateLive();
  }

  _markActive() {
    this.shadowRoot.querySelectorAll("button").forEach((button) => {
      const active = this._isActive(button._item || {});
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  _formatNumber(value) {
    const fmt = this._hass?.locale?.number_format;
    const lang = this._hass?.locale?.language || this._hass?.language || navigator.language;
    const locale = { comma_decimal: "en-US", decimal_comma: "de", space_comma: "fr", system: undefined }[fmt] ?? lang;
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 1, useGrouping: fmt !== "none" }).format(value);
    } catch {
      return String(value);
    }
  }

  _updateLive() {
    const hass = this._hass;
    this.shadowRoot.querySelectorAll("button").forEach((button) => {
      const item = button._item || {};
      const st = item.entity && hass?.states?.[item.entity];
      const domain = (item.entity || "").split(".")[0];
      let label = item.label || "";
      const room = item.temperature_entity && hass?.states?.[item.temperature_entity];

      if (room && Number.isFinite(Number(room.state))) {
        label = `${this._formatNumber(Number(room.state))}°`;
      } else if (st && domain === "climate" && Number.isFinite(Number(st.attributes.current_temperature))) {
        label = `${this._formatNumber(Number(st.attributes.current_temperature))}°`;
      }

      const labelNode = button.querySelector(".label");
      if (labelNode) labelNode.textContent = this._config.show_labels === false ? "" : label;

      const playing = !!st && domain === "media_player" && st.state === "playing";
      button.classList.toggle("live", playing);
      button.querySelector("ha-icon")?.setAttribute("icon", playing ? "mdi:speaker-play" : (item.icon || "mdi:circle-medium"));

      let mode = "";
      if (st && domain === "climate") {
        const { hvac_action: action, current_temperature: current, temperature: target } = st.attributes;
        if (action === "heating" || (!action && st.state === "heat" && current < target)) mode = "heat";
        else if (action === "cooling" || (!action && st.state === "cool" && current > target)) mode = "cool";
      }
      button.classList.toggle("heat", mode === "heat");
      button.classList.toggle("cool", mode === "cool");
    });
  }
}

if (!customElements.get("walldisplay-navbar-card")) {
  customElements.define("walldisplay-navbar-card", WallDisplayNavbarCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "walldisplay-navbar-card")) {
  window.customCards.push({
    type: "walldisplay-navbar-card",
    name: "WallDisplay Navbar Card",
    description: "Original Wall Display Dashboards navigation pill as a standalone Lovelace card.",
    preview: true,
    documentationURL: "https://github.com/artur90226/walldisplay-navbar-card",
  });
}

console.info(
  "%c WALLDISPLAY-NAVBAR-CARD %c 1.1.0 ",
  "color: white; background: #6b4eff; font-weight: bold;",
  "color: #6b4eff; background: white; font-weight: bold;"
);
