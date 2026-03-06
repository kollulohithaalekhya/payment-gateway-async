ALTER TABLE merchants
ADD COLUMN IF NOT EXISTS api_key VARCHAR(255) UNIQUE NOT NULL DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_merchants_api_key
ON merchants(api_key);