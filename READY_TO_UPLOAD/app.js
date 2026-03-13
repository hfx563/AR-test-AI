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
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '';
    
    if (!city) {
        const li = document.createElement('li');
        li.textContent = 'Please enter a city name.';
        placesList.appendChild(li);
        return;
    }

    currentCity = city;
    const li = document.createElement('li');
    li.textContent = `Searching for "${city}"... Please select a category above to see places.`;
    placesList.appendChild(li);
}

function fetchPlacesByCategory(city, category) {
    const placesList = document.getElementById('placesList');
    placesList.innerHTML = '<li>Loading...</li>';

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
                data.query.search.slice(0, 10).forEach(article => {
                    const li = document.createElement('li');
                    li.innerHTML = `<a href="https://en.wikipedia.org/wiki/${encodeURIComponent(article.title.replace(/ /g, '_'))}" target="_blank" style="color:#1976d2;text-decoration:none;font-weight:bold;">${article.title}</a><br><span style="font-size:0.9em;color:#666;">${article.snippet.replace(/(<([^>]+)>)/gi, '')}</span>`;
                    placesList.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = `No results found for ${category} in ${city}.`;
                placesList.appendChild(li);
            }
        })
        .catch(() => {
            placesList.innerHTML = '';
            const li = document.createElement('li');
            li.textContent = 'Error fetching data. Please try again.';
            placesList.appendChild(li);
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

    document.querySelectorAll('.category').forEach(cat => {
        cat.addEventListener('click', function() {
            const city = document.getElementById('cityInput').value.trim();
            
            if (!city) {
                const placesList = document.getElementById('placesList');
                placesList.innerHTML = '<li>Please enter a city name first.</li>';
                return;
            }

            document.querySelectorAll('.category').forEach(c => c.classList.remove('selected'));
            cat.classList.add('selected');
            
            selectedCategory = cat.getAttribute('data-category');
            fetchPlacesByCategory(city, selectedCategory);
        });
    });
};
