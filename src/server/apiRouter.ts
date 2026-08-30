import express, { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";

export const apiRouter = Router();

// Ensure storage directory
const UPLOADS_DIR = path.join(process.cwd(), "uploads_storage");
const METADATA_FILE = path.join(UPLOADS_DIR, "community_resources.json");
const USERS_FILE = path.join(UPLOADS_DIR, "vault_users.json");

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

export interface ServerUserAccount {
  username: string;
  role: "admin" | "user";
  displayName: string;
  email: string;
  passwordHash: string;
  createdAt?: string;
}

const DEFAULT_SYSTEM_USERS: ServerUserAccount[] = [
  {
    username: "admin",
    role: "admin",
    displayName: "Administrator",
    email: "admin@techsupport.org",
    passwordHash: "admin123",
  },
  {
    username: "user",
    role: "user",
    displayName: "Community Member",
    email: "user@techsupport.org",
    passwordHash: "user123",
  },
];

export function readUsersData(): ServerUserAccount[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading users file:", err);
  }

  // Initialize with default users
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_SYSTEM_USERS, null, 2), "utf-8");
  } catch (err) {
    console.error("Error creating users file:", err);
  }
  return DEFAULT_SYSTEM_USERS;
}

export function writeUsersData(users: ServerUserAccount[]): boolean {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing users file:", err);
    return false;
  }
}

// Initialize users file if missing
readUsersData();

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

export const MAX_STORAGE_BYTES = 4 * 1024 * 1024 * 1024; // 4 GB Capacity in bytes (4,294,967,296)

export function formatByteSize(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i >= 3 ? 2 : 1)} ${units[i]}`;
}

export function calculateStorageUsed(): { usedBytes: number; fileCount: number } {
  let usedBytes = 0;
  let fileCount = 0;
  try {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        const fullPath = path.join(UPLOADS_DIR, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          usedBytes += stat.size;
          if (file !== "community_resources.json") {
            fileCount++;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error calculating storage used:", err);
  }
  return { usedBytes, fileCount };
}

const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB per individual file, up to 4GB aggregate
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
  const { usedBytes } = calculateStorageUsed();
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(), 
    totalUploads: readResourcesMetadata().length,
    storage: {
      total: "4.00 GB",
      used: formatByteSize(usedBytes),
      remaining: formatByteSize(Math.max(0, MAX_STORAGE_BYTES - usedBytes))
    }
  });
});

// 1.1 Storage Usage Endpoint
apiRouter.get("/storage-usage", (req: Request, res: Response) => {
  try {
    const { usedBytes, fileCount } = calculateStorageUsed();
    const remainingBytes = Math.max(0, MAX_STORAGE_BYTES - usedBytes);
    const usedPercentage = Math.min(100, (usedBytes / MAX_STORAGE_BYTES) * 100);

    res.json({
      totalBytes: MAX_STORAGE_BYTES,
      usedBytes,
      remainingBytes,
      usedPercentage: parseFloat(usedPercentage.toFixed(2)),
      formattedTotal: "4.00 GB",
      formattedUsed: formatByteSize(usedBytes),
      formattedRemaining: formatByteSize(remainingBytes),
      fileCount,
      limitExceeded: usedBytes >= MAX_STORAGE_BYTES,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to calculate storage usage" });
  }
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

    // 4GB Storage Limit Check
    const currentUsage = calculateStorageUsed();
    if (file) {
      fileSizeBytes = file.size;
    } else if (base64Data) {
      fileSizeBytes = Math.round((base64Data.length * 3) / 4);
    } else if (rawContent) {
      fileSizeBytes = Buffer.byteLength(rawContent, "utf-8");
    }

    if (currentUsage.usedBytes + fileSizeBytes > MAX_STORAGE_BYTES) {
      if (file && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
      const remainingMb = Math.max(0, (MAX_STORAGE_BYTES - currentUsage.usedBytes) / (1024 * 1024)).toFixed(1);
      return res.status(413).json({
        error: `4 GB Storage Limit Reached! Uploading this file exceeds maximum capacity. Remaining storage: ${remainingMb} MB.`,
        code: "STORAGE_LIMIT_EXCEEDED",
        remainingBytes: Math.max(0, MAX_STORAGE_BYTES - currentUsage.usedBytes),
        totalBytes: MAX_STORAGE_BYTES,
      });
    }

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

// 4. Download file handler
const handleFileDownload = (req: Request, res: Response) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id || "");
  const items = readResourcesMetadata();
  const item = items.find(
    (i) =>
      i.id === id ||
      i.id === decodedId ||
      i.storageFileName === id ||
      i.storageFileName === decodedId ||
      i.fileName === id ||
      i.fileName === decodedId ||
      (i.storageFileName && i.storageFileName.includes(id))
  );

  if (!item) {
    // Check if directly a filename in uploads dir
    const directPath = path.join(UPLOADS_DIR, decodedId);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.download(directPath, decodedId);
    }
    return res.status(404).send("File not found.");
  }

  // If external / Google Drive link
  if (item.officialDownloadUrl) {
    return res.redirect(item.officialDownloadUrl);
  }

  // If physical stored file
  if (item.storageFileName) {
    let filePath = path.join(UPLOADS_DIR, item.storageFileName);
    if (!fs.existsSync(filePath)) {
      // Search directory for fallback matching name
      try {
        const allFiles = fs.readdirSync(UPLOADS_DIR);
        const match = allFiles.find(
          (f) => f.includes(item.id) || (item.fileName && f.endsWith(item.fileName))
        );
        if (match) {
          filePath = path.join(UPLOADS_DIR, match);
        }
      } catch {}
    }

    if (fs.existsSync(filePath)) {
      item.downloadCount = (item.downloadCount || 0) + 1;
      writeResourcesMetadata(items);

      const downloadName = item.fileName || "download";
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, Content-Length");
      if (item.mimeType) {
        res.setHeader("Content-Type", item.mimeType);
      }
      return res.download(filePath, downloadName, (err) => {
        if (err && !res.headersSent) {
          console.error("Error during res.download:", err);
          res.status(500).send("Error streaming file.");
        }
      });
    }
  }

  // If raw content (e.g. scripts or text)
  if (item.rawContent) {
    item.downloadCount = (item.downloadCount || 0) + 1;
    writeResourcesMetadata(items);
    const downloadName = item.fileName || `${item.id}.txt`;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Disposition", `attachment; filename="${downloadName}"`);
    res.setHeader("Content-Type", item.mimeType || "text/plain; charset=utf-8");
    return res.send(item.rawContent);
  }

  return res.status(404).send("File missing from storage.");
};

apiRouter.get("/resources/file/:id", handleFileDownload);
apiRouter.get("/resources/download/:id", handleFileDownload);

// 5. Media streaming preview
apiRouter.get("/resources/media/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const decodedId = decodeURIComponent(id || "");
  const items = readResourcesMetadata();
  const item = items.find(
    (i) =>
      i.id === id ||
      i.id === decodedId ||
      i.storageFileName === id ||
      (i.storageFileName && i.storageFileName.includes(id))
  );

  if (!item || !item.storageFileName) {
    return res.status(404).send("Media not found.");
  }

  const filePath = path.join(UPLOADS_DIR, item.storageFileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Media file missing from storage.");
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  if (item.mimeType) {
    res.setHeader("Content-Type", item.mimeType);
  }
  res.sendFile(filePath, { acceptRanges: true }, (err) => {
    if (err && !res.headersSent) {
      console.warn("Media streaming error:", err);
    }
  });
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

// 8. User Authentication & Login
apiRouter.post("/auth/login", (req: Request, res: Response) => {
  try {
    const { loginId, password, requireAdmin } = req.body || {};
    const trimmedId = (loginId || "").trim().toLowerCase();
    const trimmedPass = (password || "").trim();

    if (!trimmedId || !trimmedPass) {
      return res.status(400).json({
        success: false,
        error: "Please enter your username/email and password.",
      });
    }

    const users = readUsersData();
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedId ||
        (u.email && u.email.toLowerCase() === trimmedId)
    );

    if (!user || user.passwordHash !== trimmedPass) {
      return res.status(401).json({
        success: false,
        error: "Invalid username or password. Please verify spelling and casing.",
      });
    }

    return res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
        displayName: user.displayName || user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error during authentication" });
  }
});

// 9. Get all registered accounts (For Admin Management)
apiRouter.get("/auth/users", (req: Request, res: Response) => {
  try {
    const users = readUsersData();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// 10. Create new user account (Admin Provisioning)
apiRouter.post("/auth/users", (req: Request, res: Response) => {
  try {
    const { username, email, password, role, displayName } = req.body || {};
    const cleanUsername = (username || "").trim().toLowerCase();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanUsername || cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username must be at least 3 characters." });
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }
    if (!cleanPass || cleanPass.length < 4) {
      return res.status(400).json({ error: "Password must be at least 4 characters." });
    }

    const users = readUsersData();
    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(409).json({ error: "This username is already taken." });
    }
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: "This email address is already registered." });
    }

    const newUser: ServerUserAccount = {
      username: cleanUsername,
      role: role === "admin" ? "admin" : "user",
      displayName: (displayName || cleanUsername).trim(),
      email: cleanEmail,
      passwordHash: cleanPass,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsersData(users);

    res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to create user account" });
  }
});

// 11. Update user credentials (Admin or Admin's own profile)
apiRouter.put("/auth/users/:username", (req: Request, res: Response) => {
  try {
    const targetUsername = decodeURIComponent(req.params.username || "").trim().toLowerCase();
    const { newUsername, newEmail, newPassword, newDisplayName, newRole } = req.body || {};

    const users = readUsersData();
    const userIndex = users.findIndex((u) => u.username.toLowerCase() === targetUsername);

    if (userIndex === -1) {
      return res.status(404).json({ error: "User account not found." });
    }

    const current = users[userIndex];

    // Username change
    if (newUsername && newUsername.trim().toLowerCase() !== current.username.toLowerCase()) {
      const nextUsername = newUsername.trim().toLowerCase();
      if (nextUsername.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters." });
      }
      if (users.some((u) => u.username.toLowerCase() === nextUsername)) {
        return res.status(409).json({ error: "This username is already taken." });
      }
      current.username = nextUsername;
    }

    // Email change
    if (newEmail && newEmail.trim().toLowerCase() !== current.email.toLowerCase()) {
      const nextEmail = newEmail.trim().toLowerCase();
      if (!nextEmail.includes("@")) {
        return res.status(400).json({ error: "Valid email required." });
      }
      if (users.some((u) => u.email.toLowerCase() === nextEmail)) {
        return res.status(409).json({ error: "This email is already registered." });
      }
      current.email = nextEmail;
    }

    // Password change
    if (newPassword !== undefined && newPassword.trim() !== "") {
      const nextPass = newPassword.trim();
      if (nextPass.length < 4) {
        return res.status(400).json({ error: "Password must be at least 4 characters." });
      }
      current.passwordHash = nextPass;
    }

    // Display Name change
    if (newDisplayName !== undefined) {
      current.displayName = newDisplayName.trim() || current.username;
    }

    // Role change
    if (newRole !== undefined && (newRole === "admin" || newRole === "user")) {
      current.role = newRole;
    }

    users[userIndex] = current;
    writeUsersData(users);

    res.json({ success: true, user: current });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update user credentials" });
  }
});

// 12. Delete user account
apiRouter.delete("/auth/users/:username", (req: Request, res: Response) => {
  try {
    const targetUsername = decodeURIComponent(req.params.username || "").trim().toLowerCase();
    const users = readUsersData();
    const user = users.find((u) => u.username.toLowerCase() === targetUsername);

    if (!user) {
      return res.status(404).json({ error: "Account not found." });
    }

    if (user.role === "admin") {
      const adminCount = users.filter((u) => u.role === "admin").length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the only remaining Administrator." });
      }
    }

    const updated = users.filter((u) => u.username.toLowerCase() !== targetUsername);
    writeUsersData(updated);

    res.json({ success: true, deleted: targetUsername });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});
