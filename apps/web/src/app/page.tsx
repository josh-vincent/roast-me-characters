import { getRecentCharactersAction } from './actions/get-recent-characters';
import { CharacterUploadSection } from './components/CharacterUploadSection';
import { RecentCharactersGallery } from './components/RecentCharactersGallery';
import { MobileAppWaitlist } from './components/MobileAppWaitlist';
import { Header } from './components/Header';

// Enable ISR for the homepage - revalidate every hour
// This prevents excessive database calls during build
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch recent characters on server
  const recentCharactersResult = await getRecentCharactersAction();
  const recentCharacters = recentCharactersResult.success ? recentCharactersResult.characters : [];

  return (
    <main className="min-h-screen  bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-3xl sm:text-5xl lg:text-7xl font-medium tracking-tight text-slate-900">
            Transform your photos into
            <span className="text-orange-600 block sm:inline">
              <span className="relative"> hilarious 🔥 Roast figurines</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg tracking-tight text-slate-700">
            Upload any image and watch our AI create a hilariously exaggerated caricature figurine that playfully roasts your features. Get a premium collectible with comically oversized traits!
          </p>
        </div>
      </div>

      {/* Main Content - Client Component for Upload Flow */}
      <CharacterUploadSection />

      {/* Recent Characters Gallery - Server-rendered with prefetched data */}
      <RecentCharactersGallery initialCharacters={recentCharacters} />

      {/* Mobile App Waitlist */}
      <MobileAppWaitlist />
    </main>
  );
}