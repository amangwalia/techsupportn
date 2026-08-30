import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { apiRouter } from "./src/server/apiRouter";

const app = express();
const PORT = 3000;

// Enable CORS for all origins, methods, and headers
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  })
);

// Body parser middleware (supports large file uploads up to 300MB)
app.use(express.json({ limit: "300mb" }));
app.use(express.urlencoded({ extended: true, limit: "300mb" }));

// Explicit preflight handler
app.options("*", cors());

// API routes mounted at /api
app.use("/api", apiRouter);

// Start Server and Mount Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Tech Support Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
