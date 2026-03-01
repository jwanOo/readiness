# 🤖 AI Readiness Check - Enterprise Edition

A comprehensive SAP AI Readiness assessment tool for adesso consultants, featuring:
- 🔐 **User Authentication** (Email/Password, Magic Link)
- 👥 **Collaborative Assessments** - Multiple team members can work on different sections
- 📊 **19 Industry-specific questionnaires** (Insurance, Banking, Healthcare, etc.)
- 📈 **Automated AI Readiness Scoring**
- 📄 **Export to Word/PDF**
- 🔄 **Real-time collaboration** (coming soon)

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
│   │   ├── AIReadinessCheck.jsx  # Main assessment form
│   │   ├── Dashboard.jsx         # Assessment list & management
│   │   └── Login.jsx             # Authentication UI
│   ├── contexts/
│   │   └── AuthContext.jsx       # Authentication state
│   ├── lib/
│   │   └── supabase.js           # Supabase client
│   ├── App.jsx                   # Main app with routing
│   └── main.jsx                  # Entry point
├── supabase/
│   └── schema.sql                # Database schema
├── .env.example                  # Environment template
└── package.json
```

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase Auth) |
| `assessments` | Assessment instances (customer, industry, status) |
| `section_assignments` | Who is assigned to which section |
| `answers` | Individual question responses |

## 🔐 Authentication

The app supports:
- **Email/Password** - Traditional login
- **Magic Link** - Passwordless email login
- **Microsoft SSO** - (Optional) For enterprise Azure AD integration

## 👥 Collaborative Features

1. **Create Assessment** - Start a new assessment for a customer
2. **Assign Sections** - Delegate sections to team members
3. **Track Progress** - See who completed what
4. **Real-time Updates** - Changes sync across users (coming soon)

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

## 📄 License

Internal use only - adesso SE

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

---

Built with ❤️ by adesso