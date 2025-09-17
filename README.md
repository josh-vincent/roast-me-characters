# Roast Me Characters - AI 3D Character Generator

Transform your photos into exaggerated 3D characters using AI! Upload an image and watch as AI analyzes features and creates a fun, animated 3D character.

## 🚀 Features

- **AI-Powered Analysis**: Uses OpenAI Vision to detect and analyze facial features
- **3D Character Generation**: Procedural generation of 3D characters with exaggerated features
- **Cross-Platform**: Web app (Next.js) and mobile app (Expo) in a monorepo
- **Real-time Rendering**: Interactive 3D models using React Three Fiber
- **Cloud Storage**: Supabase for authentication, database, and file storage
- **Type Safety**: Full TypeScript support across all packages

## 📦 Monorepo Structure

```
roast-me-characters/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # Expo mobile application
├── packages/
│   ├── ui/           # Shared UI components
│   ├── database/     # Supabase client and queries
│   ├── types/        # Shared TypeScript types
│   └── ai/           # AI integration with Vercel AI SDK
└── PRD.md            # Product Requirements Document
```

## 🛠️ Tech Stack

- **Monorepo**: Turborepo with pnpm workspaces
- **Web**: Next.js 15, React 19, TypeScript
- **Mobile**: Expo SDK 52, React Native
- **3D Graphics**: Three.js, React Three Fiber
- **AI**: Vercel AI SDK with OpenAI
- **Backend**: Supabase (Auth, Database, Storage)
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Supabase account
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/roast-me-characters.git
cd roast-me-characters
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your actual keys
```

4. Set up Supabase:
   - Create a new Supabase project
   - Run the database migrations (see `packages/database/migrations`)
   - Enable Storage for image uploads
   - Set up Row Level Security policies

### Development

Run all apps in development mode:
```bash
pnpm dev
```

Run specific apps:
```bash
pnpm web       # Web app only
pnpm mobile    # Mobile app only
```

### Build

Build all apps:
```bash
pnpm build
```

## 🔑 Environment Variables

Create a `.env` file based on `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (server-side only)
- `OPENAI_API_KEY`: OpenAI API key for image analysis

## 📱 Mobile Development

The mobile app uses Expo. To run on a physical device:

1. Install Expo Go on your device
2. Run `pnpm mobile`
3. Scan the QR code with Expo Go

For iOS Simulator:
```bash
pnpm mobile:ios
```

For Android Emulator:
```bash
pnpm mobile:android
```

## 🚢 Deployment

### Web App (Vercel)

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Mobile App (EAS)

1. Install EAS CLI: `npm install -g eas-cli`
2. Configure EAS: `eas build:configure`
3. Build for production: `eas build --platform all`

## 🧪 Testing

Run tests:
```bash
pnpm test
```

Run type checking:
```bash
pnpm type-check
```

Run linting:
```bash
pnpm lint
```

## 📊 Database Schema

See `packages/database/src/types.ts` for the complete database schema.

Main tables:
- `users`: User accounts
- `image_uploads`: Uploaded images
- `ai_features`: Detected features from AI
- `characters_3d`: Generated 3D characters
- `character_shares`: Shared character links

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with the Vercel AI SDK
- Powered by Supabase
- 3D rendering with Three.js
- Cross-platform with Expo and Next.js