let selectedCategory = null;
let currentCity = null;

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
                    list.style.listStyle = 'none';
                    list.style.padding = '0';
                    list.style.margin = '0';
                    data.geonames.forEach(city => {
                        const item = document.createElement('li');
                        item.textContent = city.name + ', ' + city.countryName;
                        item.style.cursor = 'pointer';
                        item.style.padding = '8px';
                        item.style.color = '#333';
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

function searchCity(city) {
    if (!city) {
        return;
    }

    currentCity = city;
    
    const cityInfoSection = document.getElementById('cityInfoSection');
    const categoriesSection = document.getElementById('categoriesSection');
    const resultsSection = document.getElementById('resultsSection');
    
    cityInfoSection.style.display = 'block';
    categoriesSection.style.display = 'block';
    resultsSection.style.display = 'block';
    
    document.getElementById('cityName').textContent = city;
    
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    const div = document.createElement('div');
    div.className = 'no-results';
    div.textContent = 'Select a category above to explore places.';
    placesList.appendChild(div);
    
    categoriesSection.scrollIntoView({ behavior: 'smooth' });
}

function fetchPlacesByCategory(city, category) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'news-loading';
    loadingDiv.textContent = 'Loading places...';
    placesList.appendChild(loadingDiv);

    const categoryKeywords = {
        landmark: 'landmark monument museum castle historic',
        nature: 'park garden zoo nature botanical',
        entertainment: 'theatre cinema amusement park',
        shopping: 'shopping mall market',
        food: 'restaurant cafe bar pub food',
        culture: 'art gallery library festival',
        religion: 'church temple mosque worship',
        waterfront: 'beach marina waterfront lake river',
        sports: 'stadium sports gym pitch',
        nightlife: 'nightclub bar pub nightlife'
    };

    const keyword = categoryKeywords[category] || '';
    const searchQuery = `${city} ${keyword}`;

    fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`)
        .then(response => response.json())
        .then(data => {
            placesList.innerHTML = '';
            if (data.query && data.query.search && data.query.search.length > 0) {
                data.query.search.slice(0, 10).forEach((article, index) => {
                    const placeCard = document.createElement('div');
                    placeCard.className = 'place-card';
                    
                    const placeImage = document.createElement('div');
                    placeImage.className = 'place-image';
                    placeImage.style.backgroundImage = `url('https://source.unsplash.com/400x280/?${encodeURIComponent(city + ' ' + article.title)}')`;
                    
                    const placeInfo = document.createElement('div');
                    placeInfo.className = 'place-info';
                    
                    const placeNumber = document.createElement('div');
                    placeNumber.className = 'place-number';
                    placeNumber.textContent = String(index + 1).padStart(2, '0');
                    
                    const placeContent = document.createElement('div');
                    placeContent.className = 'place-content';
                    
                    const placeTitle = document.createElement('h3');
                    placeTitle.className = 'place-title';
                    placeTitle.innerHTML = `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}" target="_blank">${article.title}</a>`;
                    
                    const placeDescription = document.createElement('p');
                    placeDescription.className = 'place-description';
                    placeDescription.textContent = article.snippet.replace(/(<([^>]+)>)/gi, '');
                    
                    placeContent.appendChild(placeTitle);
                    placeContent.appendChild(placeDescription);
                    placeInfo.appendChild(placeNumber);
                    placeInfo.appendChild(placeContent);
                    placeCard.appendChild(placeImage);
                    placeCard.appendChild(placeInfo);
                    placesList.appendChild(placeCard);
                });
            } else {
                const noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = `No results found for ${category} in ${city}.`;
                placesList.appendChild(noResults);
            }
        })
        .catch(() => {
            placesList.innerHTML = '';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = 'Error fetching data. Please try again.';
            placesList.appendChild(errorDiv);
        });
}

window.onload = function() {
    createCityAutocomplete();

    document.getElementById('searchButton').addEventListener('click', function() {
        const city = document.getElementById('cityInput').value.trim();
        searchCity(city);
    });

    document.getElementById('cityInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const city = document.getElementById('cityInput').value.trim();
            searchCity(city);
        }
    });

    document.querySelectorAll('.category-card').forEach(cat => {
        cat.addEventListener('click', function() {
            const city = document.getElementById('cityInput').value.trim();
            
            if (!city) {
                const placesList = document.getElementById('placesList');
                placesList.innerHTML = '';
                const resultsSection = document.getElementById('resultsSection');
                resultsSection.style.display = 'block';
                const div = document.createElement('div');
                div.className = 'no-results';
                div.textContent = 'Please enter a city name first.';
                placesList.appendChild(div);
                return;
            }

            document.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
            cat.classList.add('selected');
            
            selectedCategory = cat.getAttribute('data-category');
            
            const resultsSection = document.getElementById('resultsSection');
            resultsSection.style.display = 'block';
            
            fetchPlacesByCategory(city, selectedCategory);
        });
    });
};
