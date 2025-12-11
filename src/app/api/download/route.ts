import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const url = req.nextUrl.searchParams.get('url');
    const filename = req.nextUrl.searchParams.get('filename') || 'downloaded-file';

    if (!url) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch file' }, { status: response.status });
        }

        const headers = new Headers(response.headers);
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        // Ensure Content-Type is preserved or set correctly
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/octet-stream');
        }

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Download proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
