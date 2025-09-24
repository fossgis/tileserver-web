import '../scss/styles.scss';
import * as helper from './helpers';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { getRenderPixel } from 'ol/render';
import ContextMenu from 'ol-contextmenu';
import imgUrl from '../images/osm_logo.png'
import { FullScreen, Control, defaults as defaultControls } from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Geocoder from 'ol-geocoder';
import 'ol-geocoder/dist/ol-geocoder.min.css';

let zoom = 6;
let center = fromLonLat([10.33649, 51.006271]);

const HOSTNAME = import.meta.env.VITE_HOSTNAME || 'tile';
const OSML10N_VERSION = import.meta.env.VITE_OSML10N_VERSION || '1.0';
const OPENSTREETMAP_CARTO_DE_VERSION = import.meta.env.VITE_OPENSTREETMAP_CARTO_DE_VERSION || '1.0';

const param = helper.getGETParameter('folder');
const folder = !param || param === '/' ? '/' : `/${param}/`;

const osm = new TileLayer({
    source: new OSM(),
});

const source = new VectorSource();
const geolocatelayer = new VectorLayer({
    source: source,
});

const tileUrl = folder + '{z}/{x}/{y}.png';

if (window.location.hash !== '') {
    const hash = window.location.hash.replace('#map=', '');
    const parts = hash.split('/');
    if (parts.length === 3) {
        zoom = parseFloat(parts[0]);
        center = fromLonLat([
            parseFloat(parts[1]),
            parseFloat(parts[2])
        ]);
    }
}

const updateNavLinks = () => {
    const hash = window.location.hash;
    document.querySelectorAll("#nav-list a").forEach(a => {
        a.href = a.href.replace(/#.*$/, "");
        a.href += hash;
    });
};

const updateLink = function () {
    if (!shouldUpdate) {
        shouldUpdate = true;
        return;
    }

    const center = toLonLat(view.getCenter());
    const hash =
        '#map=' +
        view.getZoom().toFixed(2) +
        '/' +
        center[0].toFixed(5) +
        '/' +
        center[1].toFixed(5);

    window.location.replace(hash);
    history.replaceState({ zoom: view.getZoom(), center: view.getCenter() }, 'map');

    updateNavLinks();
};

sessionStorage.setItem('tileUrl', tileUrl);
sessionStorage.setItem('hostname', HOSTNAME);
sessionStorage.setItem('folder', folder);

document.getElementById('logo').src = imgUrl;
document.getElementById('header-h1').innerHTML = 'Server: ' + HOSTNAME + ', Folder: ' + folder;

document.getElementById('main-carto').innerHTML = OPENSTREETMAP_CARTO_DE_VERSION;
document.getElementById('main-local').innerHTML = OSML10N_VERSION;


document.addEventListener('DOMContentLoaded', async () => {
    updateNavLinks();
    try {
        const response = await fetch('/textimport/importdate.txt');
        const text = await response.text();
        document.getElementById('db-import-dates').innerText =
            text.trim().replace(/\n\n|\r/g, "; ").replace(/\n|\r/g, "; ").replace(/[\|]/g, "-");
    } catch (error) {
        console.error('Fehler beim Laden der Textdatei (/textimport/importdate.txt):', error);
    }
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
        center: center,
        projection: 'EPSG:3857',
        zoom: zoom,
        maxZoom: 20,
        minZoom: 0,
        multiWorld: true,
        constrainResolution: true,
    })
});

const swipe = document.getElementById('swipe');

let shouldUpdate = true;
const view = map.getView();
map.on('moveend', updateLink);

window.addEventListener('popstate', function (event) {
    if (event.state === null) {
        return;
    }
    map.getView().setCenter(event.state.center);
    map.getView().setZoom(event.state.zoom);
    shouldUpdate = false;
});

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

// Geocoder
const geocoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'de-DE',
    placeholder: 'Suche nach ...',
    targetType: 'text-input',
    limit: 5,
    keepOpen: true
});
map.addControl(geocoder);
