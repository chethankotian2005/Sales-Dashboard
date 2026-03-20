# Sales Dashboard

A production-grade Sales Dashboard web application built with React 18 + Vite (Frontend) and Django 4.x + DRF (Backend).

## Features

### Dashboard Components
- **KPI Cards** - Revenue, Sales Units, Orders, Balance with animated counters and sparklines
- **Revenue Chart** - Area chart with This Week/This Month toggle and CSV export
- **Daily Sales** - Bar chart with gradient styling and tooltips
- **Category Breakdown** - Donut chart with center label and legend
- **Transaction List** - Recent transactions with icons and color-coded amounts
- **Invoices Table** - Sortable, filterable, paginated with CSV export
- **Top Products Table** - Sales bars, source badges, discount display
- **Popular Products** - Card grid with load more functionality
- **Global Sales** - Country-wise progress bars with flags
- **Market Value** - Real-time updating line chart (10s interval)
- **News Feed** - Today/Yesterday/Upcoming filter tabs

### Enhanced Features
- **Dark Mode** - Full dark/light theme toggle, persisted in localStorage
- **Date Range Picker** - Global filter in topbar
- **Collapsible Sidebar** - Icon-only mode, auto-collapse on mobile
- **Notifications Panel** - Bell icon with unread count badge
- **Real-time Data** - Market value chart auto-refreshes
- **CSV Export** - On invoices and products tables
- **Skeleton Loaders** - Loading states for all components
- **Toast Notifications** - Success/error feedback
- **Responsive Design** - Mobile-friendly layout
- **JWT Authentication** - Login page, protected routes, token refresh

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts
- React Router v6
- Axios
- TanStack Query (React Query)
- Lucide React (icons)
- React Hot Toast

### Backend
- Django 4.x
- Django REST Framework
- JWT Auth (SimpleJWT)
- SQLite (dev) / PostgreSQL (prod)
- Django CORS Headers
- Faker (seed data)

## Project Structure

```
├── backend/
│   ├── core/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── dashboard/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   ├── admin.py
│   │   └── management/commands/seed_data.py
│   ├── users/
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js
│   │   │   └── hooks.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── cards/
│   │   │   ├── charts/
│   │   │   ├── tables/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create environment file:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Seed the database with sample data:
```bash
python manage.py seed_data
```

7. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Demo Credentials

After running the seed command, use these credentials to log in:

- **Username:** demo
- **Password:** demo123

Or:

- **Username:** admin
- **Password:** admin123

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Get JWT tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/register/` - Register new user
- `GET /api/auth/profile/` - Get current user profile
- `POST /api/auth/logout/` - Logout (blacklist token)

### Dashboard
- `GET /api/dashboard/kpis/` - KPI metrics
- `GET /api/dashboard/revenue/?period=week|month` - Revenue chart data
- `GET /api/dashboard/daily-sales/?days=7` - Daily sales bar chart
- `GET /api/dashboard/category-sales/` - Category breakdown
- `GET /api/dashboard/transactions/` - Paginated transactions
- `GET /api/dashboard/invoices/` - Paginated, filterable invoices
- `GET /api/dashboard/invoices/export_csv/` - Export invoices as CSV
- `GET /api/dashboard/products/` - All products
- `GET /api/dashboard/products/top/` - Top selling products
- `GET /api/dashboard/products/popular/` - Popular products
- `GET /api/dashboard/products/export_csv/` - Export products as CSV
- `GET /api/dashboard/global-sales/` - Country-wise sales
- `GET /api/dashboard/market-value/?range=day|month|year` - Market value time series
- `POST /api/dashboard/market-value/` - Simulate market update
- `GET /api/dashboard/news/` - News feed
- `GET /api/dashboard/notifications/` - User notifications
- `GET /api/dashboard/notifications/unread_count/` - Unread count
- `POST /api/dashboard/notifications/mark_all_read/` - Mark all read
- `GET /api/dashboard/account/` - Account info

## Design Specifications

- **Primary Color:** #4361ee (Indigo Blue)
- **Success:** #2ecc71
- **Danger:** #e74c3c
- **Warning:** #f39c12
- **Font:** Inter (Google Fonts)
- **Border Radius:** 12px (cards)
- **Card Shadow:** 0 4px 24px rgba(0,0,0,0.07)
- **Sidebar:** 260px expanded, 72px collapsed
- **Topbar Height:** 64px

## License

MIT License
