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

        // Create fresh headers to avoid polluting with upstream headers (like existing Content-Disposition)
        const headers = new Headers();

        const contentType = response.headers.get('Content-Type');
        if (contentType) headers.set('Content-Type', contentType);

        const contentLength = response.headers.get('Content-Length');
        if (contentLength) headers.set('Content-Length', contentLength);

        // Force browser to treat as download
        // Handle filename encoding for safety
        const safeFilename = filename.replace(/"/g, '').replace(/\s+/g, '_');
        headers.set('Content-Disposition', `attachment; filename="${safeFilename}"`);

        return new NextResponse(response.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error('Download proxy error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
