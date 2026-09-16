import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || searchParams.get('url') || searchParams.get('data');
    const format = searchParams.get('format') || 'dataurl'; // 'dataurl' | 'svg'

    if (!text) {
      return NextResponse.json(
        { success: false, message: 'Parameter text/url wajib disertakan' },
        { status: 400 }
      );
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(text, {
        type: 'svg',
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // Default: Data URL
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      width: 400,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      success: true,
      dataUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
