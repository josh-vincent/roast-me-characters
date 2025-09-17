import { Metadata } from 'next';
import CharacterPageClient from './client-page';
import { getCharacterData } from './actions';

interface PageProps {
  params: Promise<{ slug: string }>;
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

    // Generate OG image URL
    const ogImageUrl = new URL('/api/og', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    if (character.image?.file_url) {
      ogImageUrl.searchParams.set('original', character.image.file_url);
    }
    if (character.model_url) {
      ogImageUrl.searchParams.set('generated', character.model_url);
    }
    ogImageUrl.searchParams.set('title', title);
    if (character.features && character.features.length > 0) {
      ogImageUrl.searchParams.set('features', character.features.map((f: any) => f.feature_name).join(','));
    }

    return {
      title: `${title} - Roast Me Characters`,
      description,
      openGraph: {
        title,
        description,
        images: [
          {
            url: ogImageUrl.toString(),
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl.toString()],
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
  return <CharacterPageClient slug={slug} />;
}