# RapidRecalls Backend

A comprehensive recall monitoring system that tracks user purchases and alerts them of product recalls from FDA, USDA, CPSC, and NHTSA.

## 🚀 Quick Start

1. **Environment Setup**
   \`\`\`bash
   # Required
   DATABASE_URL=your_neon_database_url
   CRON_SECRET=your_secure_random_string
   
   # Optional (for enhanced UPC lookup)
   UPC_API_KEY=your_upcitemdb_api_key
   \`\`\`

2. **Database Setup**
   \`\`\`bash
   npm run db:migrate
   \`\`\`

3. **Test API Connections**
   \`\`\`bash
   npm run dev
   npm run test:apis
   \`\`\`

## 📡 API Status

### ✅ Working APIs (No Keys Required)
- **FDA**: Food, Drug, Device recalls - `api.fda.gov`
- **USDA**: Meat/Poultry recalls - `fsis.usda.gov`
- **NHTSA**: Vehicle recalls - `api.nhtsa.gov`
- **CPSC**: Consumer products via RSS - `cpsc.gov`
- **OpenFoodFacts**: UPC lookup - `openfoodfacts.org`

### 💰 Optional Paid APIs
- **UPCitemdb**: Enhanced UPC lookup ($0.01/request)
  - Get key: https://www.upcitemdb.com/
  - Free tier: 100 requests/day

## 🔄 Sync Schedule

Set up a cron job to run daily:
\`\`\`bash
curl -X POST http://your-domain.com/api/cron/sync-recalls \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
\`\`\`

## 📊 Features

- **Multi-source Product Intake**: OCR, Amazon CSV, Manual, UPC scan
- **Smart Matching**: UPC exact + fuzzy text matching with confidence scores
- **Email Notifications**: HTML alerts with severity indicators
- **Privacy-First**: User data isolation, audit trails
- **Extensible**: Modular services, clean API design

## 🛠 Production Deployment

1. **OCR Service**: Replace mock with Google Vision API or AWS Textract
2. **Email Service**: Configure SendGrid, AWS SES, or similar
3. **Monitoring**: Add logging, metrics, error tracking
4. **Scaling**: Consider Redis for caching, queue for background jobs
