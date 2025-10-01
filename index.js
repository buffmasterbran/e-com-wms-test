const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.static('public'));

// Load sample data
let netsuiteData = {};
let processedData = {};

try {
  const dataPath = path.join(__dirname, 'sample-data.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');
  netsuiteData = JSON.parse(rawData);
  
  // Process NetSuite data into WMS format
  processedData = processNetsuiteData(netsuiteData);
  console.log('NetSuite data loaded and processed successfully');
  console.log(`Processed ${processedData.fulfillments.length} fulfillment records`);
} catch (error) {
  console.error('Error loading sample data:', error);
  process.exit(1);
}

// Function to process NetSuite data into WMS format
function processNetsuiteData(data) {
  const fulfillments = [];
  const inventory = new Map();
  const orders = new Map();
  const customers = new Map();
  
  if (data.status === 'success' && data.data) {
    data.data.forEach(record => {
      if (record.recordType === 'itemfulfillment') {
        const values = record.values;
        
        // Process fulfillment record
        const fulfillment = {
          id: record.id,
          transactionId: values.tranid,
          salesOrderId: values['createdFrom.tranid'],
          customerName: values.name?.[0]?.text || 'Unknown Customer',
          customerId: values.name?.[0]?.value || 'Unknown',
          itemSku: values.item?.[0]?.text || 'Unknown',
          itemId: values.item?.[0]?.value || 'Unknown',
          itemName: values.item?.[0]?.text || 'Unknown Item',
          itemColor: values['item.custitem_item_color'] || '',
          itemSize: values['item.custitem_item_size'] || '',
          quantity: parseInt(values.quantity) || 0,
          shipDate: values['createdFrom.shipdate'] || '',
          createdDate: values.datecreated || '',
          shipAddress: values.shipaddress || '',
          shipMethod: values.shipmethod?.[0]?.text || 'Standard',
          urgency: values['createdFrom.custbody_sales_order_urgency']?.[0]?.text || 'Normal',
          orderClass: values['createdFrom.class']?.[0]?.text || 'Standard',
          memo: values.memo || '',
          warehouseNote: values['createdFrom.custbodypir_sales_order_warehouse_note'] || '',
          imageUrl: values.custcol1 || '',
          status: 'Fulfilled'
        };
        
        fulfillments.push(fulfillment);
        
        // Track inventory items
        if (values.item?.[0]?.text) {
          const sku = values.item[0].text;
          if (!inventory.has(sku)) {
            inventory.set(sku, {
              sku: sku,
              name: values.item[0].text,
              color: values['item.custitem_item_color'] || '',
              size: values['item.custitem_item_size'] || '',
              totalFulfilled: 0,
              lastFulfilled: fulfillment.createdDate,
              imageUrl: values.custcol1 || ''
            });
          }
          const item = inventory.get(sku);
          item.totalFulfilled += fulfillment.quantity;
          if (fulfillment.createdDate > item.lastFulfilled) {
            item.lastFulfilled = fulfillment.createdDate;
          }
        }
        
        // Track orders
        if (values['createdFrom.tranid']) {
          const orderId = values['createdFrom.tranid'];
          if (!orders.has(orderId)) {
            orders.set(orderId, {
              id: orderId,
              customerName: fulfillment.customerName,
              customerId: fulfillment.customerId,
              orderDate: values['createdFrom.saleseffectivedate'] || '',
              shipDate: values['createdFrom.shipdate'] || '',
              urgency: fulfillment.urgency,
              orderClass: fulfillment.orderClass,
              items: [],
              totalQuantity: 0,
              status: 'Fulfilled'
            });
          }
          const order = orders.get(orderId);
          order.items.push({
            sku: fulfillment.itemSku,
            quantity: fulfillment.quantity,
            itemName: fulfillment.itemName
          });
          order.totalQuantity += fulfillment.quantity;
        }
        
        // Track customers
        if (fulfillment.customerId !== 'Unknown') {
          customers.set(fulfillment.customerId, {
            id: fulfillment.customerId,
            name: fulfillment.customerName,
            totalOrders: 0,
            totalQuantity: 0,
            lastOrderDate: fulfillment.createdDate
          });
        }
      }
    });
  }
  
  // Update customer totals
  orders.forEach(order => {
    if (customers.has(order.customerId)) {
      const customer = customers.get(order.customerId);
      customer.totalOrders++;
      customer.totalQuantity += order.totalQuantity;
      if (order.orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = order.orderDate;
      }
    }
  });
  
  return {
    fulfillments: fulfillments,
    inventory: Array.from(inventory.values()),
    orders: Array.from(orders.values()),
    customers: Array.from(customers.values()),
    summary: {
      totalFulfillments: fulfillments.length,
      totalItems: inventory.size,
      totalOrders: orders.size,
      totalCustomers: customers.size
    }
  };
}

// API Routes

// Get all fulfillments
app.get('/api/fulfillments', (req, res) => {
  const { limit = 50, offset = 0, customer, item, urgency } = req.query;
  
  let fulfillments = processedData.fulfillments || [];
  
  // Apply filters
  if (customer) {
    fulfillments = fulfillments.filter(f => 
      f.customerName.toLowerCase().includes(customer.toLowerCase())
    );
  }
  
  if (item) {
    fulfillments = fulfillments.filter(f => 
      f.itemSku.toLowerCase().includes(item.toLowerCase()) ||
      f.itemName.toLowerCase().includes(item.toLowerCase())
    );
  }
  
  if (urgency) {
    fulfillments = fulfillments.filter(f => 
      f.urgency.toLowerCase().includes(urgency.toLowerCase())
    );
  }
  
  // Apply pagination
  const start = parseInt(offset);
  const end = start + parseInt(limit);
  const paginatedFulfillments = fulfillments.slice(start, end);
  
  res.json({
    fulfillments: paginatedFulfillments,
    total: fulfillments.length,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

// Get fulfillment by ID
app.get('/api/fulfillments/:id', (req, res) => {
  const { id } = req.params;
  const fulfillment = processedData.fulfillments?.find(f => f.id === id);
  
  if (!fulfillment) {
    return res.status(404).json({ error: 'Fulfillment not found' });
  }
  
  res.json(fulfillment);
});

// Get all inventory (aggregated from fulfillments)
app.get('/api/inventory', (req, res) => {
  res.json(processedData.inventory || []);
});

// Get inventory by SKU
app.get('/api/inventory/:sku', (req, res) => {
  const { sku } = req.params;
  const item = processedData.inventory?.find(item => item.sku === sku);
  
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  
  res.json(item);
});

// Get all orders (aggregated from fulfillments)
app.get('/api/orders', (req, res) => {
  res.json(processedData.orders || []);
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = processedData.orders?.find(order => order.id === id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// Get all customers
app.get('/api/customers', (req, res) => {
  res.json(processedData.customers || []);
});

// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const customer = processedData.customers?.find(c => c.id === id);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  res.json(customer);
});

// Get data summary
app.get('/api/summary', (req, res) => {
  res.json(processedData.summary || {});
});

// Get fulfillments by sales order
app.get('/api/orders/:orderId/fulfillments', (req, res) => {
  const { orderId } = req.params;
  const fulfillments = processedData.fulfillments?.filter(f => f.salesOrderId === orderId) || [];
  
  res.json(fulfillments);
});

// Get fulfillments by customer
app.get('/api/customers/:customerId/fulfillments', (req, res) => {
  const { customerId } = req.params;
  const fulfillments = processedData.fulfillments?.filter(f => f.customerId === customerId) || [];
  
  res.json(fulfillments);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    dataLoaded: Object.keys(processedData).length > 0,
    dataSource: 'NetSuite ERP',
    summary: processedData.summary
  });
});

// Serve the main page
app.get('/', (req, res) => {
  const summary = processedData.summary || {};
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WMS - Warehouse Management System</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
            .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .summary { background: #e8f4fd; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-item { text-align: center; }
            .summary-number { font-size: 2em; font-weight: bold; color: #007bff; }
            .summary-label { color: #666; font-size: 0.9em; }
            .api-list { margin: 20px 0; }
            .api-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
            .method { font-weight: bold; color: #007bff; }
            .endpoint { font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
            .description { color: #666; margin-top: 5px; }
            .filters { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏭 WMS - Warehouse Management System</h1>
            <p>Welcome to your Warehouse Management System! This system is currently running with <strong>NetSuite ERP data</strong>.</p>
            
            <div class="summary">
                <h2>📊 Data Summary</h2>
                <div class="summary-grid">
                    <div class="summary-item">
                        <div class="summary-number">${summary.totalFulfillments || 0}</div>
                        <div class="summary-label">Fulfillments</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${summary.totalItems || 0}</div>
                        <div class="summary-label">Unique Items</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${summary.totalOrders || 0}</div>
                        <div class="summary-label">Sales Orders</div>
                    </div>
                    <div class="summary-item">
                        <div class="summary-number">${summary.totalCustomers || 0}</div>
                        <div class="summary-label">Customers</div>
                    </div>
                </div>
            </div>
            
            <div class="filters">
                <h3>🔍 Query Parameters</h3>
                <p><strong>Fulfillments endpoint supports filtering:</strong></p>
                <ul>
                    <li><code>?customer=Name</code> - Filter by customer name</li>
                    <li><code>?item=SKU</code> - Filter by item SKU or name</li>
                    <li><code>?urgency=Level</code> - Filter by urgency level</li>
                    <li><code>?limit=50&offset=0</code> - Pagination</li>
                </ul>
            </div>
            
            <div class="api-list">
                <h2>Available API Endpoints:</h2>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/fulfillments</span>
                    <div class="description">Get all fulfillment records (with filtering & pagination)</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/fulfillments/:id</span>
                    <div class="description">Get specific fulfillment by ID</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/inventory</span>
                    <div class="description">Get aggregated inventory items from fulfillments</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/inventory/:sku</span>
                    <div class="description">Get specific inventory item by SKU</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/orders</span>
                    <div class="description">Get aggregated sales orders from fulfillments</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/orders/:id</span>
                    <div class="description">Get specific order by ID</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/customers</span>
                    <div class="description">Get all customers</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/customers/:id</span>
                    <div class="description">Get specific customer by ID</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/summary</span>
                    <div class="description">Get data summary statistics</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/orders/:orderId/fulfillments</span>
                    <div class="description">Get fulfillments for a specific sales order</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/customers/:customerId/fulfillments</span>
                    <div class="description">Get fulfillments for a specific customer</div>
                </div>
                
                <div class="api-item">
                    <span class="method">GET</span> <span class="endpoint">/api/health</span>
                    <div class="description">Health check with data summary</div>
                </div>
            </div>
            
            <p><strong>Data Source:</strong> NetSuite ERP (Item Fulfillment records)</p>
            <p><strong>To update data:</strong> Replace the <code>sample-data.json</code> file with fresh NetSuite data and restart the server.</p>
        </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 WMS Server running on http://localhost:${PORT}`);
  console.log(`📊 NetSuite data processed: ${processedData.summary?.totalFulfillments || 0} fulfillments, ${processedData.summary?.totalItems || 0} items, ${processedData.summary?.totalOrders || 0} orders, ${processedData.summary?.totalCustomers || 0} customers`);
});
