import { getRecentCharactersAction } from './actions/get-recent-characters';
import { CharacterUploadSection } from './components/CharacterUploadSection';
import { RecentCharactersGallery } from './components/RecentCharactersGallery';

export default async function HomePage() {
  // Fetch recent characters on server
  const recentCharactersResult = await getRecentCharactersAction();
  const recentCharacters = recentCharactersResult.success ? recentCharactersResult.characters : [];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Roast Me</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">How it works</a>
              <a href="#" className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Gallery</a>
              <a href="#" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Get Started</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden max-w-screen-lg mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
            Transform your photos into
            <span className="relative whitespace-nowrap text-purple-600 w-full">
              <span className="relative"> hilarious roast figurines</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
            Upload any image and watch our AI create a hilariously exaggerated caricature figurine that playfully roasts your features. Get a premium collectible with comically oversized traits!
          </p>
        </div>
      </div>

      {/* Main Content - Client Component for Upload Flow */}
      <CharacterUploadSection />

      {/* Recent Characters Gallery - Server-rendered with prefetched data */}
      <RecentCharactersGallery initialCharacters={recentCharacters} />
    </main>
  );
}