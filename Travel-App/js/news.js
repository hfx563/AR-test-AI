// News Module
function fetchWorldNews() {
    const newsContent = document.getElementById('newsContent');
    newsContent.innerHTML = '<div class="news-loading">Loading world news...</div>';
    
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
    displaySampleHalifaxNews();
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
    displaySamplePathankotNews();
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
    displaySampleNepalNews();
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

function initNews() {
    document.getElementById('worldNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'World News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchWorldNews();
    });
    
    document.getElementById('halifaxNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Halifax News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchHalifaxNews();
    });
    
    document.getElementById('pathankotNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Pathankot, Punjab News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchPathankotNews();
    });
    
    document.getElementById('nepalNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModalTitle').textContent = 'Nepal News';
        document.getElementById('newsModal').style.display = 'flex';
        fetchNepalNews();
    });
    
    document.getElementById('closeNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
    
    document.getElementById('newsModalOverlay').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
}
