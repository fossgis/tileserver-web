import { Modal } from 'bootstrap';
import { transform } from 'ol/proj.js';


let modal = document.getElementById('modal');
let bootstrapModal = Modal.getOrCreateInstance(modal);

export function getGETParameter(key) {
    const address = window.location.search
    const parameterList = new URLSearchParams(address)

    return parameterList.get(key)
}

// https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29
export function long2tile(lon, zoom) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

export function lat2tile(lat, zoom) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

export function open_tile_cb(obj) {
    let image = gent_tile_url('', sessionStorage.getItem('zoomlevel'), obj.coordinate);
    let infotext = gent_tile_url('status', sessionStorage.getItem('zoomlevel'), obj.coordinate);
    document.getElementById('modal-title-id').innerHTML = 'Server: ' + sessionStorage.getItem('hostname') + ' | Folder: ' + sessionStorage.getItem('folder');
    document.getElementById('modal-body-id-image').innerHTML = '<img src="' + image + '">';
    do_fetch(infotext);

    let btn_dirty_status = document.createElement("button");
    btn_dirty_status.classList.add("btn-primary");
    btn_dirty_status.classList.add("btn");
    btn_dirty_status.innerHTML = "Kachel aktualisieren";
    btn_dirty_status.addEventListener("click", function () {
        if (btn_dirty_status.innerHTML == "Kachel aktualisieren") {
            btn_dirty_status.innerHTML = "Kachelinfo anzeigen"
            let dirty = gent_tile_url('dirty', sessionStorage.getItem('zoomlevel'), obj.coordinate);
            do_fetch(dirty);
        } else {
            btn_dirty_status.innerHTML = "Kachel aktualisieren"
            do_fetch(infotext);
        }
    });
    if (document.getElementById('modal-footer').innerHTML.indexOf("Kachel") != -1) {
        // element is there 
    } else {
        document.getElementById('modal-footer').appendChild(btn_dirty_status);
    }

    bootstrapModal.show();
};

function gent_tile_url(suffix, zoom, coordinate) {
    let url = 'http://' + sessionStorage.getItem('hostname') + sessionStorage.getItem('folder') + sessionStorage.getItem('tileUrl');

    let lonlat = transform(coordinate, 'EPSG:3857', 'EPSG:4326')

    zoom = sessionStorage.getItem('zoomlevel');
    let x = long2tile(lonlat[0], zoom);
    let y = lat2tile(lonlat[1], zoom);

    url = url.replace("{x}", x);
    url = url.replace("{y}", y);
    url = url.replace("{z}", zoom);

    if (suffix != "") {
        url = url + '/' + suffix;
    }

    return url;
};


var do_after_fetch = function (data, url) {
    document.getElementById('modal-body-id-infotext').innerHTML = url + ': ' + data;
    bootstrapModal.show();
}

var do_fetch = function (url) {
    let response = fetch(url)
        .then(function (response) {
            return response.text();
        }).then(function (data) {
            do_after_fetch(data, url);
        });
}
