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

sudo -u _tirex psql -d osm -t -c "SELECT url, TO_CHAR(importdate,'dd.mm.yyyy hh:mm') FROM planet_osm_replication_status" > /srv/tile/site/importdate.txt
sudo -u _tirex psql -d osm -t -c "SELECT name, TO_CHAR(TO_DATE(last_modified, 'Dy, DD Mon YYYY HH24:MI:SS "GMT"'), 'dd.mm.yyyy') FROM external_data" >> /srv/tile/site/importdate.txt
cat /srv/tile/site/importdate.txt
