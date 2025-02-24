export class GoogleMapsAPILoader {
    constructor(config) {
      this.windowRef = window;
      this.documentRef = document;
      this._SCRIPT_ID = 'googlemapsScript';
      this._scriptLoading = null;
      this.config = config || {};
    }
  
    load() {
      // Если API уже загружен, сразу возвращаем разрешённый промис.
      if (window.google && window.google.maps) {
        return Promise.resolve();
      }
  
      // Если загрузка уже начата – возвращаем существующий промис.
      if (this._scriptLoading) {
        return this._scriptLoading;
      }
  
      // Если на странице уже есть элемент скрипта – назначаем обработчики.
      const scriptOnPage = this.documentRef.getElementById(this._SCRIPT_ID);
      if (scriptOnPage) {
        this._assignScriptLoading(scriptOnPage);
        return this._scriptLoading;
      }
  
      // Создаем элемент скрипта и назначаем его src
      const script = this._createElementScript();
      script.src = this._getScriptSrc(this.config);
      this._assignScriptLoading(script);
      this.documentRef.head.appendChild(script);
  
      return this._scriptLoading;
    }
  
    _createElementScript() {
      const script = this.documentRef.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.defer = true;
      script.id = this._SCRIPT_ID;
      return script;
    }
  
    _getScriptSrc(config) {
      // Извлекаем параметры для Google Maps API.
      // По умолчанию используется версия '3'
      const { version = '3', key, libraries, ...other } = config;
      // Имя callback-функции, которая будет вызвана API при загрузке
      const callbackName = '__onGoogleMapsLoaded';
      const paramsObj = {
        key: key,
        v: version,
        callback: callbackName,
        ...other
      };
  
      // Если указан параметр libraries, то преобразуем его в строку (если это массив)
      if (libraries) {
        paramsObj.libraries = Array.isArray(libraries) ? libraries.join(',') : libraries;
      }
  
      const params = this._getParams(paramsObj);
      return `https://maps.googleapis.com/maps/api/js?${params}`;
    }
  
    _getParams(config) {
      return Object.entries(config)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        )
        .join('&');
    }
  
    _assignScriptLoading(scriptElem) {
      this._scriptLoading = new Promise((resolve, reject) => {
        // Определяем глобальную callback-функцию, вызываемую API при загрузке.
        this.windowRef.__onGoogleMapsLoaded = () => {
          resolve();
          // Убираем callback после успешной загрузки.
          delete this.windowRef.__onGoogleMapsLoaded;
        };
  
        scriptElem.onerror = (error) => reject(error);
      });
    }
  }
  