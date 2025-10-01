# WMS Web Dashboard Guide

## Overview

Your WMS now includes a modern web dashboard with a clean, professional design using gray tones. The interface is built with vanilla HTML, CSS, and JavaScript for simplicity and can easily be migrated to React later.

## Accessing the Dashboard

1. Make sure your server is running:
   ```bash
   npm start
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

## Dashboard Features

### Current Implementation

#### 1. **Navigation Sidebar** (Left Side)
- **Dark gray background** with white text
- Menu items:
  - Home (active by default)
  - Products
  - Orders
  - Customers
  - Fulfillments
  - Settings
- Log out button at the bottom
- Responsive: Collapses to icon-only on smaller screens

#### 2. **Top Header Bar**
- **Search bar** with magnifying glass icon
- **Notification bell** with badge counter
- **User avatar** icon

#### 3. **Main Dashboard Content**

##### Stats Cards (Top Section)
Four card showing key metrics:
- **Fulfillments**: Total number from your NetSuite data
- **New Orders**: Total orders processed
- **Items**: Unique inventory items
- **Customers**: Total customers

Each card displays:
- Large number
- "Qty" label
- Descriptive title

##### Sales Chart
- Bar chart showing fulfillment distribution
- Uses Chart.js for smooth rendering
- Four categories: Confirmed, Packed, Refunded, Shipped
- Gray color scheme matching the design

##### Top Item Categories
- Grid of 6 category icons
- Hover effect: transforms and changes color
- Icons include: box, cube, shopping bag, gifts, archive, tag

##### Stock Numbers
List showing:
- Low stock items count
- Item categories count
- Total items count

##### Recent Orders Table
- Shows first 5 orders
- Columns: Order ID, Customer, Items, Status
- Clean table design with hover effects

## Design Details

### Color Scheme
- **Background**: Light gray (#f5f5f7)
- **Sidebar**: Dark gray (#2d2d2d)
- **Cards**: White (#ffffff)
- **Text Primary**: Near black (#1d1d1f)
- **Text Secondary**: Medium gray (#6e6e73)
- **Accents**: Medium gray (#5e5e5e)

### Typography
- System fonts (Apple/Windows native)
- Clean, modern sans-serif
- Multiple font weights for hierarchy

### Layout
- CSS Grid for responsive columns
- Flexbox for component alignment
- Card-based design with shadows
- Rounded corners (8-16px border radius)

## File Structure

```
public/
├── index.html      # Main HTML structure
├── styles.css      # All styling (gray tones)
└── app.js          # JavaScript functionality
```

## JavaScript Features

### Data Loading
- Automatically fetches data from API endpoints on page load
- Updates all dashboard components with real data
- Error handling with user-friendly messages

### Interactive Elements
- **Navigation**: Click sidebar items (logs to console currently)
- **Search**: Live search with debouncing (300ms delay)
- **Charts**: Interactive Chart.js visualization
- **Hover Effects**: Cards, buttons, and table rows

### API Integration
```javascript
const API_BASE = 'http://localhost:3000/api';

// Fetches from:
- /api/summary          (Dashboard stats)
- /api/orders           (Orders table)
- /api/inventory        (Stock numbers)
- /api/fulfillments     (Chart data)
```

## Responsive Design

### Desktop (1024px+)
- Full sidebar with text labels
- Two-column layout for cards
- Wide search bar

### Tablet (768px - 1024px)
- Sidebar remains visible
- Single column layout
- Adjusted spacing

### Mobile (< 768px)
- Collapsed sidebar (icons only)
- Stacked layout
- Smaller stats grid (2 columns)

## Next Steps for Development

### To Add More Pages
1. Create new HTML content sections in `index.html`
2. Add show/hide logic in `app.js` navigation
3. Fetch appropriate data for each page

### To Enhance Current Page
- Add real-time updates with setInterval
- Implement filters for the orders table
- Add date range selectors
- Create drill-down views (click to see details)

### To Migrate to React

1. **Create React App**
   ```bash
   npx create-react-app wms-react
   cd wms-react
   ```

2. **Component Structure**
   ```
   src/
   ├── components/
   │   ├── Sidebar.jsx
   │   ├── Header.jsx
   │   ├── StatCard.jsx
   │   ├── SalesChart.jsx
   │   └── OrdersTable.jsx
   ├── pages/
   │   ├── Home.jsx
   │   ├── Products.jsx
   │   └── Orders.jsx
   ├── hooks/
   │   └── useApi.js
   └── App.jsx
   ```

3. **Install Dependencies**
   ```bash
   npm install react-router-dom chart.js react-chartjs-2 axios
   npm install @fortawesome/fontawesome-free
   ```

4. **Convert to Components**
   - Split HTML into reusable React components
   - Use useState for local state
   - Use useEffect for data fetching
   - Use React Router for navigation

## Tips for Customization

### Changing Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --primary-bg: #f5f5f7;        /* Main background */
    --sidebar-bg: #2d2d2d;        /* Sidebar color */
    --card-bg: #ffffff;           /* Card background */
    --text-primary: #1d1d1f;      /* Main text */
    --accent-color: #5e5e5e;      /* Accent elements */
}
```

### Adding New Stat Cards
In `index.html`, duplicate a stat-card:
```html
<div class="stat-card">
    <div class="stat-number" id="statNewMetric">0</div>
    <div class="stat-label">Qty</div>
    <div class="stat-title">NEW METRIC</div>
</div>
```

Update in `app.js`:
```javascript
document.getElementById('statNewMetric').textContent = data.newMetric;
```

### Modifying the Chart
In `app.js`, find the `createSalesChart()` function and modify:
- Chart type: 'bar', 'line', 'pie', 'doughnut'
- Colors: Change backgroundColor
- Data: Modify processChartData() function

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lightweight: No heavy frameworks
- Fast load time: ~50KB total assets (excluding external CDNs)
- Smooth animations: CSS transitions
- Efficient data fetching: Async/await with proper error handling

## Support

For issues or questions:
1. Check browser console for JavaScript errors
2. Verify API server is running on port 3000
3. Check network tab for failed API requests
4. Ensure sample-data.json is properly formatted




