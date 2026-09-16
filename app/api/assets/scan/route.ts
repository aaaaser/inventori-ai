import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromRequest } from '@/lib/auth-server';
import { getAssetWithFullRelations, getAllAssets } from '@/lib/school-inventory-service';
import { getDataScope, canAccessJurusan } from '@/lib/data-scope';

/**
 * Extracts candidate identifier (Asset ID or Unit Code like BRG-RPL-001-001) from raw QR code text/URL.
 */
function parseQrPayload(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // 1. Try parsing JSON format if any
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.kode_barang) return String(parsed.kode_barang).trim();
      if (parsed.kode) return String(parsed.kode).trim();
      if (parsed.code) return String(parsed.code).trim();
      if (parsed.id) return String(parsed.id).trim();
      if (parsed.unit_code) return String(parsed.unit_code).trim();
    } catch {
      // ignore json parse error, proceed
    }
  }

  // 2. Try parsing URL path or query params
  try {
    let urlString = trimmed;
    if (!urlString.startsWith('http://') && !urlString.startsWith('https://') && urlString.startsWith('/')) {
      urlString = `http://localhost${urlString}`;
    }

    if (urlString.startsWith('http://') || urlString.startsWith('https://')) {
      const parsedUrl = new URL(urlString);
      
      // Check query params like ?code=... or ?id=...
      const qCode = parsedUrl.searchParams.get('code') || parsedUrl.searchParams.get('kode') || parsedUrl.searchParams.get('id');
      if (qCode) return qCode.trim();

      // Check path segments e.g. /barang/12 or /barang/BRG-RPL-001-001 or /inventori/barang/detail/BRG-RPL-001-001
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        const lastSegment = decodeURIComponent(pathSegments[pathSegments.length - 1]);
        if (lastSegment && lastSegment !== 'barang' && lastSegment !== 'detail') {
          return lastSegment.trim();
        }
      }
    }
  } catch {
    // Not a standard URL, continue to direct string match
  }

  // 3. Fallback to direct string
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUserFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const rawQr = body.qr_code || body.code || body.text || '';

    if (!rawQr || typeof rawQr !== 'string' || !rawQr.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'Format QR Code tidak valid atau kosong.',
          error: 'INVALID_QR',
        },
        { status: 400 }
      );
    }

    const identifier = parseQrPayload(rawQr);

    if (!identifier) {
      return NextResponse.json(
        {
          success: false,
          message: 'Kode QR tidak dapat diidentifikasi.',
          error: 'INVALID_FORMAT',
        },
        { status: 400 }
      );
    }

    // Lookup unit asset by ID or code without scope first to distinguish between 404 (not found) and 403 (forbidden department)
    const allUnitAssets = await getAllAssets(undefined, null); // Unscoped query
    const targetAsset = allUnitAssets.find(
      (a) =>
        String(a.id) === identifier ||
        a.kode_barang.toLowerCase() === identifier.toLowerCase()
    );

    if (!targetAsset) {
      return NextResponse.json(
        {
          success: false,
          message: 'Barang tidak ditemukan. QR Code tidak terdaftar pada sistem.',
          error: 'NOT_FOUND',
          scanned: identifier,
        },
        { status: 404 }
      );
    }

    // Enforce role-based access control & department scope check
    const allowed = canAccessJurusan(user, targetAsset.jurusan_kode);
    if (!allowed) {
      const userScope = getDataScope(user);
      return NextResponse.json(
        {
          success: false,
          message: `Akses Ditolak: Anda login sebagai ${user?.role || 'Pengguna'} (${userScope.jurusanKode || 'Jurusan Terbatas'}) dan tidak memiliki hak akses untuk memeriksa aset unit jurusan ${targetAsset.jurusan_kode}.`,
          error: 'FORBIDDEN_DEPARTMENT',
          assetInfo: {
            kode_barang: targetAsset.kode_barang,
            jurusan_kode: targetAsset.jurusan_kode,
          },
        },
        { status: 403 }
      );
    }

    // Fetch full relation details
    const fullData = await getAssetWithFullRelations(targetAsset.id, user || undefined);

    return NextResponse.json({
      success: true,
      message: 'QR Code berhasil dibaca. Membuka detail barang...',
      data: {
        id: targetAsset.id,
        kode_barang: targetAsset.kode_barang,
        nama_barang: targetAsset.nama_barang,
        jurusan_kode: targetAsset.jurusan_kode,
        ruangan_nama: targetAsset.ruangan_nama,
        kondisi: targetAsset.kondisi,
        status: targetAsset.status,
        merk: targetAsset.merk,
        tipe: targetAsset.tipe,
        nomor_seri: targetAsset.nomor_seri,
        detailUrl: `/barang/${targetAsset.id}`,
      },
      fullData: fullData || null,
    });
  } catch (error: any) {
    console.error('Error processing scan QR:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Terjadi kesalahan saat memproses QR Code.',
        error: 'SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
