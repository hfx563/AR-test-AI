// ArLux Travel App - Production Version 2.0
// Modular, Error-Handled, Cached, Validated

// Import production modules (will be loaded via script tags)
const errorHandler = window.errorHandler;
const loadingManager = window.loadingManager;
const apiService = window.apiService;
const validator = window.validator;

// App State
const appState = {
  currentCity: null,
  cityCoordinates: null,
  selectedCategory: null,
  isOnline: navigator.onLine
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  setupOnlineOfflineDetection();
});

function initializeApp() {
  try {
    fetchUserIP();
    createCityAutocomplete();
    
    // Show welcome message
    if (!localStorage.getItem('visited')) {
      errorHandler.showToast('Welcome to ArLux! Search for a city to begin.', 'info');
      localStorage.setItem('visited', 'true');
    }
  } catch (error) {
    errorHandler.handle(error, 'Initialization');
  }
}

// ===== IP ADDRESS =====
async function fetchUserIP() {
  try {
    const data = await apiService.get('https://ipapi.co/json/', {
      cache: true,
      cacheTTL: 3600000 // 1 hour
    });

    const userAgent = navigator.userAgent;
    let deviceName = 'Desktop';
    
    if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
    else if (/iPad/i.test(userAgent)) deviceName = 'iPad';
    else if (/Android/i.test(userAgent)) deviceName = 'Android';
    else if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
    else if (/Mac/i.test(userAgent)) deviceName = 'Mac';

    const ipAddress = data.ip || 'Unknown';
    const city = data.city || 'Unknown';
    
    document.getElementById('ipAddress').textContent = `${ipAddress} | ${city} | ${deviceName}`;
  } catch (error) {
    document.getElementById('ipAddress').textContent = 'IP unavailable';
    console.error('IP fetch failed:', error);
  }
}

// ===== CITY SEARCH =====
function createCityAutocomplete() {
  const input = document.getElementById('cityInput');
  const container = document.getElementById('autocompleteContainer');
  let debounceTimer;

  input.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (query.length < 2) {
      container.innerHTML = '';
      return;
    }

    // Debounce API calls
    debounceTimer = setTimeout(async () => {
      try {
        // Validate input
        const sanitized = validator.sanitizeHTML(query);
        
        loadingManager.show('autocompleteContainer', 'dots');

        const url = `https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(sanitized)}&featureClass=P&maxRows=5&username=demo`;
        const data = await apiService.get(url, {
          cache: true,
          cacheTTL: 3600000
        });

        loadingManager.hide('autocompleteContainer');

        if (data.geonames && data.geonames.length > 0) {
          displayAutocomplete(data.geonames, container, input);
        } else {
          container.innerHTML = '<div class="no-results">No cities found</div>';
        }
      } catch (error) {
        loadingManager.hide('autocompleteContainer');
        errorHandler.handle(error, 'CitySearch');
        container.innerHTML = '';
      }
    }, 300);
  });

  input.addEventListener('blur', () => {
    setTimeout(() => container.innerHTML = '', 200);
  });
}

function displayAutocomplete(cities, container, input) {
  container.innerHTML = '';
  const list = document.createElement('ul');
  list.style.cssText = 'position:absolute;background:#fff;border:1px solid #ccc;width:100%;z-index:1000;list-style:none;padding:0;margin:0;border-radius:10px;overflow:hidden;';

  cities.forEach(city => {
    const item = document.createElement('li');
    item.textContent = `${city.name}, ${city.countryName}`;
    item.style.cssText = 'cursor:pointer;padding:12px 20px;border-bottom:1px solid #f0f0f0;transition:background 0.2s;';
    
    item.addEventListener('mouseenter', () => item.style.background = '#f5f5f5');
    item.addEventListener('mouseleave', () => item.style.background = 'white');
    
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      input.value = city.name;
      container.innerHTML = '';
      searchCity(city.name);
    });
    
    list.appendChild(item);
  });

  container.appendChild(list);
}

// ===== SEARCH BUTTON =====
async function searchCity(cityName) {
  try {
    const sanitized = validator.validateCityName(cityName || document.getElementById('cityInput').value);
    
    loadingManager.buttonLoading('searchButton', true);

    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(sanitized)}&format=json&limit=10&addressdetails=1`;
    const data = await apiService.get(url, {
      cache: true,
      cacheTTL: 1800000 // 30 minutes
    });

    loadingManager.buttonLoading('searchButton', false);

    if (data && data.length > 0) {
      if (data.length > 1) {
        showCitySelector(data);
      } else {
        selectCity(data[0]);
      }
    } else {
      errorHandler.showToast('City not found. Try another name.', 'warning');
    }
  } catch (error) {
    loadingManager.buttonLoading('searchButton', false);
    errorHandler.handle(error, 'CitySearch');
  }
}

function showCitySelector(cities) {
  const container = document.getElementById('autocompleteContainer');
  container.innerHTML = '';
  
  const selector = document.createElement('div');
  selector.className = 'city-selector-dropdown';
  selector.innerHTML = '<div class="selector-dropdown-title">Multiple cities found. Select one:</div>';

  cities.forEach(city => {
    const option = document.createElement('div');
    option.className = 'city-dropdown-option';
    option.innerHTML = `
      <div class="city-option-name">${city.display_name.split(',')[0]}</div>
      <div class="city-option-details">${city.display_name}</div>
    `;
    option.addEventListener('click', () => {
      selectCity(city);
      container.innerHTML = '';
    });
    selector.appendChild(option);
  });

  container.appendChild(selector);
}

async function selectCity(cityData) {
  try {
    appState.currentCity = cityData.display_name.split(',')[0];
    appState.cityCoordinates = {
      lat: parseFloat(cityData.lat),
      lon: parseFloat(cityData.lon)
    };

    // Validate coordinates
    validator.validateCoordinates(appState.cityCoordinates.lat, appState.cityCoordinates.lon);

    // Show sections
    document.getElementById('cityInfoSection').style.display = 'block';
    document.getElementById('categoriesSection').style.display = 'block';

    // Update city info
    document.getElementById('cityName').textContent = appState.currentCity;
    const country = cityData.address?.country || cityData.display_name.split(',').pop().trim();
    document.getElementById('cityCountry').textContent = country;

    // Fetch data
    await Promise.all([
      fetchWeatherData(appState.cityCoordinates.lat, appState.cityCoordinates.lon),
      fetchCityInfo(appState.currentCity, cityData)
    ]);

    // Scroll to city info
    setTimeout(() => {
      document.getElementById('cityInfoSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);

    errorHandler.showToast(`Loaded ${appState.currentCity}!`, 'success');
  } catch (error) {
    errorHandler.handle(error, 'CitySelection');
  }
}

// ===== WEATHER =====
async function fetchWeatherData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const data = await apiService.get(url, {
      cache: true,
      cacheTTL: 600000 // 10 minutes
    });

    if (data.current_weather) {
      const temp = Math.round(data.current_weather.temperature);
      const weatherDesc = getWeatherDescription(data.current_weather.weathercode);
      document.getElementById('weatherInfo').textContent = `${temp}°C, ${weatherDesc}`;
    }
  } catch (error) {
    document.getElementById('weatherInfo').textContent = 'N/A';
    console.error('Weather fetch failed:', error);
  }
}

function getWeatherDescription(code) {
  const codes = {
    0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
    45: 'Foggy', 51: 'Light Drizzle', 61: 'Light Rain', 63: 'Rain',
    71: 'Light Snow', 73: 'Snow', 95: 'Thunderstorm'
  };
  return codes[code] || 'Clear';
}

// ===== CITY INFO =====
async function fetchCityInfo(cityName, cityData) {
  try {
    // Population
    const population = cityData.extratags?.population;
    if (population) {
      document.getElementById('populationInfo').textContent = parseInt(population).toLocaleString();
    } else {
      document.getElementById('populationInfo').textContent = 'N/A';
    }

    // City type
    const placeRank = cityData.place_rank || 16;
    let cityType = 'City';
    if (placeRank <= 8) cityType = 'Megacity';
    else if (placeRank <= 12) cityType = 'Major City';
    else if (placeRank <= 16) cityType = 'City';
    else cityType = 'Town';
    document.getElementById('cityType').textContent = cityType;

    // Region
    const region = cityData.address?.state || cityData.address?.region || 'N/A';
    document.getElementById('regionInfo').textContent = region;
  } catch (error) {
    console.error('City info fetch failed:', error);
  }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Search button
  document.getElementById('searchButton').addEventListener('click', () => searchCity());

  // Enter key on search
  document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCity();
  });

  // Category cards
  document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => handleCategoryClick(card));
  });

  // Music, Camera, Chat buttons (existing functionality)
  setupMusicButton();
  setupCameraButton();
}

function handleCategoryClick(card) {
  if (!appState.currentCity) {
    errorHandler.showToast('Please search for a city first', 'warning');
    return;
  }

  document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  
  appState.selectedCategory = card.getAttribute('data-category');
  
  searchPlacesByCategory();
  
  document.getElementById('resultsSection').style.display = 'block';
  setTimeout(() => {
    document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

// ===== PLACES SEARCH =====
async function searchPlacesByCategory() {
  try {
    const container = document.getElementById('placesList');
    loadingManager.showCardSkeleton('placesList', 5);

    const categoryTags = {
      landmark: ['tourism=museum', 'tourism=attraction', 'historic=monument'],
      nature: ['leisure=park', 'leisure=garden', 'natural=beach'],
      food: ['amenity=restaurant', 'amenity=cafe'],
      culture: ['tourism=gallery', 'tourism=museum'],
      waterfront: ['natural=beach', 'tourism=viewpoint'],
      nightlife: ['amenity=nightclub', 'amenity=bar']
    };

    const tags = categoryTags[appState.selectedCategory] || categoryTags.landmark;
    const tagQuery = tags.map(tag => {
      const [key, value] = tag.split('=');
      return `node["${key}"="${value}"](around:15000,${appState.cityCoordinates.lat},${appState.cityCoordinates.lon});`;
    }).join('');

    const overpassQuery = `[out:json];(${tagQuery});out body 15;`;
    
    const data = await apiService.post('https://overpass-api.de/api/interpreter', overpassQuery, {
      timeout: 15000
    });

    displayPlaces(data.elements || []);
  } catch (error) {
    document.getElementById('placesList').innerHTML = '<div class="error-message">Unable to load places. Please try again.</div>';
    errorHandler.handle(error, 'Places');
  }
}

function displayPlaces(places) {
  const container = document.getElementById('placesList');
  container.innerHTML = '';

  const categoryNames = {
    landmark: 'Heritage Sites',
    nature: 'Natural Wonders',
    food: 'Fine Dining',
    culture: 'Arts & Culture',
    waterfront: 'Coastal Escapes',
    nightlife: 'Evening Entertainment'
  };

  const header = document.createElement('div');
  header.className = 'results-header';
  header.innerHTML = `<h2>${categoryNames[appState.selectedCategory]} in ${appState.currentCity}</h2>`;
  container.appendChild(header);

  const validPlaces = places.filter(p => p.tags && p.tags.name).slice(0, 15);

  if (validPlaces.length === 0) {
    container.innerHTML += '<div class="no-results">No places found. Try another category.</div>';
    return;
  }

  validPlaces.forEach((place, index) => {
    const card = document.createElement('div');
    card.className = 'place-card';
    
    const description = place.tags.description || `${place.tags.tourism || place.tags.amenity || 'Place'} in ${appState.currentCity}`;
    const wikiLink = place.tags.wikipedia 
      ? `https://en.wikipedia.org/wiki/${place.tags.wikipedia.split(':')[1]}`
      : `https://www.google.com/search?q=${encodeURIComponent(place.tags.name + ' ' + appState.currentCity)}`;
    
    const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(place.tags.name + ' ' + appState.currentCity)}`;

    card.innerHTML = `
      <div class="place-image" style="background-image: url('${imageUrl}');"></div>
      <div class="place-info">
        <div class="place-number">${index + 1}</div>
        <div class="place-content">
          <h3 class="place-title">
            <a href="${wikiLink}" target="_blank">${validator.sanitizeHTML(place.tags.name)}</a>
          </h3>
          <p class="place-description">${validator.sanitizeHTML(description)}</p>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ===== MUSIC & CAMERA (Existing) =====
function setupMusicButton() {
  let audioContext = null;
  let musicPlaying = false;
  let oscillators = [];

  document.getElementById('toggleMusicBtn').addEventListener('click', function() {
    if (!musicPlaying) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00];
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.15;
      masterGain.connect(audioContext.destination);

      frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(masterGain);
        oscillators.push(osc);
        osc.start();

        setInterval(() => {
          const now = audioContext.currentTime;
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.1, now + 2);
          gain.gain.linearRampToValueAtTime(0, now + 6);
        }, 8000 + i * 1000);
      });

      musicPlaying = true;
      this.querySelector('span').textContent = 'Pause Music';
      errorHandler.showToast('Music started', 'success');
    } else {
      oscillators.forEach(osc => osc.stop());
      oscillators = [];
      if (audioContext) audioContext.close();
      musicPlaying = false;
      this.querySelector('span').textContent = 'Play Music';
    }
  });
}

function setupCameraButton() {
  let cameraStream = null;

  document.getElementById('toggleCameraBtn').addEventListener('click', async function() {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      errorHandler.showToast('Camera requires HTTPS', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      cameraStream = stream;
      document.getElementById('cameraVideo').srcObject = stream;
      document.getElementById('cameraContainer').style.display = 'block';
      this.style.display = 'none';
      errorHandler.showToast('Camera activated', 'success');
    } catch (error) {
      errorHandler.showToast('Camera access denied', 'error');
    }
  });

  document.getElementById('closeCameraBtn').addEventListener('click', function() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    document.getElementById('cameraVideo').srcObject = null;
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('toggleCameraBtn').style.display = 'flex';
  });
}

// ===== ONLINE/OFFLINE DETECTION =====
function setupOnlineOfflineDetection() {
  const indicator = document.createElement('div');
  indicator.className = 'offline-indicator';
  indicator.textContent = '⚠️ You are offline';
  document.body.appendChild(indicator);

  window.addEventListener('offline', () => {
    appState.isOnline = false;
    indicator.classList.add('show');
    errorHandler.showToast('You are offline. Some features may not work.', 'warning');
  });

  window.addEventListener('online', () => {
    appState.isOnline = true;
    indicator.classList.remove('show');
    errorHandler.showToast('Back online!', 'success');
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { searchCity, fetchWeatherData, selectCity };
}
