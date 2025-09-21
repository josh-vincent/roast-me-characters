import { createClient } from '@/lib/supabase/server';
import { GalleryClient } from './gallery-client';
import Link from 'next/link';

export const revalidate = 0; // Always fetch fresh data
export const dynamic = 'force-dynamic'; // Force dynamic rendering

async function getUserCharacters(userId: string) {
  const supabase = await createClient();
  
  const { data: characters, error } = await supabase
    .from('roast_me_ai_characters')
    .select('id,seo_slug,og_title,og_description,model_url,thumbnail_url,medium_url,view_count,likes,created_at,is_public,generation_params,image:image_id(file_url)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('Error fetching user characters:', error);
    return [];
  }

  return characters || [];
}

async function getPublicCharacters(limit: number = 50) {
  const supabase = await createClient();
  
  const { data: characters, error } = await supabase
    .from('roast_me_ai_characters')
    .select('id,seo_slug,og_title,og_description,model_url,thumbnail_url,medium_url,view_count,likes,created_at,is_public,generation_params,image:image_id(file_url)')
    .eq('is_public', true)
    // Removed the model_url filter to show characters that are still generating
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching public characters:', error);
    return [];
  }

  return characters || [];
}

export default async function GalleryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Always show all public characters from the community
  const characters = await getPublicCharacters(100); // Show more characters
  const isUserGallery = false; // Always show as community gallery

  // Transform characters to match expected format
  const transformedCharacters = characters.map(char => {
    // Extract original image URL from generation_params
    let originalImageUrl = null;
    if (char.generation_params?.composite_og_url) {
      try {
        const url = new URL(char.generation_params.composite_og_url);
        const originalParam = url.searchParams.get('original');
        if (originalParam) {
          originalImageUrl = decodeURIComponent(originalParam);
        }
      } catch (error) {
        console.warn('Failed to parse composite_og_url:', error);
      }
    }

    return {
      ...char,
      image: Array.isArray(char.image) ? char.image[0] : char.image || (originalImageUrl ? { file_url: originalImageUrl } : undefined),
      features: char.generation_params?.features || []
    };
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-6">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  🔥 Roast Me
                </Link>
                <Link 
                  href="/gallery" 
                  className="text-purple-600 font-medium text-sm"
                >
                  Gallery
                </Link>
              </div>
              <nav className="flex items-center space-x-4">
                {user ? (
                  <>
                    <Link 
                      href="/credits" 
                      className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium"
                    >
                      Credits
                    </Link>
                    <div className="flex items-center space-x-2">
                      {user.user_metadata?.avatar_url ? (
                        <img 
                          src={user.user_metadata.avatar_url} 
                          alt={user.email || 'User'} 
                          className="w-8 h-8 rounded-full border border-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                          {(user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Link 
                    href="/" 
                    className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </header>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {isUserGallery ? '🎭 Your Roast Collection' : '🔥 Community Gallery'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isUserGallery 
              ? `You've created ${characters.length} hilarious roast character${characters.length !== 1 ? 's' : ''}! Each one is a masterpiece of comedy.`
              : 'Explore the funniest roast characters created by our community. Get inspired for your own hilarious figurine!'}
          </p>
          {isUserGallery && characters.length === 0 && (
            <div className="mt-8">
              <p className="text-gray-500 mb-4">You haven't created any characters yet.</p>
              <a 
                href="/"
                className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your First Character
              </a>
            </div>
          )}
        </div>

        <GalleryClient 
          initialCharacters={transformedCharacters}
          isUserGallery={isUserGallery}
          userId={user?.id}
        />
      </div>
    </div>
  );
}