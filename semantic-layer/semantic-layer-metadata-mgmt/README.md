# Semantic Layer Metadata Management

A React/TypeScript frontend application with Python Flask backend for managing field metadata in Treasure Data's semantic layer.

## Features

- **Hierarchical Search**: Select database and optionally table from field_metadata
- **Data Grid View**: Display all fields with comprehensive metadata
- **Edit Mode**: Toggle to edit all field attributes except database, table, field names, and time
- **Bulk Updates**: Save multiple field updates in one operation
- **Success/Error Notifications**: Clear feedback with green (success) or red (error) backgrounds
- **Responsive Design**: Works on desktop and mobile devices
- **TD Brand Colors**: Matches Treasure Data's official color palette

## Architecture

```
┌─────────────────┐
│   React/TS UI   │
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│  Flask API      │
│  (Port 5000)    │
└────────┬────────┘
         │ pytd
         ▼
┌─────────────────┐
│  Treasure Data  │
│  field_metadata │
└─────────────────┘
```

## Prerequisites

- **Node.js** 18.0+ (for frontend)
- **Python** 3.9+ (for backend)
- **TD API Key** with read/write access to semantic layer database
- **Authenticated tdx CLI** (optional, for testing)

## Installation

### 1. Clone and Setup

```bash
cd semantic-layer-metadata-mgmt
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your TD API key
nano .env
```

## Configuration

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (.env)

```bash
# Required
TD_API_KEY=your-td-api-key-here
TD_REGION=us01                    # or jp01, eu01
SEMANTIC_DB=semantic_layer_v1      # your semantic layer database

# Optional
PORT=5000
DEBUG=False
```

## Running the Application

### Development Mode

**Terminal 1: Start Backend**
```bash
cd backend
source venv/bin/activate
python api.py
```

Backend runs at: `http://localhost:5000`

**Terminal 2: Start Frontend**
```bash
npm run dev
```

Frontend runs at: `http://localhost:3000`

### Production Build

```bash
# Build frontend
npm run build

# Serve production build
npm run preview
```

## Usage

### 1. Search for Metadata

1. Select a **database** from the dropdown
2. Optionally select a **table** (or leave as "All tables")
3. Click **Search**

The data grid will display all matching field metadata.

### 2. Edit Metadata

1. Click **Edit** button in the header
2. Modify any editable fields:
   - Data Type
   - Description
   - Business Definition
   - Tags (add/remove by clicking)
   - Is PII checkbox
   - PII Category
   - Sensitivity Level
   - Owner
   - Steward
   - Quality Score (0-100)

3. Click **Save** to commit changes
4. Click **Cancel Edit** to discard changes

### 3. View Results

- **Green notification**: Changes saved successfully
- **Red notification**: Error occurred with detailed message

## API Endpoints

### GET /health
Health check

### GET /api/metadata/databases
Get list of databases with table counts

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "database_name": "my_database",
      "table_count": 15,
      "tables": ["table1", "table2"]
    }
  ]
}
```

### GET /api/metadata/databases/:database/tables
Get tables for a database

**Response:**
```json
{
  "success": true,
  "data": ["table1", "table2", "table3"]
}
```

### GET /api/metadata/fields?database=X&table=Y
Get field metadata with optional filters

**Query Parameters:**
- `database` (required): Database name
- `table` (optional): Table name

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "time": 1234567890,
      "database_name": "my_db",
      "table_name": "my_table",
      "field_name": "customer_id",
      "data_type": "VARCHAR",
      "description": "Unique customer identifier",
      "tags": ["pii", "identifier"],
      "is_pii": true,
      "owner": "data-team@example.com"
    }
  ]
}
```

### POST /api/metadata/fields/update
Update field metadata

**Request Body:**
```json
{
  "updates": [
    {
      "database_name": "my_db",
      "table_name": "my_table",
      "field_name": "customer_id",
      "updates": {
        "description": "Updated description",
        "tags": ["pii", "key"],
        "owner": "new-owner@example.com"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "updated": 1,
    "failed": 0
  },
  "message": "Updated 1 records"
}
```

## Field Metadata Schema

| Field | Type | Editable | Description |
|-------|------|----------|-------------|
| time | bigint | ❌ | Timestamp |
| database_name | string | ❌ | Database name |
| table_name | string | ❌ | Table name |
| field_name | string | ❌ | Field/column name |
| data_type | string | ✅ | Data type (VARCHAR, INT, etc.) |
| description | string | ✅ | Field description |
| business_definition | string | ✅ | Business context |
| tags | array | ✅ | Metadata tags |
| is_pii | boolean | ✅ | PII flag |
| pii_category | string | ✅ | Type of PII (email, phone) |
| sensitivity_level | string | ✅ | public, internal, confidential, restricted |
| owner | string | ✅ | Field owner |
| steward | string | ✅ | Data steward |
| quality_score | integer | ✅ | Quality score (0-100) |

## Troubleshooting

### Backend Issues

**Problem**: `pytd` connection fails

**Solution**:
```bash
# Verify TD API key
echo $TD_API_KEY

# Test connection
python -c "import pytd; client = pytd.Client(apikey='$TD_API_KEY', endpoint='https://api.us01.treasuredata.com/'); print('Connected!')"
```

**Problem**: Query timeout

**Solution**: Reduce result set by selecting specific table instead of all tables

### Frontend Issues

**Problem**: CORS errors

**Solution**: Ensure backend is running and CORS is enabled in `backend/api.py`

**Problem**: API connection refused

**Solution**: Check `VITE_API_BASE_URL` in `.env` matches backend port

## Development

### Project Structure

```
semantic-layer-metadata-mgmt/
├── src/
│   ├── components/
│   │   ├── SearchBar.tsx       # Database/table selector
│   │   ├── DataGrid.tsx        # Editable metadata grid
│   │   └── Notification.tsx    # Success/error messages
│   ├── api/
│   │   └── client.ts           # API client
│   ├── types/
│   │   └── metadata.ts         # TypeScript types
│   ├── styles/
│   │   ├── base.css            # Base styles + TD colors
│   │   └── app.css             # Component styles
│   ├── App.tsx                 # Main application
│   └── main.tsx                # Entry point
├── backend/
│   ├── api.py                  # Flask API server
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Backend config template
├── package.json                # Frontend dependencies
└── README.md                   # This file
```

### Adding New Fields

1. Update `src/types/metadata.ts` with new field type
2. Add column to `DataGrid.tsx` table
3. Update backend SQL queries in `backend/api.py`

### Styling Customization

All TD brand colors are defined in `src/styles/base.css`:
- Primary: `#1A57DB`
- Secondary: `#A37AFC`
- Text: `#131023`

## Testing

### Manual Testing Checklist

- [ ] Database dropdown loads and displays databases
- [ ] Table dropdown populates when database selected
- [ ] Search returns correct results
- [ ] Edit mode enables all editable fields
- [ ] Tags can be added/removed
- [ ] PII checkbox toggles correctly
- [ ] Save updates database successfully
- [ ] Success notification shows on successful save
- [ ] Error notification shows on failed save
- [ ] Cancel edit reverts changes
- [ ] Read-only fields cannot be edited

### API Testing

```bash
# Health check
curl http://localhost:5000/health

# Get databases
curl http://localhost:5000/api/metadata/databases

# Get tables
curl http://localhost:5000/api/metadata/databases/my_database/tables

# Get field metadata
curl "http://localhost:5000/api/metadata/fields?database=my_database&table=my_table"
```

## Deployment

### Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - TD_API_KEY=${TD_API_KEY}
      - TD_REGION=${TD_REGION}
      - SEMANTIC_DB=${SEMANTIC_DB}

  frontend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

Run: `docker-compose up -d`

## Security

- **Never commit** `.env` files
- TD API key should have **minimum required permissions**
- Use **read-only keys** if only viewing metadata
- Implement **authentication** before production deployment
- Enable **HTTPS** in production

## Support

For issues or questions:
1. Check backend logs: `tail -f backend/api.log`
2. Check browser console for frontend errors
3. Verify TD connection: `tdx auth show`

## License

ISC

## Contributors

Built with Claude Sonnet 4.5

---

**Version**: 1.0.0
**Last Updated**: 2026-02-16
