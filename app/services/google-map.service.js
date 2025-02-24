import { GoogleMapsAPILoader } from './google-maps-api-loader.js';

export class GoogleMapsService {
  mapReady;

  constructor(htmlElement, options,config) {
    this._options = options || {};
    this.loader = new GoogleMapsAPILoader(config);
    this.mapReady = this._apiLoader(htmlElement, this._options);
  }

  async destroy() {
    const scriptElem = document.getElementById('googlemapsScript');
    if (scriptElem) {
      scriptElem.remove();
    }
    this._maps = null;
  }

  _apiLoader(htmlElement, options) {
    return new Promise((resolve, reject) => {
      this.loader
        .load()
        .then(() => {
          this._maps = this._createMap(htmlElement, options);
          this._importsLib();
          resolve(this._maps);
        })
        .catch((error) => reject(error));
    });
  }

  _createMap(htmlElement, options) {
    return new Promise((resolve, reject) => {
      resolve(this._createOptions(htmlElement, options));
    }).catch((error) => reject(error));
  }

  _createOptions(htmlElement, options) {
    return new google.maps.Map(htmlElement, options);
  }


  async _importsLib() {
    const { GoogleMapsDeckOverlay } = await import('../deck/services/google-maps-deck-layer.js');
    const map = await this._maps;
    this.deckLayers = new GoogleMapsDeckOverlay(map);
   
}
}
