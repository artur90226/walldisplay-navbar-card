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
}



if (!customElements.get("walldisplay-navbar-card")) {
  customElements.define("walldisplay-navbar-card", WallDisplayNavbarCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "walldisplay-navbar-card")) {
  window.customCards.push({
    type: "walldisplay-navbar-card",
    name: "WallDisplay Navbar Card",
    description: "Standalone version of the original Wall Display Dashboards navigation pill.",
    preview: false,
    documentationURL: "https://github.com/artur90226/walldisplay-navbar-card",
  });
}
