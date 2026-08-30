import { Env, jsonResponse, mapDbRowToResource, hashStringSHA256 } from '../../_utils';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    let fileBlob: File | Blob | null = null;
    let fileBase64 = '';
    let fileSizeBytes = 0;
    let detectedMime = 'application/octet-stream';
    let actualFileName = 'resource.bin';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      if (fileEntry && typeof fileEntry === 'object' && 'arrayBuffer' in fileEntry) {
        fileBlob = fileEntry as Blob;
        actualFileName = (fileEntry as any).name || 'resource.bin';
        fileSizeBytes = fileBlob.size || 0;
        detectedMime = fileBlob.type || 'application/octet-stream';
        
        // Convert to base64 for database storage if under 5MB
        if (fileSizeBytes > 0 && fileSizeBytes <= 5 * 1024 * 1024) {
          const buffer = await fileBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          fileBase64 = btoa(binary);
        }
      }

      body = {
        title: formData.get('title'),
        category: formData.get('category'),
        format: formData.get('format'),
        tagline: formData.get('tagline'),
        description: formData.get('description'),
        os: formData.get('os'),
        version: formData.get('version'),
        author: formData.get('author'),
        tags: formData.get('tags'),
        popular: formData.get('popular'),
        installCommand: formData.get('installCommand'),
        rawContent: formData.get('rawContent'),
        officialDownloadUrl: formData.get('officialDownloadUrl'),
        size: formData.get('size'),
        fileName: formData.get('fileName') || actualFileName,
      };
    } else {
      // JSON body
      body = await request.json();
      actualFileName = body.fileName || 'resource.bin';
      if (body.base64Data) {
        fileBase64 = body.base64Data;
        fileSizeBytes = Math.round((fileBase64.length * 3) / 4);
      }
    }

    const {
      title,
      category,
      format,
      tagline,
      description,
      os,
      version,
      author,
      tags,
      popular,
      installCommand,
      rawContent,
      officialDownloadUrl,
      size: customSize,
    } = body;

    let sha256Hash = '';
    if (fileBase64) {
      sha256Hash = await hashStringSHA256(fileBase64);
    } else if (rawContent) {
      sha256Hash = await hashStringSHA256(String(rawContent));
      detectedMime = 'text/plain';
      fileSizeBytes = new TextEncoder().encode(String(rawContent)).length;
    } else if (officialDownloadUrl) {
      sha256Hash = await hashStringSHA256(String(officialDownloadUrl));
    }

    const finalTitle = (title || actualFileName || 'Uploaded Resource').toString().trim();
    const finalCategory = (category || 'apps').toString().toLowerCase();
    const finalFormat = (format || 'TXT').toString().toUpperCase();

    let parsedOs = ['Cross-Platform'];
    if (os) {
      try {
        parsedOs = typeof os === 'string' ? JSON.parse(os) : os;
      } catch {
        parsedOs = [os.toString()];
      }
    }

    let parsedTags = [finalFormat, 'Community Upload'];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [tags.toString()];
      }
    }

    const isPopular = popular === 'true' || popular === true ? 1 : 0;
    const resourceId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isImg = detectedMime.startsWith('image/') || ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(finalFormat);
    const isVid = detectedMime.startsWith('video/') || ['MP4', 'WEBM', 'MKV', 'MOV'].includes(finalFormat);

    let formattedSize = customSize || `${fileSizeBytes} B`;
    if (!customSize && fileSizeBytes > 0) {
      if (fileSizeBytes >= 1024 * 1024 * 1024) formattedSize = `${(fileSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      else if (fileSizeBytes >= 1024 * 1024) formattedSize = `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      else if (fileSizeBytes >= 1024) formattedSize = `${(fileSizeBytes / 1024).toFixed(1)} KB`;
    }

    const mediaType = isImg ? 'image' : isVid ? 'video' : rawContent ? 'text' : 'binary';
    const updatedDateStr = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const installGuideList = [
      `Download ${actualFileName} via 1-click download.`,
      isImg ? 'View or embed image asset.' : isVid ? 'Play video media.' : 'Open, install or execute the file.',
    ];

    if (env.DB) {
      await env.DB.prepare(`
        INSERT INTO resources (
          id, title, tagline, description, category, os, format, size, version,
          updated_date, sha256, popular, recently_added, download_count, license,
          official_download_url, install_command, author, tags, file_name,
          is_user_uploaded, media_type, file_data, raw_content, mime_type, install_guide
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, 1, 1, 'Community / Open',
          ?, ?, ?, ?, ?,
          1, ?, ?, ?, ?, ?
        )
      `).bind(
        resourceId,
        finalTitle,
        (tagline || '').toString().trim() || `Download ${actualFileName}`,
        (description || '').toString().trim() || `Community uploaded ${actualFileName}`,
        finalCategory,
        JSON.stringify(parsedOs),
        finalFormat,
        formattedSize || '1.0 MB',
        (version || '1.0.0').toString().trim(),
        updatedDateStr,
        sha256Hash || null,
        isPopular,
        officialDownloadUrl ? String(officialDownloadUrl).trim() : null,
        (installCommand || '').toString().trim() || actualFileName,
        (author || 'Community Contributor').toString().trim(),
        JSON.stringify(parsedTags),
        actualFileName,
        mediaType,
        fileBase64 || null,
        rawContent ? String(rawContent) : null,
        detectedMime,
        JSON.stringify(installGuideList)
      ).run();
    }

    const newResource = {
      id: resourceId,
      title: finalTitle,
      tagline: (tagline || '').toString().trim() || `Download ${actualFileName}`,
      description: (description || '').toString().trim() || `Community uploaded ${actualFileName}`,
      category: finalCategory,
      os: parsedOs,
      format: finalFormat,
      size: formattedSize || '1.0 MB',
      version: (version || '1.0.0').toString().trim(),
      updatedDate: updatedDateStr,
      sha256: sha256Hash || undefined,
      popular: Boolean(isPopular),
      recentlyAdded: true,
      downloadCount: 1,
      license: 'Community / Open',
      author: (author || 'Community Contributor').toString().trim(),
      tags: parsedTags,
      fileName: actualFileName,
      officialDownloadUrl: officialDownloadUrl ? String(officialDownloadUrl).trim() : undefined,
      installCommand: (installCommand || '').toString().trim() || actualFileName,
      isUserUploaded: true,
      mediaType,
      mediaUrl: fileBase64 ? `/api/resources/media/${resourceId}` : undefined,
      rawContent: rawContent ? String(rawContent) : undefined,
      mimeType: detectedMime,
      installGuide: installGuideList,
    };

    return jsonResponse(newResource, 201);
  } catch (err: any) {
    console.error('Upload error in Cloudflare Pages Function:', err);
    return jsonResponse({ error: err.message || 'Failed to process upload in D1' }, 500);
  }
};
