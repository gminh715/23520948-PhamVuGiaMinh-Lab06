# ⚽ Premier League AI Assistant

An intelligent AI-powered knowledge base for English Premier League history (1992-2025) built with Next.js 15, Groq AI, and PostgreSQL. Ask questions about EPL champions, rankings, memorable moments, and get instant AI-generated answers using Retrieval-Augmented Generation (RAG).

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript)
![Groq](https://img.shields.io/badge/Groq-AI-orange?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-blue?style=flat-square&logo=postgresql)

## 🌟 Features

- **🤖 AI-Powered Chat**: Ask questions in natural language and get accurate answers from Premier League history
- **📚 RAG Architecture**: Retrieval-Augmented Generation ensures responses are grounded in actual EPL data
- **🔍 Smart Text Search**: Intelligent keyword-based search across 33 years of Premier League history
- **⚡ Real-time Streaming**: Instant AI responses with streaming for better user experience
- **🏆 Comprehensive Data**: Complete EPL history from 1992-2025 including champions, rankings, and milestones
- **🎨 Modern UI**: Beautiful, responsive interface built with Tailwind CSS and Next.js 15

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router with Server Actions
- **React 19** - Latest React features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Markdown** - Rich text rendering

### Backend
- **Groq AI** - Fast LLM inference (llama-3.1-8b-instant)
- **PostgreSQL** - Database with pgvector extension
- **Node.js** - Server runtime

### Libraries
- `groq-sdk` - Official Groq SDK
- `pg` - PostgreSQL client
- `pgvector` - Vector similarity search
- `zod` - Schema validation

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (with pgvector extension)
- Groq API key (get it from [Groq Console](https://console.groq.com))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd web-capstone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# PostgreSQL Database URL
POSTGRES_URL="postgresql://user:password@host:port/database"

# Groq API Key (get from https://console.groq.com)
GROQ_API_KEY="your_groq_api_key_here"

# Optional: Rate Limiting
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_MS=60000

# Optional: Database timeout
CLIENT_TIMEOUT_MS=120000
```

### 4. Set Up Database

Create the required tables:

```bash
npm run db:setup
```

This will create:
- `documents` table with pgvector extension
- Indexes for efficient querying

### 5. Import Premier League Data

Import the knowledge base from the markdown file:

```bash
npm run import:md
```

This imports all sections from `premier_league_rankings_knowledge_base_1992_2025.md` into the database.

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
web-capstone/
├── src/
│   ├── app/
│   │   ├── api/chat/           # Chat API endpoint (Groq streaming)
│   │   ├── page.tsx            # Homepage
│   │   ├── layout.tsx          # Root layout
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── AskAIButton.tsx     # AI chat trigger button
│   │   ├── AskAIWidget.tsx     # Chat widget component
│   │   └── FeatureCard.tsx     # Feature display card
│   ├── lib/
│   │   ├── ai/
│   │   │   └── rag.ts          # RAG implementation
│   │   ├── db/
│   │   │   └── schema.ts       # Database operations
│   │   └── actions/
│   │       └── docs.ts         # Server actions
│   └── middleware.ts           # Next.js middleware
├── scripts/
│   ├── setup-db.mjs            # Database setup script
│   ├── import-markdown.mjs     # Import MD to database
│   └── seed-docs.mjs           # Seed sample data
├── public/
│   └── epl-logo.png            # Premier League logo
├── premier_league_rankings_knowledge_base_1992_2025.md
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.ts
```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:setup` | Create database tables |
| `npm run import:md` | Import markdown knowledge base |
| `npm run import:md:test` | Test import script |

## 💡 How It Works

### RAG Pipeline

1. **User Query**: User asks a question like "Who won in 2004?"
2. **Context Retrieval**: System searches PostgreSQL database using text search
3. **Context Ranking**: Results are ranked by relevance
4. **Prompt Building**: Retrieved context + user query = enhanced prompt
5. **AI Generation**: Groq AI generates answer based on retrieved context
6. **Streaming Response**: Answer is streamed back to user in real-time

### Text Search Algorithm

The system uses intelligent keyword-based search:
- Extracts keywords from user query
- Searches across title, section, and content fields
- Uses OR-based matching for flexibility
- Ranks results by relevance score
- Falls back to broader search if no results found

### Database Schema

```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    section TEXT,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 API Usage

### Chat Endpoint

**POST** `/api/chat`

Request:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Who won the Premier League in 2004?"
    }
  ]
}
```

Response: Text stream (real-time)

## 🧪 Testing Queries

Try these questions to test the AI:

- "Who won the Premier League in 2003-04 and why was it special?"
- "Tell me about Arsenal's Invincibles season"
- "Which club dominated the Premier League after 2017?"
- "What was Leicester City's achievement in 2015-16?"
- "Explain how teams are ranked in the Premier League"
- "Tell me about relegation and promotion rules"

## 🎨 UI Components

### AskAIWidget
Interactive chat widget with:
- Message history
- Streaming responses
- Markdown rendering
- Auto-scroll

### Header
Responsive navigation with:
- Premier League branding
- Logo display
- Quick actions

## 📊 Database Management

### View Documents
```bash
psql $POSTGRES_URL -c "SELECT id, title, section FROM documents;"
```

### Search Test
```bash
psql $POSTGRES_URL -c "SELECT title, section FROM documents WHERE content ILIKE '%Arsenal%' LIMIT 5;"
```

### Reset Database
```bash
npm run db:setup
npm run import:md
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq API key | Yes |
| `RATE_LIMIT_REQUESTS` | Max requests per window | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | No |
| `CLIENT_TIMEOUT_MS` | Database timeout (ms) | No |

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `POSTGRES_URL` is correct
- Check database is accessible
- Ensure pgvector extension is installed

### No Search Results
- Verify data was imported: `npm run import:md`
- Check database has documents
- Try different query phrasing

### Groq API Errors
- Verify API key is valid
- Check rate limits
- Ensure proper network connectivity

## 📝 Knowledge Base

The project includes a comprehensive Premier League knowledge base covering:
- 33 seasons (1992-2025)
- All champions and title wins
- Famous milestones (Invincibles, Leicester's miracle, etc.)
- Ranking systems and rules
- Relegation and promotion mechanics

## 🤝 Contributing

This is a capstone project. Contributions, issues, and feature requests are welcome!

## 📄 License

This project is for educational purposes as part of a capstone project.

## 🙏 Acknowledgments

- Premier League historical data
- Groq for fast AI inference
- Next.js team for amazing framework
- PostgreSQL & pgvector for powerful search

## 📧 Contact

For questions or feedback about this capstone project, please reach out through the project repository.

---

**Built with ⚽ for Premier League fans and AI enthusiasts**
