-- Migration: Add dog_id and tags columns to store_reviews table
ALTER TABLE store_reviews ADD COLUMN dog_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL;
ALTER TABLE store_reviews ADD COLUMN tags TEXT;
