# 🤖 adesso AI Readiness Check

A React-based web application for conducting AI readiness assessments for SAP customers across different industries.

![AI Readiness Check](https://img.shields.io/badge/React-19.2-blue) ![Vite](https://img.shields.io/badge/Vite-7.3-purple) ![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

- **Industry-specific questionnaires** for 8 major industries (Insurance, Banking, Healthcare, Automotive, Manufacturing, Retail, Energy, Public Sector)
- **AI Readiness Assessment** with automatic scoring across 3 dimensions:
  - SAP System Readiness
  - BTP & AI Platform Readiness
  - Data Maturity
- **Progress tracking** with visual indicators
- **Summary view** with detailed results
- **Responsive design** for desktop and tablet

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)
- A [GitHub](https://github.com/) account

## 🛠️ Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-readiness-check.git
   cd ai-readiness-check
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5173`

## 🌐 Deploy to GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** icon → **New repository**
3. Name it `ai-readiness-check`
4. Keep it **Public** (required for free GitHub Pages)
5. **Don't** initialize with README (we already have one)
6. Click **Create repository**

### Step 2: Update Configuration

1. Open `package.json` and replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:
   ```json
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/ai-readiness-check"
   ```

### Step 3: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: AI Readiness Check app"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ai-readiness-check.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Step 4: Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
1. Build the production version
2. Push it to a `gh-pages` branch
3. GitHub will automatically serve it

### Step 5: Enable GitHub Pages (if not automatic)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select **Deploy from a branch**
4. Select `gh-pages` branch and `/ (root)` folder
5. Click **Save**

### Step 6: Access Your Site

After a few minutes, your site will be live at:
```
https://YOUR_USERNAME.github.io/ai-readiness-check/
```

## 📁 Project Structure

```
ai-readiness-check/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── dist/                # Production build (generated)
├── package.json         # Dependencies and scripts
├── vite.config.js       # Vite configuration
└── README.md            # This file
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Deploy to GitHub Pages |

## 🎨 Customization

### Adding More Industries

Edit `src/App.jsx` and add entries to the `INDUSTRIES` object:

```javascript
const INDUSTRIES = {
  // ... existing industries
  newIndustry: {
    label: "New Industry",
    icon: "🆕",
    color: "#123456",
    desc: "Description here",
    country: "DE + CH"
  }
};
```

### Adding More Questions

Edit the `SECTIONS` array in `src/App.jsx`:

```javascript
const SECTIONS = [
  // ... existing sections
  {
    id: "newSection",
    title: "📌 New Section",
    questions: [
      { q: "Your question?", hint: "Optional hint" },
      // ... more questions
    ]
  }
];
```

## 📄 License

MIT License - feel free to use and modify for your needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ using React + Vite