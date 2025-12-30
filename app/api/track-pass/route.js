import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

export async function POST(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    );
  }

  try {
    const data = await request.json();

    if (!data.name || !data.email || !data.pass_number) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, or pass_number' },
        { status: 400 }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const headers = request.headers;
    const userAgent = headers.get('user-agent') || 'Unknown';
    const ipAddress =
      headers.get('x-forwarded-for') ||
      headers.get('x-real-ip') ||
      headers.get('x-vercel-forwarded-for') ||
      'Unknown';
    const referer = headers.get('referer') || headers.get('referrer') || null;

    const payload = {
      name: data.name,
      title: data.title || null,
      email: data.email,
      pass_number: data.pass_number,
      user_agent: userAgent,
      ip_address: ipAddress,
      referer: referer,
      created_at: new Date().toISOString()
    };

    const { data: inserted, error } = await supabase.from('press_passes').insert(payload).select();

    if (error) {
      return NextResponse.json(
        { error: 'Database error', details: error.message, code: error.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Press pass created successfully', data: inserted[0] });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
