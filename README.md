# WallDisplay Navbar Card

Die eigenständige Home-Assistant-Karte mit dem **originalen Navigations-Pill-Design** aus [Wall Display Dashboards](https://github.com/RapierXbox/walldisplay-dashboards) – ohne den Dashboard-Generator installieren zu müssen.

## Was übernommen wurde

- Originale Pill-Höhe von 56 px und Rundung von 28 px
- Originale Abstände, Schatten und Rahmen
- Originale vertikale Icon-/Text-Anordnung
- Originale 24-px-Icons und 14-px-Beschriftung
- Originale Hervorhebung des aktiven Eintrags
- Live-Anzeige für Media-Player und Klima-Entities (optional)

Die Navigationsdarstellung basiert auf dem Originalcode von Martin Czermin. Copyright- und MIT-Lizenzhinweise sind in der JavaScript-Datei und in `LICENSE` enthalten.

## Installation über HACS

1. Öffne **HACS → ⋮ → Benutzerdefinierte Repositories**.
2. Repository: `artur90226/walldisplay-navbar-card`
3. Kategorie: **Dashboard**
4. Repository hinzufügen und **WallDisplay Navbar Card** installieren.
5. Falls HACS die Ressource nicht automatisch registriert, füge sie unter **Einstellungen → Dashboards → Ressourcen** hinzu:
   - URL: `/hacsfiles/walldisplay-navbar-card/walldisplay-navbar-card.js`
   - Typ: **JavaScript-Modul**
6. Browser/Wall Display neu laden.

## Konfiguration

Füge die Karte in jede Dashboard-View ein, auf der die Navigation erscheinen soll:

```yaml
type: custom:walldisplay-navbar-card
items:
  - path: home
    label: Home
    icon: mdi:home
  - path: licht
    label: Licht
    icon: mdi:lightbulb-group
  - path: klima
    label: Klima
    icon: mdi:thermometer
  - path: mehr
    label: Mehr
    icon: mdi:dots-horizontal
```

Bei relativen Pfaden wie `home`, `licht` usw. wird das aktuelle Dashboard als Basis verwendet. Du kannst alternativ vollständige Pfade angeben, zum Beispiel `/wallpanel/home`.

## Optionale Funktionen

### Labels ausblenden

```yaml
type: custom:walldisplay-navbar-card
show_labels: false
items:
  - path: home
    icon: mdi:home
  - path: licht
    icon: mdi:lightbulb-group
```

### Temperatur auf dem Klima-Eintrag

```yaml
- path: klima
  label: Klima
  icon: mdi:thermometer
  entity: climate.wohnzimmer
``

Bei einer Klima-Entity wird – sofern verfügbar – die aktuelle Temperatur als Beschriftung angezeigt.

Du kannst auch einen beliebigen Temperatursensor verwenden:

```yaml
- path: klima
  label: Klima
  icon: mdi:thermometer
  temperature_entity: sensor.wohnzimmer_temperatur
```

### Media-Player-Status

```yaml
- path: media
  label: Media
  icon: mdi:play-circle
  entity: media_player.wohnzimmer
``

Während der Wiedergabe wird das Icon automatisch als aktiv markiert und auf `mdi:speaker-play` umgestellt.

## Eintragsoptionen

| Option | Beschreibung |
|---|---|
| `path` | Ziel-View; relativ zum aktuellen Dashboard oder als vollständiger Pfad |
| `label` | Beschriftung |
| `icon` | MDI-Icon, z. B. `mdi:home` |
| `title` | Optionaler Accessibility-Name |
| `entity` | Optionale Climate- oder Media-Player-Entity |
| `temperature_entity` | Optionaler Temperatursensor |
| `exact` | Bei `false` werden auch Unterpfade als aktiv erkannt |

## Allgemeine Optionen

| Option | Standard | Beschreibung |
|---|---|---|
| `items` | erforderlich | Navigationsziele |
| `position` | `bottom` | `bottom` oder `top` |
| `show_labels` | `true` | Beschriftungen anzeigen |

Das visuelle Styling folgt absichtlich dem Original-Pill-Design. Es ist kein separates Theme- oder Layout-System erforderlich.

## 480 × 480 Wall Display

Das Original-Pill-Layout verwendet 56 px Höhe und 76 px Breite pro Eintrag. Auf einem 480 × 480 Display sind vier kurze Navigationseinträge ein guter Ausgangspunkt. Die Karte wird in jede View eingefügt, auf der sie erscheinen soll.

## Lizenz

MIT – siehe [LICENSE](LICENSE). Das ursprüngliche Navigationsdesign und die übernommenen CSS-/Verhaltensanteile stammen aus Wall Display Dashboards von Martin Czermin.
