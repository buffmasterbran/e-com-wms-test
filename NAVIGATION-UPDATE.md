# Navigation Update - Three Order Types

## Changes Made

The sidebar navigation has been updated to show only 3 menu options as requested:

### Sidebar Menu
1. **Singles Orders** (default/active page)
   - Icon: Box icon
   - Shows the main dashboard with stats, charts, and tables
   
2. **High Volume Orders**
   - Icon: Multiple boxes icon
   - Shows orders with more than 10 items
   - Table displays: Order ID, Customer, Quantity, Status
   
3. **Unique Orders**
   - Icon: Star icon
   - Shows orders with special characteristics (Expedited or Customized)
   - Table displays: Order ID, Customer, Special Notes, Status

## How It Works

### Page Switching
- Click any menu item in the sidebar
- The page title updates automatically
- The content area switches to show the relevant data
- Smooth fade-in animation when switching pages
- Active menu item is highlighted

### Current Implementation

#### Singles Orders (Default Page)
Shows the full dashboard with:
- 4 stat cards (Fulfillments, Orders, Items, Customers)
- Sales chart (bar chart)
- Top item categories (6 icon grid)
- Stock numbers (3-item list)
- Recent orders table

#### High Volume Orders
Currently configured to show:
- Orders where `totalQuantity > 10`
- Displays in a clean table format
- Filters data from your NetSuite orders

#### Unique Orders
Currently configured to show:
- Orders with urgency level "Expedite"
- Orders with order class "Customized"
- Shows special notes/characteristics

## Next Steps

Now that the navigation structure is working, you can customize what each page displays:

### For Singles Orders
You might want to show:
- Individual item orders (quantity = 1)
- Regular processing orders
- Standard fulfillment workflow

### For High Volume Orders
You might want to show:
- Bulk order management
- Special handling requirements
- Inventory allocation status

### For Unique Orders
You might want to show:
- Custom engraving details
- Special packaging requirements
- Priority processing information

## Customization Guide

### To Change What Data Shows on Each Page

Edit `public/app.js` and modify these functions:

```javascript
// For Singles Orders - modify the loadDashboardData() function
// Currently shows all orders in the main dashboard

// For High Volume Orders - modify loadHighVolumeOrders()
function loadHighVolumeOrders() {
    // Change filter criteria here
    const highVolumeOrders = appState.orders.filter(order => 
        order.totalQuantity > 10  // Adjust this threshold
    );
    // ... rest of the code
}

// For Unique Orders - modify loadUniqueOrders()
function loadUniqueOrders() {
    // Change filter criteria here
    const uniqueOrders = appState.orders.filter(order => 
        order.urgency?.includes('Expedite') ||  // Customize filters
        order.orderClass?.includes('Customized')
    );
    // ... rest of the code
}
```

### To Add More Components to a Page

Edit `public/index.html` and add content inside the page containers:

```html
<!-- For Singles Orders -->
<div class="page-content" id="page-singles">
    <!-- Add your components here -->
</div>

<!-- For High Volume Orders -->
<div class="page-content" id="page-high-volume" style="display: none;">
    <!-- Add your components here -->
</div>

<!-- For Unique Orders -->
<div class="page-content" id="page-unique" style="display: none;">
    <!-- Add your components here -->
</div>
```

## Testing the Navigation

1. Open `http://localhost:3000` in your browser
2. You should see "Singles Orders" as the default page
3. Click "High Volume Orders" - the page should switch and show filtered orders
4. Click "Unique Orders" - the page should switch to show special orders
5. Click back to "Singles Orders" - returns to the full dashboard

## Current Data Counts (from your NetSuite data)

Based on the current filtering logic:
- **Singles Orders**: Shows all 25 orders in various views
- **High Volume Orders**: Shows orders with >10 items (will vary based on your data)
- **Unique Orders**: Shows orders marked as Expedite or Customized

## Questions to Consider

To help customize each page further, consider:

1. **Singles Orders**: 
   - Should this show only orders with 1 item?
   - Or should it be the main dashboard view?
   - What's most important to see first?

2. **High Volume Orders**:
   - What quantity threshold defines "high volume"?
   - Do you need special packing/handling info?
   - Should it show available inventory?

3. **Unique Orders**:
   - What makes an order "unique" in your workflow?
   - Do you need to see engraving details?
   - Should it show special shipping requirements?

Let me know what specific data/components you'd like to see on each page!



