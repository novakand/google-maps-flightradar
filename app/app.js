import { GoogleMapsService } from './services/google-map.service.js';
import { mapOptions } from './constants/google-maps-options.js';
import { mapConfig } from './constants/google-maps-config.js';


/**
 * Google Maps API
 * 
 * @see https://developers.google.com/maps/documentation/javascript
 */

let map;
let mapService;


async function onInit() {
    onInitMap();
    onPreloader(false);
}

function onInitMap() {
    mapService = new GoogleMapsService(document.getElementById('map'), mapOptions,mapConfig);
    mapService.mapReady.then((googleMap) => {
        map = googleMap;
        console.log(map,'map')
        document.querySelector('#map').setAttribute('data-load', true);
    });
}

function addListenerMap() {
    map.events.add('click', onClickMap.bind(this));
}

function onPreloader(isShow) {
    const preloader = document.querySelector('.mdc-linear-progress');
    delay(3000).then(() => isShow ? preloader.style.width = '100%' : preloader.style.width = '0');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

document.addEventListener('DOMContentLoaded', onInit);