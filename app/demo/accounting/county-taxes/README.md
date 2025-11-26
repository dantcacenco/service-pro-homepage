# County Tax Dashboard

## Overview
The County Tax Dashboard tracks county tax collections from paid invoices, providing detailed breakdowns by county with date range filtering capabilities.

## Features

### 1. Date Range Filters
- **Current Month** - Default view showing current month's data
- **Last Month** - Previous month's data
- **Current Quarter** - Q1, Q2, Q3, or Q4 based on current date
- **Year to Date (YTD)** - All data from January 1st to today
- **Custom Range** - Select specific start and end dates

### 2. Summary Cards
- **Total County Tax Collected** - Sum of all county taxes for the selected period
- **Total Paid Invoices** - Count of paid invoices in the selected period
- **Counties** - Number of unique counties represented

### 3. County Tax Table
- **County Name** - NC County where the service was performed
- **Total Tax Collected** - Sum of county_tax_amount for that county
- **Number of Invoices** - Count of paid invoices for that county
- **Collapsible Details** - Expand/collapse to see per-invoice breakdown

### 4. Invoice Details (Expanded View)
When you click on a county row or the chevron icon, you'll see:
- **Customer Name** - From the customers table
- **Customer Address** - Service location address
- **Job Total** - Total invoice amount (before taxes)
- **County Tax Amount** - County-specific tax portion (2-2.75%)
- **Paid Date** - When the invoice was paid (paid_at field)
- **Invoice Link** - Link to Bill.com invoice (if billcom_invoice_id exists)

## Data Source

### Query Logic
```sql
SELECT
  county,
  SUM(county_tax_amount) as total_county_tax,
  COUNT(*) as invoice_count
FROM invoices
WHERE status = 'paid'
  AND paid_at >= [start_date]
  AND paid_at <= [end_date]
  AND county IS NOT NULL
  AND county_tax_amount IS NOT NULL
GROUP BY county
ORDER BY total_county_tax DESC;
```

### Table Relationships
- **invoices** table - Main data source
  - `county` - NC County name
  - `county_tax_amount` - County tax portion (2-2.75%)
  - `status` - Must be 'paid'
  - `paid_at` - Payment date for filtering
  - `amount` - Total invoice amount
  - `billcom_invoice_id` - Link to Bill.com
- **customers** table - Joined for customer details
  - `name` - Customer name
  - `address` - Service location

## Access Control
- **Role Required**: boss or admin
- **Redirect**: Unauthorized users are redirected to home page
- **Authentication**: Users must be signed in

## Technical Implementation

### Server Component (`page.tsx`)
- Handles authentication
- Checks user role
- Renders the dashboard component

### Client Component (`CountyTaxesDashboard.tsx`)
- Manages state for date filters and expanded counties
- Fetches data from Supabase
- Renders interactive UI with Tailwind CSS
- Uses shadcn/ui components (Button, Select)
- Implements collapsible rows with lucide-react icons

### Loading States
- Shows "Loading county tax data..." while fetching
- Error handling with retry button
- Empty state message when no data found

## URL Path
```
/accounting/county-taxes
```

## Future Enhancements
1. Export to CSV/Excel functionality
2. Print-friendly view for tax reporting
3. County tax rate display
4. Monthly comparison charts
5. Filter by specific counties
6. Search functionality
7. Pagination for large datasets
