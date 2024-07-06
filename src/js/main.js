import '../scss/styles.scss';
import * as helper from './helpers';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ.js';
import { fromLonLat } from 'ol/proj.js';
import { getRenderPixel } from 'ol/render';
import ContextMenu from 'ol-contextmenu';
import Link from 'ol/interaction/Link.js';
import imgUrl from '../images/osm_logo.png'
import { FullScreen, Control, defaults as defaultControls } from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { circular } from 'ol/geom/Polygon';


const HOSTNAME = import.meta.env.VITE_HOSTNAME || 'tile';
const OSML10N_VERSION = import.meta.env.VITE_OSML10N_VERSION || '1.0';
const OPENSTREETMAP_CARTO_DE_VERSION = import.meta.env.VITE_OPENSTREETMAP_CARTO_DE_VERSION || '1.0';

const folder = helper.getGETParameter('folder') !== null && helper.getGETParameter('folder') !== '' ? '/' + helper.getGETParameter('folder') + '/' : '/';

const osm = new TileLayer({
    source: new OSM(),
});

const source = new VectorSource();
const geolocatelayer = new VectorLayer({
    source: source,
});

const tileUrl = folder + '{z}/{x}/{y}.png';

const link = new Link();

sessionStorage.setItem('tileUrl', tileUrl);
sessionStorage.setItem('hostname', HOSTNAME);
sessionStorage.setItem('folder', folder);

document.getElementById('logo').src = imgUrl;
document.getElementById('header-h1').innerHTML = 'Server: ' + HOSTNAME + ', Folder: ' + folder;

document.getElementById('main-carto').innerHTML = OPENSTREETMAP_CARTO_DE_VERSION;
document.getElementById('main-local').innerHTML = OSML10N_VERSION;


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

// Map Link von OpenLayers per GET-Variable übergeben
document.addEventListener("DOMContentLoaded", function () {
    var navList = document.getElementById("nav-list");
    var links = navList.getElementsByTagName("a");

    function mergeQueryStrings(baseUrl, additionalQueryString) {
        var url = new URL(baseUrl);
        var additionalParams = new URLSearchParams(additionalQueryString);
        additionalParams.forEach((value, key) => {
            url.searchParams.set(key, value);
        });
        return url.toString();
    }

    function updateLinks() {
        var queryString = window.location.search;
        for (var i = 0; i < links.length; i++) {
            links[i].href = mergeQueryStrings(links[i].href, queryString);
        }
    }

    updateLinks();

    window.addEventListener('popstate', function (event) {
        updateLinks();
    });

    // Popstate-Event auszulösen
    window.history.pushState = (function (f) {
        return function pushState() {
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('popstate'));
            return ret;
        };
    })(window.history.pushState);

    window.history.replaceState = (function (f) {
        return function replaceState() {
            var ret = f.apply(this, arguments);
            window.dispatchEvent(new Event('popstate'));
            return ret;
        };
    })(window.history.replaceState);
});

const defaultStyle = new TileLayer({
    source: new XYZ({
        attributions: [
            '| © sobuskutkowacy pola OpenStreetMap. | © OpenStreetMap Mitwirkende.',
        ],
        url: tileUrl,
        maxZoom: 20,
    }),
});

const map = new Map({
    controls: defaultControls().extend([new FullScreen()]),
    layers: [osm, defaultStyle, geolocatelayer],
    target: 'map',
    view: new View({
        center: fromLonLat([10.33649, 51.006271]),
        projection: 'EPSG:3857',
        zoom: 6,
        maxZoom: 20,
        minZoom: 0,
        multiWorld: true,
        constrainResolution: true,
    })
});

const swipe = document.getElementById('swipe');

defaultStyle.on('prerender', function (event) {
    const ctx = event.context;
    const mapSize = map.getSize();
    const width = mapSize[0] * (swipe.value / 100);
    const tl = getRenderPixel(event, [width, 0]);
    const tr = getRenderPixel(event, [mapSize[0], 0]);
    const bl = getRenderPixel(event, [width, mapSize[1]]);
    const br = getRenderPixel(event, mapSize);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(tl[0], tl[1]);
    ctx.lineTo(bl[0], bl[1]);
    ctx.lineTo(br[0], br[1]);
    ctx.lineTo(tr[0], tr[1]);
    ctx.closePath();
    ctx.clip();
});

defaultStyle.on('postrender', function (event) {
    const ctx = event.context;
    ctx.restore();
});

swipe.addEventListener('input', function () {
    map.render();
});

var contextmenu = new ContextMenu({
    width: 170,
    defaultItems: false,
    items: [
        {
            text: 'Kachelinfo',
            classname: 'open_tile_cb',
            callback: helper.open_tile_cb,
        },
    ],
});
map.addControl(contextmenu);

map.addInteraction(link);

let currZoom = map.getView().getZoom();
document.getElementById('zoomlevel').innerHTML = 'Zoom: ' + currZoom;
sessionStorage.setItem("zoomlevel", currZoom);
map.on('moveend', function (e) {
    var newZoom = map.getView().getZoom();
    if (currZoom != newZoom) {
        document.getElementById('zoomlevel').innerHTML = 'Zoom: ' + newZoom;
        sessionStorage.setItem("zoomlevel", newZoom);
        currZoom = newZoom;
    }
});

// Geoloacate
navigator.geolocation.watchPosition(
    function (pos) {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        const accuracy = circular(coords, pos.coords.accuracy);
        source.clear(true);
        source.addFeatures([
            new Feature(
                accuracy.transform('EPSG:4326', map.getView().getProjection())
            ),
            new Feature(new Point(fromLonLat(coords))),
        ]);
    },
    function (error) {
        alert(`ERROR: ${error.message}`);
    },
    {
        enableHighAccuracy: true,
    }
);
const locate = document.createElement('div');
locate.className = 'ol-control ol-control-custom-geo ol-unselectable locate';
locate.innerHTML = '<button title="Lokalisiere mich">◎</button>';
locate.addEventListener('click', function () {
    if (!source.isEmpty()) {
        map.getView().fit(source.getExtent(), {
            maxZoom: 18,
            duration: 500,
        });
    }
});
map.addControl(
    new Control({
        element: locate,
    })
);
