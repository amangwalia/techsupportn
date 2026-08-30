-- Cloudflare D1 Database Schema for Tech Catalog & Support Portal
-- Run with: npx wrangler d1 execute <DATABASE_NAME> --file=./schema.sql

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  category TEXT NOT NULL,
  os TEXT NOT NULL DEFAULT '["Cross-Platform"]',
  format TEXT NOT NULL DEFAULT 'TXT',
  size TEXT NOT NULL DEFAULT '1.0 MB',
  version TEXT DEFAULT '1.0.0',
  updated_date TEXT,
  sha256 TEXT,
  popular INTEGER DEFAULT 0,
  recently_added INTEGER DEFAULT 1,
  download_count INTEGER DEFAULT 0,
  license TEXT DEFAULT 'Community / Open',
  source_url TEXT,
  official_download_url TEXT,
  install_command TEXT,
  author TEXT DEFAULT 'Community Contributor',
  tags TEXT DEFAULT '["Community Upload"]',
  file_name TEXT,
  is_user_uploaded INTEGER DEFAULT 1,
  media_type TEXT,
  media_url TEXT,
  file_data TEXT, -- Optional Base64 data for small assets
  raw_content TEXT,
  mime_type TEXT,
  install_guide TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-performance category & popular filtering
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_popular ON resources(popular);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
