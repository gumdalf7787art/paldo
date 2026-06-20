-- Migration: Add is_read column to chat_messages table
ALTER TABLE chat_messages ADD COLUMN is_read INTEGER DEFAULT 0;
