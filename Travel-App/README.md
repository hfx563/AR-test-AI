# 🌍 Luxe Travel - Public Travel Guide App

A beautiful, secure travel guide application that's publicly accessible without any registration required.

## ✨ Features

- 🔍 Search cities worldwide with autocomplete
- 📊 View city information (weather, population, region)
- 🏛️ Explore places by category (Heritage, Nature, Dining, Arts, etc.)
- 📰 Read news from World, Halifax, Pathankot, and Nepal
- 😊 Special celebration feature
- 📱 Fully responsive mobile design
- 🔒 Secure and rate-limited API calls

## 🚀 Quick Deploy (Choose One)

### Option 1: Netlify Drop (No Registration - 2 minutes)
1. Go to: https://app.netlify.com/drop
2. Drag all files from `app/` folder
3. Get instant URL!

📖 Guide: `Documentation/NETLIFY_FREE.md`

### Option 2: GitHub Pages (Free Custom URL)
1. Create GitHub account
2. Run: `Scripts/setup-git-link.bat`
3. Enable GitHub Pages

📖 Guide: `Documentation/NEXT_STEPS.md`

### Option 3: Manual Upload
1. Create GitHub repository
2. Upload files from `app/` folder
3. Enable Pages

📖 Guide: `Documentation/MANUAL_UPLOAD.md`

## 📁 Project Structure

```
├── app/                    # Deploy this folder
│   ├── index.html         # Main HTML
│   ├── app.js             # JavaScript
│   ├── style.css          # Styling
│   └── ...                # Other app files
│
├── Documentation/          # All guides
│   ├── QUICK_START.md     # 5-minute setup
│   ├── NETLIFY_FREE.md    # No registration deploy
│   ├── DEPLOY_GUIDE.html  # Visual guide
│   └── ...                # More guides
│
└── Scripts/               # Helper scripts
    ├── sync-to-github.bat # Sync changes
    └── ...                # More scripts
```

## 🔒 Security Features

- ✅ HTTPS enabled by default
- ✅ Content Security Policy headers
- ✅ Rate limiting to prevent abuse
- ✅ XSS protection
- ✅ No user data collection
- ✅ No registration required
- ✅ CORS-enabled secure API calls

## 📖 Documentation

### Getting Started
- **[Visual Guide](Documentation/DEPLOY_GUIDE.html)** - Click to open in browser
- **[Quick Start](Documentation/QUICK_START.md)** - Deploy in 5 minutes
- **[Netlify Free](Documentation/NETLIFY_FREE.md)** - No registration needed

### Deployment Options
- **[GitHub Desktop Guide](Documentation/GITHUB_DESKTOP_GUIDE.md)** - Use GitHub Desktop
- **[Manual Upload](Documentation/MANUAL_UPLOAD.md)** - Upload via web
- **[Full Deployment Guide](Documentation/DEPLOYMENT.md)** - Complete instructions

### Advanced
- **[Custom Domain](Documentation/CUSTOM_DOMAIN.md)** - Setup custom URL
- **[Git Workflow](Documentation/GIT_WORKFLOW.md)** - Local to GitHub sync
- **[Changes Summary](Documentation/CHANGES_SUMMARY.md)** - What was added

## 🛠️ Helper Scripts

Located in `Scripts/` folder:

- `sync-to-github.bat` - Sync all changes to GitHub
- `push-changes.bat` - Push updates to GitHub
- `pull-changes.bat` - Pull changes from GitHub
- `setup-git-link.bat` - Initial Git setup
- `upload-to-github.bat` - First time upload

## 🛠️ Tech Stack

- Pure HTML, CSS, JavaScript (no frameworks)
- Free public APIs (GeoNames, OpenStreetMap, Open-Meteo, Wikipedia)
- Static hosting (no backend required)

## 🌐 Live Demo

Deploy your own instance to see it in action!

Your URL will be:
- Netlify: `https://your-name.netlify.app`
- GitHub Pages: `https://YOUR_USERNAME.github.io/travel-guide-app/`
- Custom Domain: `https://yourdomain.com`

## 📝 License

Free to use and modify for personal and commercial projects.

---

## 🎯 Next Steps

1. **Open**: `Documentation/DEPLOY_GUIDE.html` (visual guide)
2. **Or read**: `Documentation/NETLIFY_FREE.md` (fastest method)
3. **Deploy** your app in 2 minutes!

---

Made with ❤️ for travelers worldwide
