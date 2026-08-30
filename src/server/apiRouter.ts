import express, { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

export const apiRouter = Router();

// Ensure storage directory
const UPLOADS_DIR = path.join(process.cwd(), "uploads_storage");
const METADATA_FILE = path.join(UPLOADS_DIR, "community_resources.json");

if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads_storage dir:", err);
  }
}

if (!fs.existsSync(METADATA_FILE)) {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify([]), "utf-8");
  } catch (err) {
    console.error("Failed to initialize community_resources.json:", err);
  }
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const safeName = (file.originalname || "upload.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${uniquePrefix}_${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 300 * 1024 * 1024 }, // 300MB
});

export function readResourcesMetadata(): any[] {
  try {
    if (fs.existsSync(METADATA_FILE)) {
      const data = fs.readFileSync(METADATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading metadata file:", err);
  }
  return [];
}

export function writeResourcesMetadata(items: any[]): boolean {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(items, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing metadata file:", err);
    return false;
  }
}

// 1. Health check
apiRouter.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), totalUploads: readResourcesMetadata().length });
});

// 2. Get all community uploaded resources
apiRouter.get("/resources", (req: Request, res: Response) => {
  try {
    const items = readResourcesMetadata();
    const mapped = items.map((item) => ({
      ...item,
      mediaUrl: item.storageFileName ? `/api/resources/media/${item.id}` : item.mediaUrl,
    }));
    res.json(mapped);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list resources" });
  }
});

// 3. Upload a new community resource (handles multipart file)
apiRouter.post("/resources/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const body = req.body || {};

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
      base64Data,
      officialDownloadUrl,
      size: customSize,
      fileName: customFileName,
    } = body;

    let storageFileName = "";
    let actualFileName = file?.originalname || customFileName || "resource.bin";
    let fileSizeBytes = file?.size || 0;
    let sha256Hash = "";
    let detectedMime = file?.mimetype || "application/octet-stream";

    if (file) {
      storageFileName = file.filename;
      try {
        const buffer = fs.readFileSync(file.path);
        sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");
        fileSizeBytes = buffer.length;
      } catch (e) {
        console.warn("Could not hash file buffer:", e);
      }
    } else if (base64Data) {
      // Fallback base64 upload support
      const buffer = Buffer.from(base64Data, "base64");
      const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const safeName = actualFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      storageFileName = `${uniquePrefix}_${safeName}`;
      const filePath = path.join(UPLOADS_DIR, storageFileName);
      fs.writeFileSync(filePath, buffer);
      sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");
      fileSizeBytes = buffer.length;
    } else if (rawContent) {
      // Raw text content
      const buffer = Buffer.from(rawContent, "utf-8");
      const uniquePrefix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const safeName = actualFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      storageFileName = `${uniquePrefix}_${safeName}`;
      const filePath = path.join(UPLOADS_DIR, storageFileName);
      fs.writeFileSync(filePath, buffer);
      sha256Hash = crypto.createHash("sha256").update(buffer).digest("hex");
      fileSizeBytes = buffer.length;
      detectedMime = "text/plain";
    } else if (officialDownloadUrl) {
      // Google Drive or External Cloud Link
      sha256Hash = crypto.createHash("sha256").update(officialDownloadUrl).digest("hex");
      detectedMime = "application/octet-stream";
    } else {
      return res.status(400).json({ error: "No file, content, or cloud download URL was provided." });
    }

    const finalTitle = (title || actualFileName || "Uploaded Resource").trim();
    const finalCategory = (category || "apps").toLowerCase();
    const finalFormat = (format || "TXT").toUpperCase();

    let parsedOs = ["Cross-Platform"];
    if (os) {
      try {
        parsedOs = typeof os === "string" ? JSON.parse(os) : os;
      } catch {
        parsedOs = [os.toString()];
      }
    }

    let parsedTags = [finalFormat, "Community Upload"];
    if (tags) {
      try {
        parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      } catch {
        parsedTags = [tags.toString()];
      }
    }

    const isPopular = popular === "true" || popular === true;
    const resourceId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isImg = detectedMime.startsWith("image/") || ["PNG", "JPG", "JPEG", "WEBP", "GIF", "SVG"].includes(finalFormat);
    const isVid = detectedMime.startsWith("video/") || ["MP4", "WEBM", "MKV", "MOV"].includes(finalFormat);

    let formattedSize = customSize || `${fileSizeBytes} B`;
    if (!customSize && fileSizeBytes > 0) {
      if (fileSizeBytes >= 1024 * 1024 * 1024) formattedSize = `${(fileSizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      else if (fileSizeBytes >= 1024 * 1024) formattedSize = `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
      else if (fileSizeBytes >= 1024) formattedSize = `${(fileSizeBytes / 1024).toFixed(1)} KB`;
    }

    const newResource = {
      id: resourceId,
      title: finalTitle,
      tagline: (tagline || "").trim() || `Download ${actualFileName}`,
      description: (description || "").trim() || `Community uploaded ${actualFileName}`,
      category: finalCategory,
      os: parsedOs,
      format: finalFormat,
      size: formattedSize || "1.0 MB",
      version: (version || "").trim() || "1.0.0",
      updatedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      sha256: sha256Hash,
      popular: isPopular,
      recentlyAdded: true,
      downloadCount: 1,
      license: "Community / Open",
      author: (author || "").trim() || "Community Contributor",
      tags: parsedTags,
      fileName: actualFileName,
      storageFileName: storageFileName || undefined,
      officialDownloadUrl: officialDownloadUrl || undefined,
      installCommand: (installCommand || "").trim() || actualFileName,
      isUserUploaded: true,
      mediaType: isImg ? "image" : isVid ? "video" : rawContent ? "text" : "binary",
      mediaUrl: storageFileName ? `/api/resources/media/${resourceId}` : undefined,
      rawContent: rawContent || undefined,
      mimeType: detectedMime,
      installGuide: [
        `Download ${actualFileName} via 1-click download.`,
        isImg ? "View or embed image asset." : isVid ? "Play video media." : "Open, install or execute the file.",
      ],
    };

    const existing = readResourcesMetadata();
    existing.unshift(newResource);
    writeResourcesMetadata(existing);

    res.status(201).json(newResource);
  } catch (err: any) {
    console.error("Upload error in apiRouter:", err);
    res.status(500).json({ error: err.message || "Failed to process upload." });
  }
});

// 4. Download file
apiRouter.get("/resources/file/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readResourcesMetadata();
  const item = items.find((i) => i.id === id);

  if (!item || !item.storageFileName) {
    return res.status(404).send("File not found.");
  }

  const filePath = path.join(UPLOADS_DIR, item.storageFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File missing from storage.");
  }

  item.downloadCount = (item.downloadCount || 0) + 1;
  writeResourcesMetadata(items);

  res.download(filePath, item.fileName || "download");
});

// 5. Media streaming preview
apiRouter.get("/resources/media/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readResourcesMetadata();
  const item = items.find((i) => i.id === id);

  if (!item || !item.storageFileName) {
    return res.status(404).send("Media not found.");
  }

  const filePath = path.join(UPLOADS_DIR, item.storageFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Media file missing from storage.");
  }

  if (item.mimeType) {
    res.setHeader("Content-Type", item.mimeType);
  }
  res.sendFile(filePath);
});

// 6. Delete a community resource
apiRouter.delete("/resources/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readResourcesMetadata();
  const itemIndex = items.findIndex((i) => i.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: "Resource not found." });
  }

  const [removedItem] = items.splice(itemIndex, 1);
  writeResourcesMetadata(items);

  if (removedItem.storageFileName) {
    const filePath = path.join(UPLOADS_DIR, removedItem.storageFileName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn("Could not delete physical file:", err);
      }
    }
  }

  res.json({ success: true, id });
});

// 7. Increment download count
apiRouter.post("/resources/:id/download-count", (req: Request, res: Response) => {
  const { id } = req.params;
  const items = readResourcesMetadata();
  const item = items.find((i) => i.id === id);
  if (item) {
    item.downloadCount = (item.downloadCount || 0) + 1;
    writeResourcesMetadata(items);
    return res.json({ success: true, count: item.downloadCount });
  }
  res.status(404).json({ error: "Not found" });
});
