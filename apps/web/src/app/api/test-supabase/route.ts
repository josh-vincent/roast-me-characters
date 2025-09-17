import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection by listing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      });
    }

    // Test database tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('roast_me_ai_users')
      .select('*')
      .limit(1);

    return NextResponse.json({
      success: true,
      buckets: buckets?.map(b => b.name) || [],
      tablesTest: tablesError ? 'Table access failed: ' + tablesError.message : 'Tables accessible',
      message: 'Supabase connected successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}