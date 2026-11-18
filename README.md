# WallDisplay Navbar Card

Eine kompakte, schwebende **Bottom-Navigation** für Home Assistant – gedacht für Wall Displays und kleine Displays wie 480 × 480 Pixel.

- Schwebende Leiste am unteren Bildschirmrand
- Aktive View wird automatisch hervorgehoben
- MDI-Icons und optionale Beschriftungen
- Eigene Ziele, Farben, Abstände und Größen
- Kein zusätzlicher Frontend-Abhängigkeiten

## Installation über HACS

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Repository eintragen: `artur90226/walldisplay-navbar-card`
3. Kategorie **Dashboard** auswählen und hinzufügen.
4. „WallDisplay Navbar Card“ installieren.
5. Falls HACS die Ressource nicht automatisch registriert, füge sie unter **Einstellungen → Dashboards → Ressourcen** hinzu:

   - URL: `/hacsfiles/walldisplay-navbar-card/walldisplay-navbar-card.js`
   - Ressourcentyp: **JavaScript-Modul**

6. Browser bzw. Wall Display neu laden.

## Einfaches Beispiel

Füge die Karte in jede Dashboard-View ein, in der die Navigation erscheinen soll:

```yaml
type: custom:walldisplay-navbar-card
items:
  - path: /wallpanel/start
    label: Start
    icon: mdi:home
  - path: /wallpanel/licht
    label: Licht
    icon: mdi:lightbulb-group
  - path: /wallpanel/klima
    label: Klima
    icon: mdi:thermometer
  - path: /wallpanel/mehr
    label: Mehr
    icon: mdi:dots-horizontal
```

**Wichtig:** Ersetze `/wallpanel/start` usw. durch die tatsächlichen URLs deiner Dashboard-Views. Die URL setzt sich aus Dashboard-Pfad und View-Pfad zusammen. Bei einem Dashboard unter `/lovelace` und einer View namens `home` lautet der Pfad beispielsweise `/lovelace/home`.

## Optionen

Alle Optionen sind optional, außer `items`.

```yaml
type: custom:walldisplay-navbar-card
position: bottom
bottom: 12px
show_labels: true
active_color: var(--primary-color)
inactive_color: var(--secondary-text-color)
background: rgba(25, 25, 32, 0.88)
border_radius: 28px
icon_size: 22px
font_size: 12px
height: 48px
gap: 4px
padding: 7px
max_width: calc(100vw - 24px)
items:
  - path: /wallpanel/start
    label: Start
    icon: mdi:home
```

| Option | Standard | Beschreibung |
|---|---|---|
| `items` | erforderlich | Liste der Navigationsziele |
| `position` | `bottom` | Position: `bottom` oder `top` |
| `bottom` | `16px` | Abstand zur unteren Kante; wird auch als Fallback für `top` verwendet |
| `top` | – | Optionaler Abstand zur oberen Kante, wenn `position: top` gesetzt ist |
| `show_labels` | `true` | Beschriftungen anzeigen |
| `active_color` | `var(--primary-color)` | Farbe des aktiven Eintrags |
| `inactive_color` | `var(--secondary-text-color)` | Farbe inaktiver Einträge |
| `background` | HA-Kartenhintergrund | Hintergrund der Navigationsleiste |
| `border_radius` | `28px` | Rundung der Leiste |
| `icon_size` | `22px` | Größe der Icons |
| `font_size` | `12px` | Schriftgröße der Beschriftungen |
| `height` | `48px` | Höhe der Navigationselemente |
| `gap` | `4px` | Abstand zwischen Elementen |
| `padding` | `7px` | Innenabstand der Leiste |
| `max_width` | `calc(100vw - 24px)` | Maximale Breite |

### Eintrag-Optionen

Jeder Eintrag in `items` unterstützt:

- `path` – Zielpfad der Dashboard-View
- `label` – angezeigter Text
- `icon` – MDI-Icon, z. B. `mdi:home`
- `title` – optionaler Tooltip/Accessibility-Name
- `exact` – standardmäßig wird nur die exakte View hervorgehoben. Mit `false` werden auch Unterpfade als aktiv erkannt.

## Hinweise für Wall Displays

- Die Leiste ist am Viewport fixiert und schwebt über dem Dashboard-Inhalt.
- Plane am unteren Rand etwas Platz ein, damit keine Schaltflächen verdeckt werden.
- Die Karte muss auf jeder View eingefügt werden, auf der sie sichtbar sein soll.
- Für ein 480 × 480 Display empfiehlt sich eine kurze Navigation mit drei bis vier Einträgen.

## Fehler melden

Bitte bei einem Fehler die Home-Assistant-Version, das Gerät bzw. den Browser und die verwendete YAML-Konfiguration angeben.

## Lizenz

MIT
