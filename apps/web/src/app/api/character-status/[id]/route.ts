import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: character, error } = await supabase
      .from('roast_me_ai_characters')
      .select(`
        *,
        image:image_id (
          id,
          file_url,
          file_name
        )
      `)
      .eq('id', id)
      .single();
    
    if (error || !character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ character });
  } catch (error) {
    console.error('Error fetching character status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch character status' },
      { status: 500 }
    );
  }
}