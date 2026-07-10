# KeMU Inventory Management System - Inventory Management System

A comprehensive asset tracking and inventory management system built with Next.js, featuring a smart import engine, real-time search, maintenance scheduling, and role-based access control.

## Features

### Core Functionality
- **Asset Management**: Create, read, update, and delete physical assets with detailed information
- **Dashboard**: Overview of inventory metrics, asset distribution, and maintenance schedule
- **Search & Filter**: Real-time search across all assets with category, location, and status filters
- **Asset Details**: Comprehensive view of each asset including maintenance history and movement tracking

### Smart Import Engine
- **Auto Column Detection**: Fuzzy matching algorithm detects CSV/Excel columns automatically
- **Intelligent Categorization**: Auto-categorizes assets based on name and description
- **Duplicate Detection**: Prevents importing duplicate asset tags
- **Multi-step Wizard**: User-friendly import flow with preview, validation, and confirmation
- **Error Reporting**: Detailed feedback on problematic records with skip reasons

### Maintenance Management
- **Schedule Tracking**: Track preventive, corrective, and inspection maintenance
- **Upcoming Maintenance**: View and plan maintenance activities
- **Cost Tracking**: Monitor maintenance expenses per asset
- **Maintenance History**: Complete audit trail of all maintenance performed

### Administration
- **Role-Based Access**: Admin, Staff, and Viewer roles with appropriate permissions
- **System Statistics**: Overview of imports, users, and system health
- **User Management**: View and switch between system users
- **Import History**: Complete log of all import operations

## Tech Stack

- **Frontend**: React 19 with Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 with custom theme
- **State Management**: In-memory store (easily replaceable with database)
- **Import Processing**: CSV/Excel parsing with fuzzy column detection
- **Typography**: JetBrains Mono for monospace, Inter for body

## Project Structure

```
/app
  /dashboard          - Main dashboard page
  /assets
    /[id]            - Asset details page
    /new             - New asset creation
    page.tsx         - Assets list with search/filters
  /import            - Smart import wizard
  /maintenance       - Maintenance scheduling
  /admin             - Administration panel
  layout.tsx         - Root layout with fonts
  page.tsx           - Home (redirects to dashboard)
  globals.css        - Global styles and design tokens

/lib
  types.ts           - TypeScript interfaces
  store.ts           - In-memory data store
  import-engine.ts   - Smart import with fuzzy matching

/components
  /layout
    sidebar.tsx      - Navigation sidebar
    header.tsx       - Page header with search
```

## Key Pages

### Dashboard (`/dashboard`)
- Key metrics: Total assets, active assets, maintenance count, locations
- Asset distribution by category and location
- Upcoming maintenance schedule
- Recent import history

### Assets (`/assets`)
- Full asset table with sorting
- Real-time search box
- Category, location, and status filters
- Quick actions: View, Edit, Delete
- Add new asset button

### Import (`/import`)
- 4-step wizard: Upload → Preview → Confirm → Complete
- Auto column detection from CSV/Excel
- Duplicate detection
- Error summary before final import

### Maintenance (`/maintenance`)
- Add maintenance records with cost tracking
- View upcoming scheduled maintenance
- Complete maintenance history table
- Filter by type (preventive, corrective, inspection)

### Admin (`/admin`)
- System statistics dashboard
- User management with role display
- Import history with success/error metrics
- System configuration options

## Design

- **Color Scheme**: Modern dark theme (emerald/green primary)
- **Palette**: 
  - Primary: #10b981 (Emerald)
  - Background: #1a1a1a (Near black)
  - Card: #262626 (Dark grey)
  - Secondary: #404040 (Medium grey)
- **Typography**: 2 font families (Inter + JetBrains Mono)
- **Spacing**: Consistent Tailwind grid with gap utilities
- **Components**: Semantic HTML with proper ARIA roles

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Open http://localhost:3000
```

## Authentication

Currently uses simple role-based access with hardcoded demo users:
- **Admin User**: admin@company.com (full access)
- **Staff Member**: staff@company.com (import & maintenance)
- **Viewer**: viewer@company.com (read-only)

Switch users via the user menu in the sidebar.

## Data Storage

Currently uses in-memory store with demo data. To add persistent storage:
1. Replace store functions with database queries
2. Connect to Neon PostgreSQL, Supabase, or any database
3. Implement proper authentication layer

## Future Enhancements

- Real-time notifications for maintenance alerts
- Barcode/QR code generation and scanning
- Advanced reporting and analytics
- Multi-user collaboration
- Document attachments
- API integration with other systems
- Mobile app
- Data export (PDF, CSV)

## Demo Data

The system comes with 3 sample assets:
- MacBook Pro 16" (Electronics)
- Standing Desk (Furniture)
- Dell UltraSharp 27" Monitor (Electronics)

And 2 sample maintenance records for demonstration purposes.
