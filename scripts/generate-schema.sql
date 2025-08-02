-- RapidRecalls Database Schema
-- This is the exact schema that should be in your Neon database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    session_token VARCHAR(255),
    session_expires TIMESTAMP WITH TIME ZONE,
    magic_link_token VARCHAR(255),
    magic_link_expires TIMESTAMP WITH TIME ZONE,
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255),
    model VARCHAR(255),
    upc VARCHAR(50),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    source_metadata JSONB DEFAULT '{}',
    normalized_name VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recalls table
CREATE TABLE IF NOT EXISTS recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    agency VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium',
    recall_date DATE NOT NULL,
    link VARCHAR(1000),
    product_keywords TEXT[],
    brand_keywords TEXT[],
    upc_codes TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matched recalls table
CREATE TABLE IF NOT EXISTS matched_recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recall_id UUID NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
    match_type VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, recall_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_magic_link ON users(magic_link_token);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_upc ON products(upc);
CREATE INDEX IF NOT EXISTS idx_recalls_agency ON recalls(agency);
CREATE INDEX IF NOT EXISTS idx_recalls_date ON recalls(recall_date);
CREATE INDEX IF NOT EXISTS idx_matched_recalls_user ON matched_recalls(user_id);
CREATE INDEX IF NOT EXISTS idx_matched_recalls_product ON matched_recalls(product_id);

-- Comments explaining the schema
COMMENT ON TABLE users IS 'User accounts with passwordless authentication';
COMMENT ON TABLE products IS 'User products that are monitored for recalls';
COMMENT ON TABLE recalls IS 'Recall data from government agencies (FDA, USDA, CPSC, NHTSA)';
COMMENT ON TABLE matched_recalls IS 'Links between user products and recalls with confidence scores';

COMMENT ON COLUMN recalls.external_id IS 'Unique identifier from the source agency (e.g., FDA recall number)';
COMMENT ON COLUMN recalls.product_keywords IS 'Array of keywords extracted from product description for matching';
COMMENT ON COLUMN recalls.brand_keywords IS 'Array of brand names extracted for matching';
COMMENT ON COLUMN recalls.upc_codes IS 'Array of UPC codes found in the recall';
COMMENT ON COLUMN matched_recalls.match_type IS 'Type of match: upc_exact, brand_fuzzy, title_fuzzy';
COMMENT ON COLUMN matched_recalls.confidence_score IS 'Confidence score from 0.0 to 1.0 for the match';
