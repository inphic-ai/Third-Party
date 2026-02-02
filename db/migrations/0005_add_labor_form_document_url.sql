-- Migration: Add laborFormDocumentUrl to transactions table
-- Created: 2026-02-02
-- Purpose: 為 transactions 表新增 labor_form_document_url 欄位以儲存勞報單文件 URL

ALTER TABLE transactions 
ADD COLUMN labor_form_document_url TEXT;

COMMENT ON COLUMN transactions.labor_form_document_url IS '勞報單文件 URL';
