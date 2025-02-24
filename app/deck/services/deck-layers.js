// import { DeckBuildLayer } from '../services/deck-build-layer.js';
let layerId = 0;

export class DeckLayersServise {

    layers = new Map();

    constructor(layersConfig) {
        this.buildLayers(layersConfig);
    }

    buildLayers(layersConfig) {
        layersConfig?.layers?.forEach((layer) => {
            this.buildLayer(layer);
        });
    }

    buildLayer(layer) {
        this._id = (layerId++).toString();
        this.addLayer(layer.name, DeckBuildLayer.buildLayer({ ...layer, id: layer.name.includes('#')? `#${this._id}`:this._id }));
    }

    addLayer(layer, deckLayer) {
        this.layers.set(layer, deckLayer);
    }

    getlayer(layer) {
        return this.layers.get(layer);
    }

    removeLayer(layer) {
        this.layers.delete(layer);
    }

    getLayers() {
        return [...this.layers.values()];
    }

}
