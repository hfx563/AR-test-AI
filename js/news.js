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
    
    document.getElementById('closeNewsBtn').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
    
    document.getElementById('newsModalOverlay').addEventListener('click', function() {
        document.getElementById('newsModal').style.display = 'none';
    });
}
