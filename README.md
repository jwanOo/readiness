# 🤖 AI Readiness Check - Enterprise Edition

A comprehensive SAP AI Readiness assessment tool featuring AI-powered recommendations, intelligent chat assistants, and collaborative assessment capabilities.

🌐 **Live Demo:** [https://jwanoo.github.io/ai-readiness-check/](https://jwanoo.github.io/ai-readiness-check/)

## ✨ Key Features

### 🤖 AI-Powered Features
- **Silava AI Assistant** - Floating chat assistant with streaming responses
  - Multi-conversation support (create, switch, delete chat sessions)
  - Chat titles auto-generated from first user prompt
  - Context-aware responses based on current section and answers
  - RAG integration with Supabase database
  - Supports both German and English

- **Smart AI Recommendations** - Real-time, section-specific recommendations
  - Analyzes answers as you type
  - Provides 4 actionable insights per section
  - Background processing without interrupting workflow
  - Industry-specific recommendations

### 📊 Assessment Features
- 🔐 **User Authentication** (Email/Password, Magic Link)
- 👥 **Collaborative Assessments** - Multiple team members can work on different sections
- 📊 **20+ Industry-specific questionnaires** (Insurance, Banking, Healthcare, etc.)
- 📈 **Automated AI Readiness Scoring** (SAP, BTP, Data dimensions)
- 📄 **Bilingual Export** - Word/PDF in German or English
- 📈 **Analytics Dashboard** - Customer insights and comparisons

### 🎨 User Experience
- Modern, responsive UI with Outfit font
- Dark/Light mode support
- Real-time progress tracking
- Sticky navigation sidebar
- Mobile-friendly design

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/jwanOo/ai-readiness-check.git
cd ai-readiness-check
npm install
```

### 2. Set up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the schema from `supabase/schema.sql`
4. Go to **Authentication > Providers** and enable **Email**
5. Go to **Project Settings > API** and copy your credentials

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Locally
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 📁 Project Structure

```
ai-readiness-check/
├── src/
│   ├── components/
│   │   ├── AIReadinessCheck.jsx    # Main assessment form
│   │   ├── Dashboard.jsx           # Assessment list & management
│   │   ├── Analytics.jsx           # Analytics dashboard
│   │   ├── SectionAIPanel.jsx      # AI chat assistant (Assessment)
│   │   ├── AnalyticsAIPanel.jsx    # AI chat assistant (Analytics)
│   │   ├── SectionRecommendations.jsx # AI recommendations panel
│   │   ├── Recommendations.jsx     # Full recommendations view
│   │   └── Login.jsx               # Authentication UI
│   ├── contexts/
│   │   └── AuthContext.jsx         # Authentication state
│   ├── lib/
│   │   ├── supabase.js             # Supabase client
│   │   ├── aiService.js            # AI API integration
│   │   ├── recommendationService.js # Recommendation generation
│   │   ├── scoring.js              # AI Readiness scoring
│   │   ├── pdfExport.js            # PDF/Word export
│   │   └── constants.js            # Industries & sections
│   ├── App.jsx                     # Main app with routing
│   └── main.jsx                    # Entry point
├── supabase/
│   └── schema.sql                  # Database schema
├── .env.example                    # Environment template
└── package.json
```

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase Auth) |
| `assessments` | Assessment instances (customer, industry, status) |
| `section_assignments` | Who is assigned to which section |
| `answers` | Individual question responses |

## 🤖 AI Integration

### Architecture (Secure)
The AI integration uses a **secure proxy architecture** to protect API keys:

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  React App      │────▶│  Supabase Edge       │────▶│  adesso AI Hub  │
│  (gh-pages)     │     │  Function (ai-proxy) │     │  API            │
│                 │◀────│  [API Key in secrets]│◀────│                 │
│  No API key!    │     │                      │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

**Security Features:**
- ✅ API key stored in Supabase Secrets (server-side only)
- ✅ Never exposed in frontend JavaScript bundle
- ✅ CORS protection for allowed origins
- ✅ Request validation in Edge Function

### Silava AI Assistant
The AI assistant uses the adesso-ai-hub API with the `gpt-oss-120b-sovereign` model:
- **Assessment Page**: Context-aware help for each section
- **Analytics Page**: Query customer data and get insights
- **Multi-chat**: Create multiple conversations with auto-generated titles
- **RAG**: Retrieval-Augmented Generation with Supabase data

### AI Recommendations
Real-time recommendations generated based on:
- Current section answers
- Industry context
- SAP best practices
- AI readiness benchmarks

### Setting Up AI (Required for AI Features)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login and Link Project**
   ```bash
   supabase login
   supabase link --project-ref fcpceywaszttgwdwirao
   ```

3. **Set the AI Hub API Key as a Secret**
   ```bash
   supabase secrets set ADESSO_AI_HUB_API_KEY=your-api-key-here
   ```

4. **Deploy the Edge Function**
   ```bash
   supabase functions deploy ai-proxy
   ```

5. **Verify Deployment**
   ```bash
   supabase functions list
   ```

> ⚠️ **Important**: Never commit API keys to the repository. The key should only exist in Supabase Secrets.

## 🔐 Authentication

The app supports:
- **Email/Password** - Traditional login
- **Magic Link** - Passwordless email login
- **Microsoft SSO** - (Optional) For enterprise Azure AD integration

## 👥 Collaborative Features

1. **Create Assessment** - Start a new assessment for a customer
2. **Assign Sections** - Delegate sections to team members
3. **Track Progress** - See who completed what
4. **Real-time Updates** - Changes sync across users

## 🏭 Supported Industries

- 🛡️ Insurance / Reinsurance
- 🏦 Banking / Financial Services
- 🏥 Healthcare
- 🚗 Automotive
- ⚙️ Manufacturing
- 🛒 Retail
- ⚡ Energy / Utilities
- 🏛️ Public Sector
- 💊 Life Sciences / Pharma
- 🎰 Lottery / Gaming
- 🚆 Transport & Logistics
- 🎬 Media & Entertainment
- 🎖️ Defense
- 🍽️ Food & Beverage
- 🏗️ Construction
- 🏟️ Trade Fairs & Sports
- 📡 Telecom
- 💼 Professional Services
- 🧪 Chemical / Process Industries

## 📄 Export Options

Export assessments in multiple formats:
- **Word (.doc)** - Editable document
- **PDF** - Print-ready format
- **Languages**: German 🇩🇪 or English 🇬🇧

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Inline styles with Outfit font
- **Database**: Supabase (PostgreSQL)
- **AI**: adesso-ai-hub API (gpt-oss-120b-sovereign)
- **Deployment**: GitHub Pages
- **Export**: html2canvas, jsPDF

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

---

Built with ❤️ by J-1