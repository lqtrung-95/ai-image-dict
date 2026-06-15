import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Only allow proxying images from our own Supabase storage. Without this check
// the endpoint is an open proxy / SSRF vector: a caller could point `url` at
// cloud metadata endpoints, internal services, or arbitrary hosts.
function isAllowedHost(target: string): boolean {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return false;
    const allowedHost = new URL(supabaseUrl).hostname;
    const parsed = new URL(target);
    // Must be HTTPS and exactly our Supabase project host.
    return parsed.protocol === 'https:' && parsed.hostname === allowedHost;
  } catch {
    return false;
  }
}

// Proxy images for Safari compatibility with Supabase signed URLs
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  if (!isAllowedHost(url)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: response.status });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ error: 'Failed to proxy image' }, { status: 500 });
  }
}

