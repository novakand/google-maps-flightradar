import { DeckAPILoader } from '../services/deck-api-loader.js';

// 🔑 Логин и пароль OpenSky Network
const username = 'Novakand';
const password = '2208311799';

// 📡 API OpenSky Network
const DATA_URL = 'https://opensky-network.org/api/states/all';
const MODEL_URL = './assets/models/airplane.glb';
const REFRESH_TIME_SECONDS = 60;
const DROP_IF_OLDER_THAN_SECONDS = 120;

// 🗺️ Маппинг данных OpenSky
const DATA_INDEX = {
  ICAO24: 0,          // Уникальный идентификатор
  CALLSIGN: 1,        // Позывной
  ORIGIN_COUNTRY: 2,  // Страна происхождения
  TIME_POSITION: 3,   // Время последнего обновления позиции
  LAST_CONTACT: 4,    // Время последнего контакта
  LONGITUDE: 5,       // Долгота
  LATITUDE: 6,        // Широта
  BARO_ALTITUDE: 7,   // Барометрическая высота
  ON_GROUND: 8,       // На земле
  VELOCITY: 9,        // Скорость
  TRUE_TRACK: 10,     // Истинный курс
  VERTICAL_RATE: 11,  // Вертикальная скорость
  SENSORS: 12,        // Сенсоры
  GEO_ALTITUDE: 13,   // Геометрическая высота
  SQUAWK: 14,         // Код транспондера
  SPI: 15,            // Специальный индикатор
  POSITION_SOURCE: 16, // Источник позиции
  CATEGORY: 17        // Категория самолета
};

// 🕹 **Анимация, как в оригинальном React-коде**
const ANIMATIONS = {
  '*': { speed: 1 } // Используем `speed: 1`, как в React-коде
};

// 📌 **Функция плавного перехода (реалистичное движение)**
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// 🛠️ **Функция для отображения всплывающей подсказки**
function getTooltip({ object }) {
  return (
    object &&
    `\
    Call Sign: ${object[DATA_INDEX.CALLSIGN] || ''}
    Country: ${object[DATA_INDEX.ORIGIN_COUNTRY] || ''}
    Vertical Rate: ${object[DATA_INDEX.VERTICAL_RATE] || 0} m/s
    Velocity: ${object[DATA_INDEX.VELOCITY] || 0} m/s
    Direction: ${object[DATA_INDEX.TRUE_TRACK] || 0}°`
  );
}

export class GoogleMapsDeckOverlay {
  constructor(map) {
    this.loader = new DeckAPILoader();
    this._map = map;
    this.overlay = null;
    this.api = null;
    this.dataById = {}; // Храним данные по уникальному идентификатору
    this.data = []; // Массив данных для слоя
    this.tooltip = null; // Элемент для отображения подсказки
    this.init();
  }

  // 📡 Запрос данных с аутентификацией
  async fetchFlightPositions() {
    try {
      const credentials = btoa(`${username}:${password}`);

      const resp = await fetch(DATA_URL);

      if (!resp.ok) throw new Error(`Failed to fetch flight positions, status: ${resp.status}`);

      const { time, states } = await resp.json();
      states.forEach(a => {
        a[DATA_INDEX.LAST_CONTACT] = time - a[DATA_INDEX.LAST_CONTACT];
      });

      //console.log("✅ Loaded flight data:", states);
      return states;
    } catch (error) {
      console.error("❌ Error fetching flight data:", error);
      return [];
    }
  }

  // 🔄 Обновление данных
  updateData(newData) {
    console.log("🔄 Updating existing data...");
    const updatedDataById = {};

    newData.forEach(entry => {
      const id = entry[DATA_INDEX.ICAO24];

      if (this.dataById[id]) {
        // Обновляем координаты, но сохраняем предыдущее положение
        this.dataById[id].prevPosition = this.dataById[id].currentPosition || [
          entry[DATA_INDEX.LONGITUDE] ?? 0,
          entry[DATA_INDEX.LATITUDE] ?? 0,
          entry[DATA_INDEX.GEO_ALTITUDE] ?? 0
        ];
      } else {
        // Создаем новую запись
        this.dataById[id] = entry;
        this.dataById[id].prevPosition = [
          entry[DATA_INDEX.LONGITUDE] ?? 0,
          entry[DATA_INDEX.LATITUDE] ?? 0,
          entry[DATA_INDEX.GEO_ALTITUDE] ?? 0
        ];
      }

      this.dataById[id].currentPosition = [
        entry[DATA_INDEX.LONGITUDE] ?? 0,
        entry[DATA_INDEX.LATITUDE] ?? 0,
        entry[DATA_INDEX.GEO_ALTITUDE] ?? 0
      ];

      updatedDataById[id] = this.dataById[id];
    });

    // ⚠️ **Используем мягкое удаление данных**
    Object.keys(this.dataById).forEach(id => {
      if (!updatedDataById[id]) {
        console.log(`🗑️ Removing outdated aircraft: ${id}`);
        delete this.dataById[id];
      }
    });

    this.data = Object.values(this.dataById);
   // console.log("✅ Updated data:", this.data);
  }

  // ✈️ **Создание слоя самолётов**
  createFlightLayer() {
    console.log("✈️ Creating ScenegraphLayer...");
    return new this.api.ScenegraphLayer({
      id: 'flight-positions-layer',
      data: this.data,
      scenegraph: MODEL_URL,
      pickable: true,

      // 📌 **Используем плавный переход между старой и новой позицией**
      getPosition: d => d.prevPosition ?? d.currentPosition ?? [
        d[DATA_INDEX.LONGITUDE] ?? 0,
        d[DATA_INDEX.LATITUDE] ?? 0,
        d[DATA_INDEX.GEO_ALTITUDE] ?? 0
      ],

      getOrientation: d => {
        const verticalRate = d[DATA_INDEX.VERTICAL_RATE] ?? 0;
        const velocity = d[DATA_INDEX.VELOCITY] ?? 0;

        // Рассчитываем угол тангажа (pitch) и рыскания (yaw)
        const pitch = (-Math.atan2(verticalRate, velocity) * 180 / Math.PI);
        const yaw = -(d[DATA_INDEX.TRUE_TRACK] ?? 0); // Истинный курс (TRUE_TRACK)

        return [pitch, yaw, 90]; // Возвращаем углы в градусах
      },

      getScale: d => {
        const lastContact = d[DATA_INDEX.LAST_CONTACT];
        return lastContact < -DROP_IF_OLDER_THAN_SECONDS ? [0, 0, 0] : [1, 1, 1];
      },

      transitions: {
        getPosition: d => {
          if (!d || !d.prevPosition || !d.currentPosition) return [0, 0, 0]; // Предотвращаем ошибки
          const t = easeInOutQuad(performance.now() % REFRESH_TIME_SECONDS / REFRESH_TIME_SECONDS);
          return [
            (1 - t) * d.prevPosition[0] + t * d.currentPosition[0],
            (1 - t) * d.prevPosition[1] + t * d.currentPosition[1],
            (1 - t) * d.prevPosition[2] + t * d.currentPosition[2]
          ];
        }
      },

      _animations: ANIMATIONS, // ✈️ **Используем `speed: 1`, как в React-коде**

      sizeScale: 10,
      sizeMinPixels: 0.5,
      sizeMaxPixels: 1.8,
      _lighting: 'pbr',

      // 🛠️ **Добавляем функцию getTooltip**
      getTooltip: getTooltip
    });
  }

  // 🌍 Создание overlay
  createOverlay() {
    console.log("🗺️ Initializing DeckGL overlay...");
    this.overlay = new this.api.GoogleMapsOverlay({
      layers: [this.createFlightLayer()]
    });

    // 🛠️ **Добавляем обработчик событий для отображения подсказки**
    this.overlay.setProps({
      getTooltip: getTooltip
    });

    this.overlay.setMap(this._map);
  }

  // 🔄 **Обновление позиций самолётов**
  updateFlightPositions() {
    try {
      this.fetchFlightPositions().then(newData => {
        if (!newData.length) return;

        this.updateData(newData);

        if (this.overlay) {
          console.log("🔄 Updating overlay...");
          const currentLayer = this.overlay.props.layers[0];

          this.overlay.setProps({
            layers: [
              currentLayer.clone({
                data: this.data // Обновляем только данные!
              })
            ]
          });
        }
      });
    } catch (error) {
      console.error("❌ Error updating flight positions:", error);
    }
  }

  // 🚀 **Инициализация**
  async init() {
    await this._apiLoader();
    const newData = await this.fetchFlightPositions();
    this.updateData(newData);
    this.createOverlay();

    setInterval(() => this.updateFlightPositions(), REFRESH_TIME_SECONDS * 1000);
  }

  // 📦 **Загрузка DeckGL API**
  _apiLoader() {
    return new Promise(resolve => {
      this.loader.load()
        .then(deck => {
          this.api = deck;
          resolve(true);
        })
        .catch(error => {
          console.error("❌ Error loading Deck API:", error);
          resolve(false);
        });
    });
  }
}