import { Metadata } from 'next';
import StaticCharacterView from './static-character-view';
import { getCharacterData } from './actions';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 86400; // Revalidate every 24 hours for completed characters
export const dynamic = 'force-static';
export const dynamicParams = true; // Allow dynamic params beyond generateStaticParams

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Pre-render popular character pages at build time
export async function generateStaticParams() {
  try {
    const supabase = await createClient();
    
    // Get the 20 most popular characters to pre-render
    const { data: characters } = await supabase
      .from('characters')
      .select('seo_slug')
      .eq('public', true)
      .not('model_url', 'is', null)
      .order('view_count', { ascending: false })
      .limit(20);
    
    if (!characters) return [];
    
    return characters.map((character) => ({
      slug: character.seo_slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  try {
    const result = await getCharacterData(decodedSlug);
    
    if ('error' in result || !result.character) {
      return {
        title: 'Character Not Found - Roast Me Characters',
        description: 'The character you are looking for could not be found.',
      };
    }

    const character = result.character;
    const title = character.og_title || 'AI Generated Roast Character';
    const description = character.og_description || 
      (character.generation_params?.roast_content 
        ? `${character.generation_params.roast_content.roast_text} - ${character.generation_params.roast_content.punchline}`
        : 'Transform your photos into hilarious roast figurines with AI');

    // Generate OG image URL with better fallbacks
    // Try to get the current request URL for accurate metadata
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    
    let baseUrl: string;
    
    // Vercel automatically provides these
    if (process.env.VERCEL_URL) {
      // Preview deployments
      baseUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      // Production deployment
      baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    } else if (process.env.NEXT_PUBLIC_BASE_URL) {
      // Custom domain
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    } else if (host) {
      // Fallback to request host
      baseUrl = `${protocol}://${host}`;
    } else {
      baseUrl = 'http://localhost:3000';
    }
    const ogImageUrl = new URL('/api/og', baseUrl);
    
    if (character.image?.file_url) {
      ogImageUrl.searchParams.set('original', character.image.file_url);
    }
    if (character.model_url) {
      ogImageUrl.searchParams.set('generated', character.model_url);
    }
    ogImageUrl.searchParams.set('title', title);
    if (character.generation_params?.roast_content?.punchline) {
      ogImageUrl.searchParams.set('punchline', character.generation_params.roast_content.punchline);
    }
    if (character.features && character.features.length > 0) {
      ogImageUrl.searchParams.set('features', character.features.map((f: any) => f.feature_name).join(','));
    }

    return {
      title: `${title} - Roast Me Characters`,
      description,
      keywords: [
        'AI roast character',
        'funny figurine',
        'AI generated art',
        'character generator',
        'roast comedy',
        '3D character',
        ...(character.features?.map((f: any) => f.feature_name) || [])
      ].join(', '),
      authors: [{ name: 'Roast Me Characters' }],
      creator: 'Roast Me Characters',
      publisher: 'Roast Me Characters',
      alternates: {
        canonical: `${baseUrl}/character/${character.seo_slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${baseUrl}/character/${character.seo_slug}`,
        siteName: 'Roast Me Characters',
        locale: 'en_US',
        type: 'article',
        publishedTime: character.created_at,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: title,
            type: 'image/png',
            sizes: '1200x630',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl.toString()],
        creator: '@roastme_chars',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    return {
      title: 'Error - Roast Me Characters',
      description: 'An error occurred while loading the character.',
    };
  }
}

export default async function CharacterPage({ params }: PageProps) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  
  // Fetch character data
  const result = await getCharacterData(decodedSlug);
  
  // Handle errors
  if ('error' in result || !result.character) {
    notFound();
  }
  
  const character = result.character;
  
  // If character is still generating, redirect to generation page
  const status = character.generation_params?.status;
  if (status === 'generating' || status === 'retrying') {
    redirect(`/generate/${character.id}`);
  }
  
  // If generation failed, also redirect to generation page for retry
  if (status === 'failed' || status === 'retry_failed') {
    redirect(`/generate/${character.id}`);
  }
  
  // Render static view for completed characters
  return <StaticCharacterView character={character} />;
}