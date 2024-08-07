# Entwurf

Erste Demo https://astridx.github.io/tileserver-web/

## Vite mit Bootstrap 5 aufgesetzt
https://getbootstrap.com/docs/5.2/getting-started/vite/

## OpenLayers mit Swipe Module
- https://github.com/openlayers/ol-vite in angepasster Form.
- https://openlayers.org/en/latest/examples/layer-swipe.html

## Kontextmenu
https://github.com/jonataswalker/ol-contextmenu

## Favicon
https://www.npmjs.com/package/vite-plugin-favicons-inject

## Importdaten

Am Ende der Datei `ansibel_openstreetmap.de/roles/tile/templates/expire-tiles.j2`

```bash
psql -d osm -t -c "SELECT url, TO_CHAR(importdate, 'DD.MM.YYYY HH24:MI:SS TZ') FROM planet_osm_replication_status" > "$FILE"
psql -d osm -t -c "SELECT name, TO_CHAR(TO_DATE(last_modified, 'Dy, DD Mon YYYY HH24:MI:SS \"GMT\"'), 'DD.MM.YYYY') FROM external_data" >> "$FILE"
date "+Letzter Aufruf von 'Expire': %d.%m.%y %H:%M:%S (UTC)" >> "$FILE"
```

In diesem Repo in der Datei `osm-server/tileserver-web/src/js/main.js`

```js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/textimport/importdate.txt');
        const text = await response.text();
        document.getElementById('db-import-dates').innerText =
            text.trim().replace(/\n\n|\r/g, "; ").replace(/\n|\r/g, "; ").replace(/[\|]/g, "-");
    } catch (error) {
        console.error('Fehler beim Laden der Textdatei (/textimport/importdate.txt):', error);
    }
});
```