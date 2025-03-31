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
import Geocoder from 'ol-geocoder';
import 'ol-geocoder/dist/ol-geocoder.min.css';

import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { get as getProjection } from 'ol/proj';

// Projektion definieren (Equal Earth - EPSG:8857)
proj4.defs("EPSG:8857", "+proj=eqearth +datum=WGS84 +no_defs");
register(proj4);

// Projektion registrieren und Extent setzen
const projection = getProjection('EPSG:8857');
projection.setExtent([-17367530, -7346360, 17367530, 7346360]);

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
        projection: 'EPSG:8857',
        maxZoom: 20,
    }),
});

const map = new Map({
    controls: defaultControls().extend([new FullScreen()]),
    layers: [osm, defaultStyle, geolocatelayer],
    target: 'map',
    view: new View({
        center: fromLonLat([10.33649, 51.006271]),
        projection: projection,
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

// GEocoder
const geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'de-DE',
    placeholder: 'Suche nach ...',
    targetType: 'text-input',
    limit: 5,
    keepOpen: true
});
map.addControl(geocoder);
