import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc';
    const email = url.searchParams.get('email');
    const organization = url.searchParams.get('organization');
    const passNumber = url.searchParams.get('pass_number');

    let query = supabase
      .from('press_passes')
      .select('*')
      .order(sortBy, { ascending: sortOrder })
      .range(offset, offset + limit - 1);

    if (email) {
      query = query.eq('email', email);
    }

    if (organization) {
      query = query.eq('organization', organization);
    }

    if (passNumber) {
      query = query.eq('pass_number', passNumber);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    const { count: totalCount, error: countError } = await supabase
      .from('press_passes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Count error:', countError);
    }

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total: totalCount ?? 'unknown',
        limit,
        offset,
        hasMore: data.length === limit
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
