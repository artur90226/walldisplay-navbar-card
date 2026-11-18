/*
 * WallDisplay Navbar Card
 * A compact, responsive bottom navigation pill for Home Assistant.
 * https://github.com/artur90226/walldisplay-navbar-card
 */
const DEFAULT_ITEMS = [
  { label: "Home", icon: "mdi:home", path: "/lovelace/0" },
  { label: "Licht", icon: "mdi:lightbulb-group", path: "/lovelace/lichter" },
  { label: "Klima", icon: "mdi:thermometer", path: "/lovelace/klima" },
  { label: "Mehr", icon: "mdi:dots-horizontal", path: "/lovelace/mehr" },
];

class WallDisplayNavbarCard extends HTMLElement {
  static get observedAttributes() { return ["hass"]; }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._currentPath = this._readPath();
    this._onLocationChanged = () => {
      this._currentPath = this._readPath();
      this._render();
    };
  }

  setConfig(config) {
    if (!config || !Array.isArray(config.items) || config.items.length === 0) {
      throw new Error(
        "Bitte mindestens ein Element unter 'items' konfigurieren. Siehe README."
      );
    }
    this._config = {
      position: "bottom",
      show_labels: true,
      active_color: "var(--primary-color)",
      inactive_color: "var(--secondary-text-color)",
      background: "var(--ha-card-background, var(--card-background-color, #202124))",
      border_radius: "28px",
      bottom: "16px",
      max_width: "calc(100vw - 24px)",
      icon_size: "22px",
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    window.addEventListener("location-changed", this._onLocationChanged);
    window.addEventListener("popstate", this._onLocationChanged);
    this._currentPath = this._readPath();
    this._render();
  }

  disconnectedCallback() {
    window.removeEventListener("location-changed", this._onLocationChanged);
    window.removeEventListener("popstate", this._onLocationChanged);
  }

  _readPath() {
    return window.location.pathname + window.location.search;
  }

  _isActive(item) {
    const current = this._currentPath.split("?")[0].replace(/\/$/, "") || "/";
    const target = String(item.path || "").split("?")[0].replace(/\/$/, "") || "/";
    if (item.exact === false) return current === target || current.startsWith(target + "/");
    return current === target;
  }

  _navigate(item) {
    if (!item.path) return;
    if (this._hass && typeof this._hass.navigate === "function") {
      this._hass.navigate(item.path);
    } else {
      window.history.pushState(null, "", item.path);
      window.dispatchEvent(new Event("location-changed"));
    }
    this._currentPath = this._readPath();
    this._render();
  }

  _render() {
    if (!this.shadowRoot || !this._config) return;
    const c = this._config;
    const items = c.items || DEFAULT_ITEMS;
    const position = c.position === "top" ? "top" : "bottom";
    const labelMode = c.show_labels !== false;
    const style = `
      :host {
        display: block;
        position: fixed;
        ${position}: ${c[position] || c.bottom || "16px"};
        left: 50%;
        transform: translateX(-50%);
        z-index: 5;
        width: max-content;
        max-width: ${c.max_width};
        pointer-events: none;
        contain: layout style;
      }
      * { box-sizing: border-box; }
      .nav {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: ${c.gap || "4px"};
        width: max-content;
        max-width: 100%;
        padding: ${c.padding || "7px"};
        border-radius: ${c.border_radius};
        background: ${c.background};
        border: ${c.border || "1px solid var(--divider-color, rgba(255,255,255,.10))"};
        box-shadow: ${c.box_shadow || "0 5px 22px rgba(0,0,0,.28)"};
        -webkit-backdrop-filter: blur(18px);
        backdrop-filter: blur(18px);
        pointer-events: auto;
        overflow-x: auto;
        scrollbar-width: none;
      }
      .nav::-webkit-scrollbar { display: none; }
      button {
        appearance: none;
        border: 0;
        background: transparent;
        color: ${c.inactive_color};
        border-radius: 22px;
        min-width: ${labelMode ? "62px" : "46px"};
        min-height: ${c.height || "48px"};
        padding: ${labelMode ? "6px 10px" : "8px"};
        display: flex;
        flex: 0 0 auto;
        flex-direction: ${labelMode ? "row" : "column"};
        align-items: center;
        justify-content: center;
        gap: ${labelMode ? "7px" : "2px"};
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: background .18s ease, color .18s ease, transform .18s ease;
      }
      button:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }
      button:active { transform: scale(.94); }
      button.active {
        color: ${c.active_color};
        background: ${c.active_background || "color-mix(in srgb, var(--primary-color) 16%, transparent)"};
      }
      ha-icon { --mdc-icon-size: ${c.icon_size}; }
      .label {
        font-size: ${c.font_size || "12px"};
        line-height: 1;
        font-weight: 600;
        white-space: nowrap;
      }
      @media (max-width: 380px) {
        button { min-width: 44px; padding-left: 8px; padding-right: 8px; }
        .label { font-size: 10px; }
      }
    `;
    const buttons = items.map((item, index) => {
      const active = this._isActive(item);
      const icon = item.icon || "mdi:circle";
      const label = item.label || "";
      const title = item.title || label || `Navigation ${index + 1}`;
      return `
        <button class="${active ? "active" : ""}" data-index="${index}"
          aria-label="${this._escape(title)}" aria-current="${active ? "page" : "false"}"
          title="${this._escape(title)}">
          <ha-icon icon="${this._escape(icon)}"></ha-icon>
          ${labelMode && label ? `<span class="label">${this._escape(label)}</span>` : ""}
        </button>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${style}</style>
      <nav class="nav" aria-label="${this._escape(c.aria_label || "Hauptnavigation")}">${buttons}</nav>
    `;
    this.shadowRoot.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => this._navigate(items[Number(button.dataset.index)]));
    });
  }

  _escape(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  getCardSize() { return 1; }
  getGridOptions() { return { columns: 12, min_columns: 1, rows: 1, min_rows: 1 }; }
}

if (!customElements.get("walldisplay-navbar-card")) {
  customElements.define("walldisplay-navbar-card", WallDisplayNavbarCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "walldisplay-navbar-card",
  name: "WallDisplay Navbar Card",
  description: "Kompakte, schwebende Bottom-Navigation für Home Assistant Wall Displays.",
  preview: true,
});

console.info(
  "%c WALLDISPLAY-NAVBAR-CARD %c 1.0.0 ",
  "color: white; background: #6b4eff; font-weight: bold;",
  "color: #6b4eff; background: white; font-weight: bold;"
);
