# RHW Research & Knowledge Base

A firm-wide research database for RHW CPAs that stores research memos, SOPs, and company policies with approval workflow, fuzzy search, and M365 SSO.

## Features

- **Private Q&A Transcripts** - Hidden from staff, visible to admin only
- **Fuzzy/Contextual Search** - Search across all content
- **Approval Workflow** - Pending → Approved → Superseded
- **M365 SSO** - Silent authentication via Azure Entra ID
- **Liquid Glass Design** - Dark theme with frosted glass surfaces and colored glow accents

## Tech Stack

- **Frontend:** React 19 + Vite
- **Backend:** Azure Functions (Node.js)
- **Database:** Cosmos DB
- **Auth:** Microsoft Entra ID
- **Deployment:** Vercel (frontend), Azure (backend)

## Project Structure

```
rhw-research-db/
├── frontend/              # React + Vite application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── lib/          # Utilities
│   │   ├── hooks/        # Custom hooks
│   │   ├── context/      # React context
│   │   ├── styles/       # Global styles & glass utilities
│   │   ├── main.jsx      # Entry point
│   │   └── App.jsx       # Root component
│   ├── index.html        # HTML template
│   ├── vite.config.js    # Vite configuration
│   ├── .env.example      # Environment variables template
│   └── package.json      # Dependencies
├── api/                  # Azure Functions API
│   ├── src/
│   │   ├── functions/    # Function implementations
│   │   ├── lib/          # Utilities
│   │   └── models/       # Data models
│   ├── local.settings.json.example
│   └── package.json      # Dependencies
└── package.json          # Monorepo configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Azure Cosmos DB instance
- Azure Functions Core Tools (for local development)

### Installation

1. Clone the repository
```bash
git clone <repo-url>
cd rhw-research-db
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# API
cp api/local.settings.json.example api/local.settings.json
```

4. Update `.env.local` and `local.settings.json` with your Azure credentials

### Development

Start both frontend and API:
```bash
npm run dev
```

Or run separately:
```bash
# Frontend only (http://localhost:3000)
npm run dev:frontend

# API only (http://localhost:7071)
npm run dev:api
```

### Build

```bash
npm run build
```

### Testing

```bash
npm test
```

## Implementation Phases

- **Phase 1:** Foundation - Project structure & dependencies ✓
- **Phase 2:** Cosmos DB schema setup
- **Phase 3:** Authentication & M365 SSO
- **Phase 4:** Core search functionality
- **Phase 5:** Document upload & storage
- **Phase 6:** Approval workflow
- **Phase 7:** Admin panel
- **Phase 8:** Deployment & launch

## Design System

The frontend uses a liquid glass aesthetic with these utility classes:

- `.glass` - Standard glass surface
- `.glass-heavy` - Thick frosted glass
- `.glass-input` - Input field styling
- `.glass-button` - Button styling with hover effects
- `.glass-modal` - Modal dialog styling
- `.glow-amber`, `.glow-sky`, `.glow-emerald`, `.glow-zinc` - Accent glows

See `frontend/src/styles/globals.css` for complete CSS definitions.

## Contributing

- All changes must pass tests: `npm test`
- Code style: follow existing patterns in the codebase
- Create a new branch for each feature
- Submit PRs against `main` branch

## License

Private - RHW CPAs Internal Use Only
