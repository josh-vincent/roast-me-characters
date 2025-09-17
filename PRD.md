# Product Requirements Document: Character Roast AI

## Executive Summary

Character Roast AI is a cross-platform application that transforms user-uploaded images into exaggerated 3D character models using AI-powered feature detection and procedural generation. The application leverages advanced computer vision to identify four distinctive features from uploaded photos and creates humorous, stylized 3D characters that emphasize these features in an entertaining way.

The MVP will launch as a web application built with Next.js, with a subsequent mobile application using Expo to ensure cross-platform compatibility. The technical architecture utilizes a monorepo structure with shared components, Supabase for backend services, and the Vercel AI SDK for intelligent image analysis.

## Product Vision and Goals

### Vision Statement
To create an entertaining, AI-powered platform that transforms ordinary photos into memorable, shareable 3D character experiences, making advanced 3D modeling accessible to everyone through simple image uploads.

### Primary Goals
1. **Accessibility**: Enable users without 3D modeling expertise to create custom character models
2. **Entertainment**: Provide a fun, shareable experience that encourages social engagement
3. **Scalability**: Build a robust platform capable of handling viral growth
4. **Cross-Platform**: Ensure seamless experience across web and mobile devices
5. **Monetization Ready**: Design architecture to support future premium features

### Success Criteria
- 10,000+ character generations in first month
- 60% user retention rate (users creating multiple characters)
- < 30 second total processing time per character
- 4.5+ star rating on app stores
- 99.9% uptime for core services

## User Stories

### US-001: Image Upload and Processing
**As a** new user  
**I want to** upload a photo from my device or camera  
**So that** I can create a 3D character based on my appearance

**Acceptance Criteria:**
- Support for JPG, PNG, WEBP formats (max 10MB)
- Image preview before confirmation
- Progress indicator during upload
- Error handling for unsupported formats
- Automatic image optimization and compression
- Mobile camera integration for direct capture

### US-002: AI Feature Detection
**As a** user who has uploaded an image  
**I want to** see the AI identify four distinctive features  
**So that** I understand what will be exaggerated in my character

**Acceptance Criteria:**
- Visual indicators on detected features
- Feature confidence scores displayed
- Ability to regenerate detection if unsatisfied
- Clear labeling of each detected feature
- Processing time < 5 seconds
- Fallback for faces not clearly visible

### US-003: 3D Character Generation
**As a** user with detected features  
**I want to** see my features transformed into a 3D character  
**So that** I can enjoy the humorous result

**Acceptance Criteria:**
- Real-time 3D preview with rotation controls
- Exaggerated features clearly visible
- Consistent art style across all characters
- Loading animation during generation
- Generation time < 15 seconds
- WebGL fallback for unsupported devices

### US-004: Character Customization
**As a** user viewing my generated character  
**I want to** adjust the exaggeration levels  
**So that** I can fine-tune the final result

**Acceptance Criteria:**
- Slider controls for each feature (0-100% exaggeration)
- Real-time preview updates
- Reset to default option
- Undo/redo functionality
- Save custom presets
- Comparison view (original vs adjusted)

### US-005: Sharing and Export
**As a** user with a completed character  
**I want to** share it on social media  
**So that** I can entertain my friends

**Acceptance Criteria:**
- Direct sharing to major platforms (Twitter, Instagram, TikTok)
- Downloadable formats (PNG, GIF, MP4)
- Unique shareable URL for each character
- Watermark option (removable in premium)
- Social media optimized previews
- Copy link functionality

### US-006: User Account Management
**As a** returning user  
**I want to** save and manage my characters  
**So that** I can build a collection over time

**Acceptance Criteria:**
- OAuth login (Google, Apple, Email)
- Character gallery view
- Search and filter capabilities
- Favorite/archive options
- Account deletion with data export
- Cross-device synchronization

### US-007: Performance and Accessibility
**As a** user with varying devices and abilities  
**I want to** use the app smoothly  
**So that** everyone can enjoy the experience

**Acceptance Criteria:**
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Mobile-first responsive design
- Offline mode for viewing saved characters
- Low bandwidth mode option

## Technical Requirements

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Monorepo Root                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   apps/web   │  │ apps/mobile  │  │   apps/api   │ │
│  │   (Next.js)  │  │    (Expo)    │  │   (tRPC)     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              packages/shared                      │  │
│  │  - UI Components (React Native Web compatible)   │  │
│  │  - Business Logic                               │  │
│  │  - Type Definitions                             │  │
│  │  - Utilities                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │              packages/database                    │  │
│  │  - Drizzle ORM Schemas                          │  │
│  │  - Migrations                                   │  │
│  │  - Seed Data                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Web**: Next.js 15 with App Router
- **Mobile**: Expo SDK 52+ with Expo Router
- **Cross-Platform Navigation**: Solito or Expo Router Web
- **UI Components**: Shadcn/ui adapted for React Native Web
- **3D Rendering**: React Three Fiber with @react-three/drei
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS (web) / NativeWind (mobile)

#### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with OAuth providers
- **File Storage**: Supabase Storage with CDN
- **API Layer**: tRPC with Next.js API routes
- **AI Processing**: Vercel AI SDK with vision models
- **Real-time**: Supabase Realtime for live updates

#### Infrastructure
- **Monorepo Tool**: Turborepo or NX
- **Package Manager**: Bun or pnpm with workspaces
- **Hosting**: Vercel (web) / EAS (mobile)
- **CDN**: Cloudflare for assets
- **Monitoring**: Sentry for error tracking
- **Analytics**: Posthog or Mixpanel

### Database Schema

```typescript
// Drizzle ORM Schema Definitions

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 50 }).unique(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  subscription: varchar('subscription', { length: 20 }).default('free'),
  metadata: jsonb('metadata')
});

// Characters table
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }),
  sourceImageUrl: text('source_image_url').notNull(),
  processedImageUrl: text('processed_image_url'),
  modelUrl: text('model_url'),
  thumbnailUrl: text('thumbnail_url'),
  features: jsonb('features').notNull(), // Detected features data
  exaggerationSettings: jsonb('exaggeration_settings'),
  shareableId: varchar('shareable_id', { length: 12 }).unique(),
  viewCount: integer('view_count').default(0),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata')
});

// Processing jobs table
export const processingJobs = pgTable('processing_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id),
  status: varchar('status', { length: 20 }).notNull(), // pending, processing, completed, failed
  stage: varchar('stage', { length: 50 }), // upload, detection, generation, optimization
  progress: integer('progress').default(0),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata')
});

// Feature templates table
export const featureTemplates = pgTable('feature_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  modelData: jsonb('model_data').notNull(),
  defaultExaggeration: integer('default_exaggeration').default(50),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Share analytics table
export const shareAnalytics = pgTable('share_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id),
  platform: varchar('platform', { length: 50 }),
  referrer: text('referrer'),
  ipHash: varchar('ip_hash', { length: 64 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

### API Specifications

```typescript
// tRPC Router Definitions

// Character router
export const characterRouter = router({
  // Create new character from image
  create: protectedProcedure
    .input(z.object({
      imageBase64: z.string(),
      name: z.string().optional(),
      settings: z.object({
        autoDetect: z.boolean().default(true),
        style: z.enum(['cartoon', 'realistic', 'anime']).default('cartoon')
      }).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Upload image to Supabase Storage
      // 2. Queue AI detection job
      // 3. Return job ID for polling
    }),

  // Get character by ID
  getById: publicProcedure
    .input(z.object({
      id: z.string().uuid().or(z.string().length(12)) // UUID or shareable ID
    }))
    .query(async ({ input }) => {
      // Return character with signed URLs
    }),

  // List user's characters
  list: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
      filter: z.enum(['all', 'public', 'private']).default('all')
    }))
    .query(async ({ input, ctx }) => {
      // Return paginated character list
    }),

  // Update exaggeration settings
  updateSettings: protectedProcedure
    .input(z.object({
      characterId: z.string().uuid(),
      settings: z.record(z.number().min(0).max(100))
    }))
    .mutation(async ({ input, ctx }) => {
      // Trigger regeneration with new settings
    }),

  // Delete character
  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ input, ctx }) => {
      // Soft delete and cleanup storage
    })
});

// AI processing router
export const aiRouter = router({
  // Detect features in image
  detectFeatures: protectedProcedure
    .input(z.object({
      imageUrl: z.string().url(),
      model: z.enum(['openai', 'anthropic', 'replicate']).default('openai')
    }))
    .mutation(async ({ input }) => {
      // Use Vercel AI SDK for vision analysis
    }),

  // Generate 3D model
  generateModel: protectedProcedure
    .input(z.object({
      characterId: z.string().uuid(),
      features: z.array(z.object({
        type: z.string(),
        confidence: z.number(),
        coordinates: z.object({
          x: z.number(),
          y: z.number(),
          width: z.number(),
          height: z.number()
        }),
        exaggeration: z.number()
      }))
    }))
    .mutation(async ({ input }) => {
      // Call 3D generation service
    }),

  // Get processing status
  getJobStatus: publicProcedure
    .input(z.object({
      jobId: z.string().uuid()
    }))
    .query(async ({ input }) => {
      // Return current processing status
    })
});
```

## UI/UX Requirements

### Design System

#### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-500: #6366F1; /* Indigo */
  --primary-600: #4F46E5;
  
  /* Secondary Colors */
  --secondary-500: #EC4899; /* Pink */
  --secondary-600: #DB2777;
  
  /* Neutral Colors */
  --gray-50: #F9FAFB;
  --gray-900: #111827;
  
  /* Semantic Colors */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
}
```

#### Typography
- **Headings**: Inter or SF Pro Display
- **Body**: Inter or SF Pro Text
- **Monospace**: JetBrains Mono (for technical elements)

#### Component Architecture

```typescript
// Shared component example
interface CharacterCardProps {
  character: Character;
  onView?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  variant?: 'compact' | 'detailed';
  loading?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onView,
  onShare,
  onDelete,
  variant = 'compact',
  loading = false
}) => {
  // Cross-platform compatible component
  // Uses React Native Web for mobile compatibility
};
```

### User Flow Diagrams

#### MVP User Journey
```
1. Landing Page
   ├── Sign Up / Login (optional)
   └── Upload Image
       ├── Camera Capture
       └── File Selection
           └── Image Preview
               └── Confirm Upload
                   └── AI Detection
                       ├── Show Detected Features
                       └── Adjust Settings (optional)
                           └── Generate 3D Model
                               ├── View in 3D
                               ├── Customize Exaggeration
                               └── Share / Download
```

### Responsive Design Requirements

#### Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

#### Mobile-First Approach
- Touch-optimized controls (minimum 44x44px tap targets)
- Swipe gestures for 3D rotation
- Bottom sheet patterns for actions
- Progressive disclosure of features

## MVP Feature Set

### Phase 1: Core Functionality (Weeks 1-4)
1. **Image Upload Pipeline**
   - Web upload interface
   - Supabase Storage integration
   - Image optimization service
   - Progress tracking

2. **AI Feature Detection**
   - Vercel AI SDK integration
   - OpenAI Vision API setup
   - Feature extraction algorithm
   - Confidence scoring

3. **Basic 3D Generation**
   - Procedural model generation
   - Feature mapping system
   - React Three Fiber viewer
   - Basic lighting setup

### Phase 2: User Experience (Weeks 5-6)
1. **User Accounts**
   - Supabase Auth setup
   - OAuth providers (Google, Apple)
   - Profile management
   - Character gallery

2. **Customization Tools**
   - Exaggeration sliders
   - Real-time preview
   - Style presets
   - Reset functionality

### Phase 3: Social Features (Weeks 7-8)
1. **Sharing System**
   - Unique URLs
   - Social media integration
   - Download options
   - Analytics tracking

2. **Performance Optimization**
   - CDN configuration
   - Image lazy loading
   - 3D model optimization
   - Caching strategies

## Future Enhancements

### Version 1.1 (Post-MVP)
- **Animation System**: Add preset animations to characters
- **Voice Integration**: Text-to-speech for character voices
- **AR Mode**: View characters in augmented reality
- **Multiplayer Scenes**: Combine multiple characters

### Version 1.2
- **Character Marketplace**: Buy/sell custom characters
- **NFT Integration**: Mint characters as NFTs
- **API Access**: Developer API for third-party integration
- **Advanced Customization**: Clothing, accessories, backgrounds

### Version 2.0
- **Video Input**: Process video for animated characters
- **AI Personalities**: Generate character personalities
- **Game Integration**: Export to Unity/Unreal
- **Collaborative Creation**: Multi-user character creation

## Success Metrics

### Technical Metrics
- **Page Load Time**: < 2 seconds (LCP)
- **Time to Interactive**: < 3 seconds
- **API Response Time**: < 200ms (p95)
- **3D Render FPS**: > 30 FPS on mid-range devices
- **Uptime**: 99.9% availability

### Business Metrics
- **User Acquisition**: 1,000 DAU within first month
- **Conversion Rate**: 5% free to paid conversion
- **Retention**: D7 retention > 40%
- **Virality**: K-factor > 1.2
- **Revenue**: $10K MRR within 6 months

### User Experience Metrics
- **Task Success Rate**: > 90% successful character creation
- **User Satisfaction**: NPS > 50
- **Support Tickets**: < 1% of active users
- **Feature Adoption**: > 60% use customization tools
- **Share Rate**: > 30% of created characters shared

## Technical Risks and Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| AI API Rate Limits | High | High | Implement queuing system, multiple API providers |
| 3D Rendering Performance | Medium | High | Progressive enhancement, WebGL fallbacks |
| Storage Costs | Medium | Medium | Image compression, CDN caching, cleanup policies |
| Viral Traffic Surge | Low | High | Auto-scaling, CDN, database read replicas |
| Content Moderation | Medium | High | AI content filtering, user reporting system |
| Cross-Platform Compatibility | Medium | Medium | Extensive testing, polyfills, graceful degradation |

### Security Considerations

1. **Data Protection**
   - End-to-end encryption for sensitive data
   - GDPR/CCPA compliance
   - Regular security audits
   - Penetration testing

2. **API Security**
   - Rate limiting per user/IP
   - API key rotation
   - Request signing
   - DDoS protection

3. **Content Security**
   - Image validation
   - NSFW content detection
   - User reporting system
   - Manual review queue

## Development Timeline

### Sprint Plan (8-Week MVP)

#### Weeks 1-2: Foundation
- [ ] Monorepo setup with Turborepo
- [ ] Next.js and Expo project initialization
- [ ] Supabase project configuration
- [ ] Basic CI/CD pipeline
- [ ] Development environment setup

#### Weeks 3-4: Core Features
- [ ] Image upload functionality
- [ ] Supabase Storage integration
- [ ] AI feature detection implementation
- [ ] Basic 3D model generation
- [ ] React Three Fiber integration

#### Weeks 5-6: User Experience
- [ ] Authentication system
- [ ] User dashboard
- [ ] Character gallery
- [ ] Customization controls
- [ ] Mobile responsive design

#### Weeks 7-8: Polish & Launch
- [ ] Sharing functionality
- [ ] Performance optimization
- [ ] Bug fixes and testing
- [ ] Documentation
- [ ] Deployment and monitoring

### Resource Requirements

#### Team Composition
- **1x Full-Stack Developer** (Next.js/React Native)
- **1x 3D Graphics Developer** (Three.js specialist)
- **1x Backend Developer** (Supabase/tRPC)
- **1x UI/UX Designer** (Part-time)
- **1x DevOps Engineer** (Part-time)

#### Budget Estimates
- **Development**: $60,000 - $80,000
- **Infrastructure**: $500 - $1,000/month
- **Third-party APIs**: $1,000 - $2,000/month
- **Marketing**: $5,000 - $10,000
- **Total MVP Budget**: $75,000 - $100,000

## Testing Strategy

### Test Coverage Requirements
- **Unit Tests**: > 80% coverage
- **Integration Tests**: Critical user paths
- **E2E Tests**: Main user journeys
- **Performance Tests**: Load testing for 1000 concurrent users
- **Accessibility Tests**: WCAG 2.1 AA compliance

### Testing Framework
```typescript
// Example test structure
describe('Character Generation', () => {
  describe('Image Upload', () => {
    it('should accept valid image formats', async () => {
      // Test implementation
    });
    
    it('should reject oversized images', async () => {
      // Test implementation
    });
    
    it('should show upload progress', async () => {
      // Test implementation
    });
  });
  
  describe('AI Detection', () => {
    it('should detect facial features', async () => {
      // Test implementation
    });
    
    it('should handle detection failures gracefully', async () => {
      // Test implementation
    });
  });
});
```

## Deployment and DevOps

### Infrastructure as Code
```yaml
# Example Vercel configuration
{
  "framework": "nextjs",
  "buildCommand": "turbo build",
  "devCommand": "turbo dev",
  "installCommand": "bun install",
  "regions": ["iad1", "sfo1", "sin1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

### Monitoring and Observability
- **Error Tracking**: Sentry with source maps
- **Performance Monitoring**: Vercel Analytics
- **Log Aggregation**: Supabase Logs / LogFlare
- **Uptime Monitoring**: Better Uptime / Pingdom
- **User Analytics**: PostHog / Mixpanel

## Compliance and Legal

### Data Privacy
- Privacy Policy and Terms of Service
- Cookie consent management
- Data retention policies (90 days for anonymous users)
- Right to deletion (GDPR Article 17)
- Data portability options

### Content Rights
- User content license agreement
- DMCA compliance process
- Age verification (13+ requirement)
- Prohibited content guidelines

## Conclusion

Character Roast AI represents an innovative intersection of AI technology, 3D graphics, and social entertainment. By following this comprehensive PRD, the development team can build a scalable, engaging platform that delights users while maintaining technical excellence and business viability.

The phased approach ensures rapid MVP delivery while laying the foundation for future enhancements. With careful attention to user experience, performance optimization, and cross-platform compatibility, Character Roast AI is positioned to become a leading platform in AI-powered character creation.

## Appendices

### A. Competitive Analysis
- **Lensa AI**: Photo enhancement and avatar creation
- **Ready Player Me**: Cross-game avatar platform
- **Genies**: Celebrity avatar creation
- **Zmoji**: Animated emoji creator

### B. Technical References
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [Supabase Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction)
- [React Three Fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)

### C. Design Resources
- [Figma Design System](https://www.figma.com/community)
- [3D Asset Libraries](https://sketchfab.com)
- [Animation References](https://mixamo.com)

---

*Document Version: 1.0*  
*Last Updated: January 2025*  
*Status: Ready for Development*