-- RapidRecalls Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"email": true, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255),
    model VARCHAR(255),
    upc VARCHAR(20),
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    source VARCHAR(50) NOT NULL CHECK (source IN ('manual', 'receipt_ocr', 'amazon_csv', 'upc_scan')),
    source_metadata JSONB DEFAULT '{}',
    normalized_name VARCHAR(500), -- For matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recalls table
CREATE TABLE recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency VARCHAR(50) NOT NULL CHECK (agency IN ('FDA', 'USDA', 'CPSC', 'NHTSA')),
    recall_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    recall_date DATE NOT NULL,
    link VARCHAR(1000),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
    product_keywords TEXT[], -- For fuzzy matching
    upcs TEXT[], -- For exact matching
    brands TEXT[], -- Brand names mentioned
    raw_data JSONB, -- Original API response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matched recalls table
CREATE TABLE matched_recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    recall_id UUID NOT NULL REFERENCES recalls(id) ON DELETE CASCADE,
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN ('upc_exact', 'title_fuzzy', 'brand_fuzzy')),
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notified_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, recall_id)
);

-- Notification log table
CREATE TABLE notification_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_recall_id UUID NOT NULL REFERENCES matched_recalls(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'push')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_upc ON products(upc) WHERE upc IS NOT NULL;
CREATE INDEX idx_products_normalized_name ON products USING gin(to_tsvector('english', normalized_name));
CREATE INDEX idx_recalls_agency ON recalls(agency);
CREATE INDEX idx_recalls_recall_date ON recalls(recall_date);
CREATE INDEX idx_recalls_keywords ON recalls USING gin(product_keywords);
CREATE INDEX idx_recalls_upcs ON recalls USING gin(upcs);
CREATE INDEX idx_matched_recalls_user_id ON matched_recalls(user_id);
CREATE INDEX idx_matched_recalls_notified ON matched_recalls(notified_at) WHERE notified_at IS NULL;
