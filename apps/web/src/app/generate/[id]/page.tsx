import GenerationTracker from './generation-tracker';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GenerationPage({ params }: PageProps) {
  const { id } = await params;
  
  // Verify the character exists and is still generating
  const supabase = await createClient();
  const { data: character, error } = await supabase
    .from('characters')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !character) {
    notFound();
  }
  
  // If already completed, redirect to character page
  if (character.generation_params?.status === 'completed' && character.seo_slug) {
    const { redirect } = await import('next/navigation');
    redirect(`/character/${character.seo_slug}`);
  }
  
  return <GenerationTracker characterId={id} initialCharacter={character} />;
}