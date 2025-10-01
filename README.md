# WMS - Warehouse Management System

A simple Warehouse Management System built with Node.js and Express, designed to work with sample JSON data before integrating with your actual ERP system.

## Features

- **Inventory Management**: Track products, quantities, locations, and status
- **Order Processing**: Manage customer orders and fulfillment
- **Warehouse Locations**: Organize storage locations and capacity
- **Supplier Management**: Track supplier information and contacts
- **RESTful API**: Clean API endpoints for all operations

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Replace Sample Data** (Optional)
   - Edit `sample-data.json` with your actual NetSuite data
   - The system currently loads your existing NetSuite fulfillment data
   - Keep the same JSON structure for compatibility

3. **Start the Server**
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

4. **Access the System**
   - **Web Dashboard**: Open `http://localhost:3000` in your browser
   - **API Documentation**: View available endpoints on the homepage
   - The dashboard automatically loads data from the API

## Sample Data Structure

The `sample-data.json` file contains the following sections:

### Inventory
- Product SKU, name, description
- Quantity, unit price, location
- Category and status information

### Orders
- Customer information and order details
- Order items with quantities and prices
- Shipping addresses and order status

### Warehouse Locations
- Zone, aisle, and shelf information
- Capacity and current stock levels
- Location status

### Suppliers
- Supplier contact information
- Address and communication details
- Supplier status

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | Get all inventory items |
| GET | `/api/inventory/:sku` | Get specific inventory item |
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/:id` | Get specific order |
| GET | `/api/locations` | Get warehouse locations |
| GET | `/api/suppliers` | Get suppliers |
| PUT | `/api/inventory/:sku/quantity` | Update inventory quantity |
| GET | `/api/health` | Health check |

## Example API Usage

### Get All Inventory
```bash
curl http://localhost:3000/api/inventory
```

### Get Specific Item
```bash
curl http://localhost:3000/api/inventory/WIDGET-001
```

### Update Inventory Quantity
```bash
curl -X PUT http://localhost:3000/api/inventory/WIDGET-001/quantity \
  -H "Content-Type: application/json" \
  -d '{"quantity": 200}'
```

## Future ERP Integration

This system is designed to be easily modified for ERP integration:

1. Replace the file-based data loading in `index.js`
2. Add database connection logic
3. Implement ERP API calls
4. Add authentication and authorization
5. Include data validation and error handling

## Development

- **Node.js**: ^14.0.0
- **Express**: ^4.18.2
- **Additional packages**: cors, helmet, morgan

## Web Dashboard

The system includes a modern web dashboard built with HTML, CSS, and JavaScript:

### Features
- **Real-time Statistics**: View fulfillments, orders, items, and customers at a glance
- **Interactive Charts**: Visualize sales and fulfillment data
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Clean, minimalist design with gray tones
- **Live Data**: Automatically fetches data from the API

### Dashboard Pages
- **Home**: Overview with key metrics and recent activity
- **Products**: View inventory items (to be implemented)
- **Orders**: Manage customer orders (to be implemented)
- **Customers**: Track customer information (to be implemented)
- **Fulfillments**: Monitor shipments (to be implemented)
- **Settings**: System configuration (to be implemented)

### Technologies Used
- Vanilla JavaScript (ES6+)
- Chart.js for data visualization
- Font Awesome for icons
- CSS Grid and Flexbox for layouts

## Migrating to React

The current implementation uses vanilla HTML/CSS/JS for simplicity. To migrate to React:

1. Create a new React app: `npx create-react-app wms-frontend`
2. Convert the HTML structure to React components
3. Use React hooks (useState, useEffect) for state management
4. Consider using libraries like Recharts or Chart.js React wrapper
5. Add React Router for navigation between pages

## License

MIT License - feel free to modify and use for your warehouse management needs.

