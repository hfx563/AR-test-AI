
// Fetch and display user's IP address
function fetchUserIP() {
    // Get device info
    const userAgent = navigator.userAgent;
    let deviceName = 'Unknown Device';
    
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
        else if (/iPad/i.test(userAgent)) deviceName = 'iPad';
        else if (/Android/i.test(userAgent)) deviceName = 'Android Device';
        else deviceName = 'Mobile Device';
    } else {
        if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
        else if (/Mac/i.test(userAgent)) deviceName = 'Mac';
        else if (/Linux/i.test(userAgent)) deviceName = 'Linux PC';
        else deviceName = 'Desktop';
    }
    
    // Use ipapi.co directly - it provides both IP and location in one call
    fetch('https://ipapi.co/json/')
        .then(response => response.json())
        .then(data => {
            const ipAddress = data.ip;
            const city = data.city || 'Unknown';
            document.getElementById('ipAddress').textContent = `${ipAddress} | ${city} | ${deviceName}`;
        })
        .catch(error => {
            console.error('Error fetching IP:', error);
            // Fallback to simpler API
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('ipAddress').textContent = `${data.ip} | ${deviceName}`;
                })
                .catch(() => {
                    document.getElementById('ipAddress').textContent = `IP unavailable | ${deviceName}`;
                });
        });
}

// GeoNames city autocomplete
function createCityAutocomplete() {
    const input = document.getElementById('cityInput');
    const container = document.createElement('div');
    container.id = 'autocompleteContainer';
    container.style.position = 'relative';
    input.parentNode.insertBefore(container, input.nextSibling);

    input.addEventListener('input', function() {
        const query = input.value.trim();
        if (query.length < 2) {
            container.innerHTML = '';
            return;
        }
        fetch(`https://secure.geonames.org/searchJSON?name_startsWith=${encodeURIComponent(query)}&featureClass=P&maxRows=5&username=demo`)
            .then(response => response.json())
            .then(data => {
                container.innerHTML = '';
                if (data.geonames && data.geonames.length > 0) {
                    const list = document.createElement('ul');
                    list.style.position = 'absolute';
                    list.style.background = '#fff';
                    list.style.border = '1px solid #ccc';
                    list.style.width = input.offsetWidth + 'px';
                    list.style.zIndex = 1000;
                    data.geonames.forEach(city => {
                        const item = document.createElement('li');
                        item.textContent = city.name + ', ' + city.countryName;
                        item.style.cursor = 'pointer';
                        item.style.padding = '4px';
                        item.addEventListener('mousedown', function(e) {
                            input.value = city.name;
                            container.innerHTML = '';
                        });
                        list.appendChild(item);
                    });
                    container.appendChild(list);
                }
            });
    });
    input.addEventListener('blur', function() {
        setTimeout(() => { container.innerHTML = ''; }, 200);
    });
}

let selectedCategory = null;
let currentCity = '';
let cityCoordinates = null;
let cityData = null;

window.onload = function() {
    createCityAutocomplete();
    fetchUserIP();
    
    // Background Music - Generate soothing tones using Web Audio API
    let audioContext = null;
    let musicPlaying = false;
    let oscillators = [];
    let gainNodes = [];
    
    function createSoothingMusic() {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Flute-like frequencies (pentatonic scale)
        const frequencies = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        const masterGain = audioContext.createGain();
        masterGain.gain.value = 0.15;
        masterGain.connect(audioContext.destination);
        
        frequencies.forEach((freq, index) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.value = 0;
            
            osc.connect(gain);
            gain.connect(masterGain);
            
            oscillators.push(osc);
            gainNodes.push(gain);
            
            osc.start();
            
            // Start immediately with sound
            const now = audioContext.currentTime;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.1, now + 0.5 + index * 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 4 + index * 0.2);
            
            // Create gentle fade in/out pattern
            setInterval(() => {
                const now = audioContext.currentTime;
                const randomDelay = Math.random() * 3;
                gain.gain.setValueAtTime(0, now + randomDelay);
                gain.gain.linearRampToValueAtTime(0.1, now + randomDelay + 2);
                gain.gain.linearRampToValueAtTime(0, now + randomDelay + 6);
            }, 8000 + index * 1000);
        });
    }
    
    function stopSoothingMusic() {
        oscillators.forEach(osc => osc.stop());
        oscillators = [];
        gainNodes = [];
        if (audioContext) {
            audioContext.close();
            audioContext = null;
        }
    }
    
    document.getElementById('toggleMusicBtn').addEventListener('click', function() {
        const btn = this;
        const btnText = btn.querySelector('span');
        
        if (!musicPlaying) {
            createSoothingMusic();
            musicPlaying = true;
            btnText.textContent = 'Pause Music';
            btn.style.background = 'rgba(76, 175, 80, 0.3)';
        } else {
            stopSoothingMusic();
            musicPlaying = false;
            btnText.textContent = 'Play Music';
            btn.style.background = 'rgba(255, 255, 255, 0.15)';
        }
    });
    
    // Camera Toggle
    let cameraStream = null;
    document.getElementById('toggleCameraBtn').addEventListener('click', function() {
        const container = document.getElementById('cameraContainer');
        const video = document.getElementById('cameraVideo');
        const btn = document.getElementById('toggleCameraBtn');
        
        if (container.style.display === 'none') {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    cameraStream = stream;
                    video.srcObject = stream;
                    container.style.display = 'block';
                    btn.style.display = 'none';
                })
                .catch(error => {
                    console.error('Camera access denied:', error);
                    alert('Camera access denied. Please allow camera permissions.');
                });
        }
    });
    
    document.getElementById('closeCameraBtn').addEventListener('click', function() {
        const container = document.getElementById('cameraContainer');
        const video = document.getElementById('cameraVideo');
        const btn = document.getElementById('toggleCameraBtn');
        
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        video.srcObject = null;
        container.style.display = 'none';
        btn.style.display = 'flex';
    });
    
    // World News Button
    document.getElementById('worldNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'World News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchWorldNews();
    });
    
    // Halifax News Button
    document.getElementById('halifaxNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Halifax News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchHalifaxNews();
    });
    
    // Pathankot News Button
    document.getElementById('pathankotNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Pathankot, Punjab News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchPathankotNews();
    });
    
    // Nepal News Button
    document.getElementById('nepalNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Nepal News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchNepalNews();
    });
    
    // Close News Modal
    document.getElementById('closeNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
    
    document.getElementById('newsModalOverlay').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
    
    document.getElementById('searchButton').addEventListener('click', function() {
        const cityName = document.getElementById('cityInput').value.trim();
        
        if (!cityName) {
            alert('Please enter a city name.');
            return;
        }
        
        fetch(`https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(cityName)}&format=json&limit=10&addressdetails=1`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    if (data.length > 1) {
                        showCitySelector(data);
                    } else {
                        selectCity(data[0]);
                    }
                } else {
                    alert('City not found. Please try another name.');
                }
            })
            .catch(() => {
                alert('Error searching for city. Please try again.');
            });
    });
    
    document.querySelectorAll('.category-card').forEach(cat => {
        cat.addEventListener('click', function() {
            if (!currentCity) {
                alert('Please enter a city name first.');
                return;
            }
            
            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            cat.classList.add('selected');
            selectedCategory = cat.getAttribute('data-category');
            
            searchPlacesByCategory(currentCity, selectedCategory, cityCoordinates);
            
            document.getElementById('resultsSection').style.display = 'block';
            
            setTimeout(() => {
                document.querySelector('.results-section').scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });
    });
}

function showCitySelector(cities) {
    const container = document.getElementById('autocompleteContainer');
    container.innerHTML = '';
    
    const selectorCard = document.createElement('div');
    selectorCard.className = 'city-selector-dropdown';
    
    const title = document.createElement('div');
    title.className = 'selector-dropdown-title';
    title.textContent = 'Multiple cities found. Please select one:';
    selectorCard.appendChild(title);
    
    cities.forEach(city => {
        const cityOption = document.createElement('div');
        cityOption.className = 'city-dropdown-option';
        
        const cityName = city.display_name.split(',')[0];
        const cityDetails = city.display_name;
        
        cityOption.innerHTML = `
            <div class="city-option-name">${cityName}</div>
            <div class="city-option-details">${cityDetails}</div>
        `;
        
        cityOption.addEventListener('click', function() {
            selectCity(city);
            container.innerHTML = '';
        });
        
        selectorCard.appendChild(cityOption);
    });
    
    container.appendChild(selectorCard);
}

function selectCity(cityData) {
    currentCity = cityData.display_name.split(',')[0];
    cityCoordinates = {
        lat: cityData.lat,
        lon: cityData.lon
    };
    
    // Show city info section
    document.getElementById('cityInfoSection').style.display = 'block';
    document.getElementById('categoriesSection').style.display = 'block';
    
    // Update city name and country
    document.getElementById('cityName').textContent = currentCity;
    const country = cityData.address?.country || cityData.display_name.split(',').pop().trim();
    document.getElementById('cityCountry').textContent = country;
    
    // Fetch weather data
    fetchWeatherData(cityCoordinates.lat, cityCoordinates.lon);
    
    // Update population and city info
    fetchCityInfo(currentCity, cityData);
    
    // Scroll to city info
    setTimeout(() => {
        document.getElementById('cityInfoSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function fetchWeatherData(lat, lon) {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`)
        .then(response => response.json())
        .then(data => {
            if (data.current_weather) {
                const temp = Math.round(data.current_weather.temperature);
                const weatherCode = data.current_weather.weathercode;
                const weatherDesc = getWeatherDescription(weatherCode);
                document.getElementById('weatherInfo').textContent = `${temp}°C, ${weatherDesc}`;
            }
        })
        .catch(() => {
            document.getElementById('weatherInfo').textContent = 'N/A';
        });
}

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
        45: 'Foggy', 48: 'Foggy', 51: 'Light Drizzle', 53: 'Drizzle',
        55: 'Heavy Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow', 95: 'Thunderstorm'
    };
    return weatherCodes[code] || 'Clear';
}

function fetchCityInfo(cityName, cityData) {
    // Get population from OSM data
    const population = cityData.extratags?.population || cityData.address?.population;
    if (population) {
        const popFormatted = parseInt(population).toLocaleString();
        document.getElementById('populationInfo').textContent = popFormatted;
    } else {
        // Fetch from Wikipedia
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`)
            .then(response => response.json())
            .then(data => {
                const extract = data.extract || '';
                const popMatch = extract.match(/population[^0-9]*([0-9,]+)/i);
                if (popMatch) {
                    document.getElementById('populationInfo').textContent = popMatch[1];
                } else {
                    document.getElementById('populationInfo').textContent = 'N/A';
                }
            })
            .catch(() => {
                document.getElementById('populationInfo').textContent = 'N/A';
            });
    }
    
    // Determine city type based on place_rank
    const placeRank = cityData.place_rank || 16;
    let cityType = 'City';
    if (placeRank <= 8) cityType = 'Megacity';
    else if (placeRank <= 12) cityType = 'Major City';
    else if (placeRank <= 16) cityType = 'City';
    else cityType = 'Town';
    document.getElementById('cityType').textContent = cityType;
    
    // Get region info
    const region = cityData.address?.state || cityData.address?.region || cityData.address?.county || 'N/A';
    document.getElementById('regionInfo').textContent = region;
}

function searchPlacesByCategory(city, category, coordinates) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    
    const categoryEmojis = {
        landmark: '🏛️',
        nature: '🌳',
        entertainment: '🎭',
        shopping: '🛍️',
        food: '🍽️',
        culture: '🖼️',
        religion: '⛪',
        waterfront: '🏖️',
        sports: '⚽',
        nightlife: '🎉'
    };
    
    const categoryNames = {
        landmark: 'Heritage Sites',
        nature: 'Natural Wonders',
        entertainment: 'Cultural Venues',
        shopping: 'Shopping Districts',
        food: 'Fine Dining',
        culture: 'Arts & Culture',
        religion: 'Spiritual Sites',
        waterfront: 'Coastal Escapes',
        sports: 'Active Pursuits',
        nightlife: 'Evening Entertainment'
    };
    
    const header = document.createElement('div');
    header.className = 'results-header';
    header.innerHTML = `<h2>${categoryEmojis[category]} ${categoryNames[category]} in ${city}</h2>`;
    placesList.appendChild(header);
    
    fetchFromWikipedia(city, category, placesList, categoryNames);
}

function fetchFromWikipedia(city, category, placesList, categoryNames) {
    const loading = document.createElement('div');
    loading.className = 'no-results';
    loading.textContent = 'Loading results...';
    placesList.appendChild(loading);
    
    const categoryTags = {
        landmark: ['tourism=museum', 'tourism=attraction', 'historic=monument', 'tourism=gallery'],
        nature: ['leisure=park', 'leisure=garden', 'natural=beach', 'leisure=nature_reserve'],
        entertainment: ['amenity=theatre', 'amenity=cinema', 'tourism=theme_park', 'leisure=stadium'],
        shopping: ['shop=mall', 'shop=department_store', 'amenity=marketplace'],
        food: ['amenity=restaurant', 'amenity=cafe', 'amenity=bar'],
        culture: ['tourism=gallery', 'tourism=museum', 'amenity=arts_centre'],
        religion: ['amenity=place_of_worship', 'building=church', 'building=cathedral'],
        waterfront: ['natural=beach', 'leisure=beach_resort', 'tourism=viewpoint'],
        sports: ['leisure=stadium', 'leisure=sports_centre', 'sport=*'],
        nightlife: ['amenity=nightclub', 'amenity=bar', 'amenity=pub']
    };
    
    const tags = categoryTags[category] || categoryTags['landmark'];
    const tagQuery = tags.map(tag => `node["${tag.split('=')[0]}"="${tag.split('=')[1]}"](around:15000,${cityCoordinates.lat},${cityCoordinates.lon});`).join('');
    
    const overpassQuery = `[out:json];(${tagQuery});out body 15;`;
    
    fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery
    })
        .then(response => response.json())
        .then(data => {
            placesList.innerHTML = '';
            const header = document.createElement('div');
            header.className = 'results-header';
            const categoryEmojis = {
                landmark: '🏛️', nature: '🌳', entertainment: '🎭', shopping: '🛍️',
                food: '🍽️', culture: '🖼️', religion: '⛪', waterfront: '🏖️',
                sports: '⚽', nightlife: '🎉'
            };
            header.innerHTML = `<h2>${categoryEmojis[category]} ${categoryNames[category]} in ${city}</h2>`;
            placesList.appendChild(header);
            
            if (data.elements && data.elements.length > 0) {
                const places = data.elements.filter(el => el.tags && el.tags.name).slice(0, 15);
                
                if (places.length > 0) {
                    places.forEach((place, index) => {
                        const card = document.createElement('div');
                        card.className = 'place-card';
                        
                        const description = place.tags.description || place.tags['addr:street'] || `${place.tags.tourism || place.tags.amenity || place.tags.leisure || 'Place'} in ${city}`;
                        const wikiLink = place.tags.wikipedia ? `https://en.wikipedia.org/wiki/${place.tags.wikipedia.split(':')[1]}` : `https://www.google.com/search?q=${encodeURIComponent(place.tags.name + ' ' + city)}`;
                        
                        // Use Unsplash with search query for more relevant images
                        const searchTerm = `${place.tags.name} ${city}`.replace(/[^a-zA-Z0-9 ]/g, '');
                        const imageUrl = `https://source.unsplash.com/400x300/?${encodeURIComponent(searchTerm)}`;
                        
                        card.innerHTML = `
                            <div class="place-image" style="background-image: url('${imageUrl}');"></div>
                            <div class="place-info">
                                <div class="place-number">${index + 1}</div>
                                <div class="place-content">
                                    <h3 class="place-title">
                                        <a href="${wikiLink}" target="_blank">${place.tags.name}</a>
                                    </h3>
                                    <p class="place-description">${description}</p>
                                </div>
                            </div>
                        `;
                        
                        placesList.appendChild(card);
                    });
                } else {
                    const noResults = document.createElement('div');
                    noResults.className = 'no-results';
                    noResults.textContent = `No ${categoryNames[category].toLowerCase()} found for ${city}. Try another category.`;
                    placesList.appendChild(noResults);
                }
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = `No ${categoryNames[category].toLowerCase()} found for ${city}. Try another category.`;
                placesList.appendChild(noResults);
            }
        })
        .catch(() => {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = 'Error fetching data. Please try again.';
            placesList.appendChild(error);
        });
}

async function fetchPlaceImage(placeName, city, category) {
    const categoryFallbacks = {
        landmark: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop',
        nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
        entertainment: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400&h=300&fit=crop',
        shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
        food: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
        culture: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop',
        religion: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop',
        waterfront: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
        sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop',
        nightlife: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop'
    };
    
    try {
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(placeName)}&prop=pageimages&format=json&pithumbsize=400&origin=*`);
        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pages[pageId].thumbnail && pages[pageId].thumbnail.source) {
            return pages[pageId].thumbnail.source;
        }
    } catch (error) {
        // Fallback
    }
    
    return categoryFallbacks[category] || categoryFallbacks['landmark'];
}

function fetchWorldNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="news-loading">Loading world news...</div>';
    
    // Using RSS2JSON service to fetch BBC News
    fetch('https://api.rss2json.com/v1/api.json?rss_url=http://feeds.bbci.co.uk/news/world/rss.xml')
        .then(response => response.json())
        .then(data => {
            if (data.items && data.items.length > 0) {
                const articles = data.items.slice(0, 12).map(item => ({
                    title: item.title,
                    description: item.description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                    url: item.link,
                    urlToImage: item.enclosure?.link || item.thumbnail || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop',
                    source: { name: 'BBC News' },
                    publishedAt: item.pubDate
                }));
                displayNews(articles);
            } else {
                newsContent.innerHTML = '<div class="news-loading">Unable to load news. Please try again later.</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            newsContent.innerHTML = '<div class="news-loading">Unable to load news. Please check your internet connection.</div>';
        });
}

function fetchHalifaxNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="news-loading">Loading Halifax news...</div>';
    
    // Using AllOrigins CORS proxy to fetch Haligonia RSS feed
    fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://haligonia.ca/feed/'))
        .then(response => response.json())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data.contents, 'text/xml');
            const items = xml.querySelectorAll('item');
            
            if (items.length > 0) {
                const articles = Array.from(items).slice(0, 12).map(item => {
                    const title = item.querySelector('title')?.textContent || 'No title';
                    const description = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '#';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const mediaContent = item.querySelector('content');
                    const imageUrl = mediaContent?.getAttribute('url') || 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop';
                    
                    return {
                        title: title,
                        description: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                        url: link,
                        urlToImage: imageUrl,
                        source: { name: 'Haligonia' },
                        publishedAt: pubDate
                    };
                });
                displayNews(articles);
            } else {
                newsContent.innerHTML = '<div class="news-loading">No Halifax news available at the moment.</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching Halifax news:', error);
            // Fallback to sample Halifax news
            displaySampleHalifaxNews();
        });
}

function displaySampleHalifaxNews() {
    const sampleArticles = [
        {
            title: 'Halifax Waterfront Development Updates',
            description: 'Latest updates on the Halifax waterfront development project and upcoming events in the downtown area.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Halifax Events This Weekend',
            description: 'Check out the top events happening in Halifax this weekend including concerts, festivals, and community gatherings.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Halifax Restaurant Scene',
            description: 'Discover the newest restaurants and cafes opening in Halifax, featuring local cuisine and international flavors.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Halifax Public Transit Updates',
            description: 'Important updates regarding Halifax Transit routes, schedules, and new services for commuters.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Halifax Arts and Culture',
            description: 'Explore the vibrant arts and culture scene in Halifax with galleries, theaters, and live performances.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Halifax Weather Forecast',
            description: 'Stay updated with the latest weather conditions and forecasts for Halifax and surrounding areas.',
            url: 'https://haligonia.ca',
            urlToImage: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?w=400&h=300&fit=crop',
            source: { name: 'Haligonia' },
            publishedAt: new Date().toISOString()
        }
    ];
    displayNews(sampleArticles);
}

function fetchPathankotNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="news-loading">Loading Pathankot news...</div>';
    
    // Using AllOrigins CORS proxy to fetch Tribune India news
    fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.tribuneindia.com/rss/punjab'))
        .then(response => response.json())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data.contents, 'text/xml');
            const items = xml.querySelectorAll('item');
            
            if (items.length > 0) {
                const articles = Array.from(items).slice(0, 12).map(item => {
                    const title = item.querySelector('title')?.textContent || 'No title';
                    const description = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '#';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const mediaContent = item.querySelector('media\\:content, content');
                    const imageUrl = mediaContent?.getAttribute('url') || 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop';
                    
                    return {
                        title: title,
                        description: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                        url: link,
                        urlToImage: imageUrl,
                        source: { name: 'The Tribune - Punjab' },
                        publishedAt: pubDate
                    };
                });
                displayNews(articles);
            } else {
                newsContent.innerHTML = '<div class="news-loading">No Pathankot news available at the moment.</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching Pathankot news:', error);
            // Fallback to sample Pathankot news
            displaySamplePathankotNews();
        });
}

function displaySamplePathankotNews() {
    const sampleArticles = [
        {
            title: 'Pathankot Development Projects',
            description: 'Latest infrastructure and development projects underway in Pathankot, Punjab to boost local economy.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Pathankot Tourism Updates',
            description: 'Explore the growing tourism sector in Pathankot with new attractions and heritage sites.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Punjab Agriculture News',
            description: 'Latest updates on agriculture sector in Punjab including Pathankot region farming developments.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Pathankot Education Sector',
            description: 'New educational initiatives and institutions opening in Pathankot to serve local students.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Punjab Cultural Events',
            description: 'Upcoming cultural festivals and events in Punjab including celebrations in Pathankot.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Pathankot Transportation',
            description: 'Updates on railway and road connectivity improvements in Pathankot region.',
            url: 'https://www.tribuneindia.com',
            urlToImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop',
            source: { name: 'The Tribune - Punjab' },
            publishedAt: new Date().toISOString()
        }
    ];
    displayNews(sampleArticles);
}

function fetchNepalNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="news-loading">Loading Nepal news...</div>';
    
    // Using AllOrigins CORS proxy to fetch Kathmandu Post RSS feed
    fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://kathmandupost.com/rss'))
        .then(response => response.json())
        .then(data => {
            const parser = new DOMParser();
            const xml = parser.parseFromString(data.contents, 'text/xml');
            const items = xml.querySelectorAll('item');
            
            if (items.length > 0) {
                const articles = Array.from(items).slice(0, 12).map(item => {
                    const title = item.querySelector('title')?.textContent || 'No title';
                    const description = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '#';
                    const pubDate = item.querySelector('pubDate')?.textContent || '';
                    const mediaContent = item.querySelector('media\\:content, content');
                    const imageUrl = mediaContent?.getAttribute('url') || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
                    
                    return {
                        title: title,
                        description: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
                        url: link,
                        urlToImage: imageUrl,
                        source: { name: 'Kathmandu Post' },
                        publishedAt: pubDate
                    };
                });
                displayNews(articles);
            } else {
                newsContent.innerHTML = '<div class="news-loading">No Nepal news available at the moment.</div>';
            }
        })
        .catch(error => {
            console.error('Error fetching Nepal news:', error);
            // Fallback to sample Nepal news
            displaySampleNepalNews();
        });
}

function displaySampleNepalNews() {
    const sampleArticles = [
        {
            title: 'Nepal Tourism Recovery',
            description: 'Nepal tourism sector shows strong recovery with increasing number of international visitors to Himalayas.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Kathmandu Development Projects',
            description: 'Major infrastructure development projects underway in Kathmandu to improve urban facilities.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1571898223382-8f0b8e6c5c5f?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Nepal Cultural Heritage',
            description: 'UNESCO recognizes Nepal efforts in preserving ancient cultural heritage sites and monuments.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Everest Expedition Season',
            description: 'Mount Everest climbing season begins with hundreds of mountaineers preparing for summit attempts.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Nepal Education Reforms',
            description: 'Government announces new education reforms to improve quality of education across Nepal.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        },
        {
            title: 'Nepal Festivals and Celebrations',
            description: 'Traditional festivals bring communities together across Nepal with colorful celebrations.',
            url: 'https://kathmandupost.com',
            urlToImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
            source: { name: 'Kathmandu Post' },
            publishedAt: new Date().toISOString()
        }
    ];
    displayNews(sampleArticles);
}

function displayNews(articles) {
    const newsContent = document.getElementById('newsContent');
    const newsGrid = document.createElement('div');
    newsGrid.className = 'news-grid';
    
    articles.forEach(article => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        const imageUrl = article.urlToImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop';
        const date = new Date(article.publishedAt).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        newsCard.innerHTML = `
            <div class="news-image" style="background-image: url('${imageUrl}');"></div>
            <div class="news-content">
                <div class="news-source">${article.source.name || 'News'}</div>
                <h3 class="news-title">
                    <a href="${article.url}" target="_blank">${article.title}</a>
                </h3>
                <p class="news-description">${article.description || ''}</p>
                <div class="news-date">${date}</div>
            </div>
        `;
        
        newsGrid.appendChild(newsCard);
    });
    
    newsContent.innerHTML = '';
    newsContent.appendChild(newsGrid);
}

