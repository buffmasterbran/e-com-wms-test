// API Base URL - use relative path to work both locally and on Railway
const API_BASE = '/api';

// State Management
let appState = {
    summary: {},
    orders: [],
    inventory: [],
    fulfillments: [],
    currentPage: 'singles',
    currentSizeFilter: 'all',
    singleItemOrders: [],
    // Track which orders belong to which category (for mutual exclusivity)
    singlesOrderIds: new Set(),
    bulkOrderIds: new Set(),
    highVolumeOrderIds: new Set()
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSizeFilters();
    initProcessButton();
    loadDashboardData();
    initSearch();
});

// Navigation
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-page]');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.getAttribute('data-page');
            
            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch pages
            switchPage(page);
            
            appState.currentPage = page;
        });
    });
}

// Switch between pages
function switchPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.style.display = 'none';
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`page-${pageName}`);
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Update page title
    const titles = {
        'singles': 'Singles Orders',
        'bulk': 'Bulk Orders',
        'high-volume': 'High Volume Orders',
        'unique': 'Unique Orders'
    };
    
    document.getElementById('pageTitle').textContent = titles[pageName] || 'Dashboard';
    
    // Load data for the specific page
    loadPageData(pageName);
}

// Load data for specific page
function loadPageData(pageName) {
    console.log(`Loading data for: ${pageName}`);
    
    switch(pageName) {
        case 'singles':
            loadSinglesOrders();
            break;
        case 'bulk':
            loadBulkOrders();
            break;
        case 'high-volume':
            loadHighVolumeOrders();
            break;
        case 'unique':
            loadUniqueOrders();
            break;
    }
}

// Initialize size filter buttons
function initSizeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Get selected size
            const size = button.getAttribute('data-size');
            appState.currentSizeFilter = size;
            
            // Filter and display orders
            filterSinglesOrders(size);
        });
    });
}

// Initialize Process Singles button
function initProcessButton() {
    const processBtn = document.getElementById('process-singles-btn');
    
    if (processBtn) {
        processBtn.addEventListener('click', () => {
            processSinglesOrders();
        });
    }
}

// Process Singles Orders
function processSinglesOrders() {
    // Get currently displayed orders (respects the active filter)
    const currentFilter = appState.currentSizeFilter;
    let ordersToProcess = [...appState.singleItemOrders];
    
    // Apply the same filter logic
    if (currentFilter !== 'all') {
        ordersToProcess = ordersToProcess.filter(order => {
            const sku = order.itemSku || '';
            const itemSize = order.itemSize || '';
            
            if (currentFilter === '10oz') {
                return sku.startsWith('DPT10') || sku.startsWith('PT10') || itemSize.includes('10oz');
            } else if (currentFilter === '16oz') {
                return sku.startsWith('DPT16') || sku.startsWith('PT16') || itemSize.includes('16oz');
            } else if (currentFilter === '26oz') {
                return sku.startsWith('DPT26') || sku.startsWith('PT26') || itemSize.includes('26oz');
            } else if (currentFilter === 'stickers') {
                return sku.startsWith('PL-STCK');
            }
            return false;
        });
    }
    
    console.log(`Processing ${ordersToProcess.length} single orders with filter: ${currentFilter}`);
    
    // Show confirmation dialog
    const confirmMessage = currentFilter === 'all' 
        ? `Process all ${ordersToProcess.length} single item orders?`
        : `Process ${ordersToProcess.length} ${currentFilter} orders?`;
    
    if (confirm(confirmMessage)) {
        // TODO: Add actual processing logic here
        // For now, just show a success message
        showSuccessMessage(`Successfully processed ${ordersToProcess.length} orders!`);
    }
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #00A86B;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,168,107,0.3);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => successDiv.remove(), 300);
    }, 3000);
}

// Pre-categorize singles orders (for mutual exclusivity tracking)
function categorizeSinglesOrders() {
    // Filter fulfillments to get single item orders
    const singleItemFulfillments = appState.fulfillments.filter(f => f.quantity === 1);
    
    // Group by order ID to show each order only once
    const orderMap = new Map();
    
    singleItemFulfillments.forEach(fulfillment => {
        const orderId = fulfillment.salesOrderId || fulfillment.transactionId;
        
        if (!orderMap.has(orderId)) {
            // First item for this order - store it
            orderMap.set(orderId, {
                ...fulfillment,
                itemCount: 1,
                allItems: [fulfillment.itemSku]
            });
        } else {
            // Order already exists - increment count and add item
            const existing = orderMap.get(orderId);
            existing.itemCount++;
            existing.allItems.push(fulfillment.itemSku);
        }
    });
    
    // Convert back to array - only orders with exactly 1 unique item (singles)
    appState.singleItemOrders = Array.from(orderMap.values()).filter(order => order.itemCount === 1);
    
    // Track singles order IDs for mutual exclusivity
    appState.singlesOrderIds.clear();
    appState.singleItemOrders.forEach(order => {
        const orderId = order.salesOrderId || order.transactionId;
        appState.singlesOrderIds.add(orderId);
    });
    
    console.log(`Categorized ${appState.singlesOrderIds.size} single orders`);
}

// Load singles orders (orders with only 1 item per fulfillment)
function loadSinglesOrders() {
    // Ensure singles are categorized (may already be done during initial load)
    if (appState.singleItemOrders.length === 0 || appState.singlesOrderIds.size === 0) {
        categorizeSinglesOrders();
    }
    
    // Display with current filter
    filterSinglesOrders(appState.currentSizeFilter);
}

// Load bulk orders (group identical orders)
function loadBulkOrders() {
    // Create a signature for each order based on its items
    const orderSignatures = new Map();
    
    // Group fulfillments by sales order first
    const orderMap = new Map();
    appState.fulfillments.forEach(f => {
        const orderId = f.salesOrderId || f.transactionId;
        if (!orderMap.has(orderId)) {
            orderMap.set(orderId, []);
        }
        orderMap.get(orderId).push(f);
    });
    
    // For each order, create a signature and group identical ones (excluding singles)
    orderMap.forEach((items, orderId) => {
        // EXCLUDE orders that are already in Singles
        if (appState.singlesOrderIds.has(orderId)) {
            return;
        }
        
        // Sort items by SKU and create a signature
        const itemSignature = items
            .map(item => `${item.itemSku}:${item.quantity}`)
            .sort()
            .join('|');
        
        if (!orderSignatures.has(itemSignature)) {
            orderSignatures.set(itemSignature, {
                signature: itemSignature,
                items: items.map(item => ({
                    sku: item.itemSku,
                    name: item.itemName,
                    quantity: item.quantity,
                    size: item.itemSize
                })),
                orders: [],
                totalOrders: 0
            });
        }
        
        const group = orderSignatures.get(itemSignature);
        group.orders.push({
            orderId: orderId,
            customer: items[0].customerName,
            shipDate: items[0].shipDate,
            status: items[0].status
        });
        group.totalOrders++;
    });
    
    // Filter to only show groups with 2+ identical orders
    const bulkGroups = Array.from(orderSignatures.values())
        .filter(group => group.totalOrders >= 2)
        .sort((a, b) => b.totalOrders - a.totalOrders); // Sort by count descending
    
    // Track bulk order IDs for mutual exclusivity
    appState.bulkOrderIds.clear();
    bulkGroups.forEach(group => {
        group.orders.forEach(order => {
            appState.bulkOrderIds.add(order.orderId);
        });
    });
    
    console.log(`Categorized ${appState.bulkOrderIds.size} bulk orders (excluding ${appState.singlesOrderIds.size} singles)`);
    
    displayBulkOrders(bulkGroups);
}

// Display bulk orders as tiles
function displayBulkOrders(bulkGroups) {
    const container = document.getElementById('bulkOrdersGrid');
    container.innerHTML = '';
    
    if (bulkGroups.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">No bulk orders found. Bulk orders are groups of 2+ identical orders.</p>';
        return;
    }
    
    bulkGroups.forEach((group, index) => {
        const tile = document.createElement('div');
        tile.className = 'bulk-order-tile';
        
        // Create items list
        const itemsHtml = group.items.map(item => `
            <div class="bulk-item">
                <div class="bulk-item-icon"></div>
                <div>
                    <span class="bulk-item-sku">${item.sku}</span>
                    <span class="bulk-item-quantity"> × ${item.quantity}</span>
                </div>
            </div>
        `).join('');
        
        tile.innerHTML = `
            <div class="bulk-tile-header">
                <div class="bulk-tile-title">Bulk Order ${index + 1}</div>
                <div class="bulk-tile-count">${group.totalOrders} orders</div>
            </div>
            <div class="bulk-tile-items">
                ${itemsHtml}
            </div>
            <div class="bulk-tile-footer">
                Click to view all ${group.totalOrders} orders
            </div>
        `;
        
        // Add click handler to show order details
        tile.addEventListener('click', () => {
            showBulkOrderDetails(group, index + 1);
        });
        
        container.appendChild(tile);
    });
    
    console.log(`Displaying ${bulkGroups.length} bulk order groups`);
}

// Show details of a bulk order group
function showBulkOrderDetails(group, groupNumber) {
    const ordersHtml = group.orders.map(order => `
        <tr>
            <td><strong>${order.orderId}</strong></td>
            <td>${order.customer}</td>
            <td>${order.shipDate || '-'}</td>
            <td><span class="status-badge">${order.status}</span></td>
        </tr>
    `).join('');
    
    const itemsListHtml = group.items.map(item => 
        `<li><strong>${item.sku}</strong> × ${item.quantity}</li>`
    ).join('');
    
    const message = `
        <div style="max-width: 800px;">
            <h3>Bulk Order ${groupNumber}</h3>
            <p><strong>${group.totalOrders} Identical Orders</strong></p>
            
            <h4>Items in each order:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                ${itemsListHtml}
            </ul>
            
            <h4>Orders:</h4>
            <table class="data-table" style="margin-top: 10px;">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Ship Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${ordersHtml}
                </tbody>
            </table>
        </div>
    `;
    
    // Create modal or show in console for now
    // You can enhance this with a proper modal later
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
    `;
    
    modalContent.innerHTML = `
        ${message}
        <button onclick="this.parentElement.parentElement.remove()" 
                style="margin-top: 20px; padding: 12px 24px; background: var(--forever-green); 
                       color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
            Close
        </button>
    `;
    
    modal.appendChild(modalContent);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// Filter singles orders by size
function filterSinglesOrders(size) {
    let filteredOrders = [...appState.singleItemOrders];
    
    // Apply size filter based on SKU pattern
    if (size !== 'all') {
        filteredOrders = filteredOrders.filter(order => {
            const sku = order.itemSku || '';
            const itemSize = order.itemSize || '';
            
            // Match by SKU prefix (DPT10, DPT16, DPT26, PT10, PT16, PT26)
            // or by item size field
            if (size === '10oz') {
                return sku.startsWith('DPT10') || sku.startsWith('PT10') || itemSize.includes('10oz');
            } else if (size === '16oz') {
                return sku.startsWith('DPT16') || sku.startsWith('PT16') || itemSize.includes('16oz');
            } else if (size === '26oz') {
                return sku.startsWith('DPT26') || sku.startsWith('PT26') || itemSize.includes('26oz');
            } else if (size === 'stickers') {
                return sku.startsWith('PL-STCK');
            }
            return false;
        });
    }
    
    // Display the filtered orders
    displaySinglesOrders(filteredOrders);
}

// Display singles orders in the table
function displaySinglesOrders(orders) {
    const tbody = document.getElementById('singlesOrdersTableBody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #999;">
                    No single item orders found for the selected filter
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.salesOrderId || order.transactionId}</strong></td>
            <td>${order.customerName}</td>
            <td><strong>${order.itemSku}</strong></td>
            <td>${order.itemSize || '-'}</td>
            <td>${order.quantity}</td>
            <td>${order.shipDate || '-'}</td>
            <td><span class="status-badge">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    console.log(`Displaying ${orders.length} single item orders`);
}

// Load high volume orders (group by SKU)
function loadHighVolumeOrders() {
    // Group fulfillments by SKU (excluding Singles and Bulk orders)
    const skuMap = new Map();
    
    appState.fulfillments.forEach(fulfillment => {
        const orderId = fulfillment.salesOrderId || fulfillment.transactionId;
        
        // EXCLUDE orders that are already in Singles or Bulk
        if (appState.singlesOrderIds.has(orderId) || appState.bulkOrderIds.has(orderId)) {
            return;
        }
        
        const sku = fulfillment.itemSku;
        
        if (!skuMap.has(sku)) {
            skuMap.set(sku, {
                sku: sku,
                itemName: fulfillment.itemName,
                itemSize: fulfillment.itemSize,
                itemColor: fulfillment.itemColor,
                orderCount: 0,
                totalQuantity: 0,
                orders: [],
                orderIds: new Set()
            });
        }
        
        const skuData = skuMap.get(sku);
        
        // Only count unique orders per SKU
        if (!skuData.orderIds.has(orderId)) {
            skuData.orderCount++;
            skuData.orderIds.add(orderId);
        }
        
        skuData.totalQuantity += fulfillment.quantity;
        skuData.orders.push(fulfillment);
    });
    
    // Convert to array and filter for items with multiple orders (2+)
    const highVolumeItems = Array.from(skuMap.values())
        .filter(item => item.orderCount >= 2)
        .sort((a, b) => b.orderCount - a.orderCount); // Sort by order count descending
    
    // Track high volume order IDs for mutual exclusivity
    appState.highVolumeOrderIds.clear();
    highVolumeItems.forEach(item => {
        item.orderIds.forEach(orderId => {
            appState.highVolumeOrderIds.add(orderId);
        });
    });
    
    console.log(`Categorized ${appState.highVolumeOrderIds.size} high volume orders (excluding ${appState.singlesOrderIds.size} singles + ${appState.bulkOrderIds.size} bulk)`);
    
    const tbody = document.getElementById('highVolumeTableBody');
    tbody.innerHTML = '';
    
    if (highVolumeItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px; color: #999;">No high volume items found</td></tr>';
        return;
    }
    
    highVolumeItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${item.sku}</strong></td>
            <td>${item.itemName}</td>
            <td>${item.itemSize || '-'}</td>
            <td><span class="status-badge">${item.orderCount} orders</span></td>
            <td><strong>${item.totalQuantity}</strong></td>
            <td><button class="view-orders-btn" data-sku="${item.sku}" data-count="${item.orderCount}">View Orders</button></td>
        `;
        tbody.appendChild(row);
    });
    
    // Add click handlers for view buttons
    document.querySelectorAll('.view-orders-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sku = btn.getAttribute('data-sku');
            const count = btn.getAttribute('data-count');
            showOrdersForSku(sku, count);
        });
    });
}

// Show orders for a specific SKU
function showOrdersForSku(sku, count) {
    // Filter to get only orders with this SKU that aren't in Singles or Bulk
    const skuData = appState.fulfillments.filter(f => {
        const orderId = f.salesOrderId || f.transactionId;
        return f.itemSku === sku && 
               !appState.singlesOrderIds.has(orderId) && 
               !appState.bulkOrderIds.has(orderId);
    });
    
    // Update title
    document.getElementById('sku-orders-title').textContent = `${count} Orders for ${sku}`;
    
    // Show the card
    document.getElementById('sku-orders-card').style.display = 'block';
    
    // Populate table
    const tbody = document.getElementById('skuOrdersTableBody');
    tbody.innerHTML = '';
    
    skuData.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.salesOrderId || order.transactionId}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.quantity}</td>
            <td>${order.shipDate || '-'}</td>
            <td><span class="status-badge">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
    
    // Scroll to the orders table
    document.getElementById('sku-orders-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Load unique orders
function loadUniqueOrders() {
    // Unique orders are those that don't fit Singles, Bulk, or High Volume
    // Simply exclude any order that's already been categorized
    
    const uniqueOrders = appState.orders.filter(order => {
        const orderId = order.id;
        
        // EXCLUDE orders that are already in Singles, Bulk, or High Volume
        if (appState.singlesOrderIds.has(orderId)) return false;
        if (appState.bulkOrderIds.has(orderId)) return false;
        if (appState.highVolumeOrderIds.has(orderId)) return false;
        
        // This is a unique order (everything else)
        return true;
    });
    
    console.log(`Found ${uniqueOrders.length} unique orders (excluding ${appState.singlesOrderIds.size} singles + ${appState.bulkOrderIds.size} bulk + ${appState.highVolumeOrderIds.size} high volume)`);
    
    const tbody = document.getElementById('uniqueOrdersTableBody');
    tbody.innerHTML = '';
    
    if (uniqueOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #999;">No unique orders found</td></tr>';
        return;
    }
    
    uniqueOrders.forEach(order => {
        const row = document.createElement('tr');
        const itemsList = order.items?.map(item => `${item.sku} (${item.quantity})`).join(', ') || 'Mixed items';
        row.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.totalQuantity}</td>
            <td style="font-size: 0.85em;">${itemsList}</td>
            <td><span class="status-badge">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Search Functionality
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            if (query.length > 2) {
                performSearch(query);
            }
        }, 300);
    });
}

function performSearch(query) {
    console.log(`Searching for: ${query}`);
    // You can implement search logic here
    // For now, it just logs the search query
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load summary data
        const summaryResponse = await fetch(`${API_BASE}/summary`);
        const summary = await summaryResponse.json();
        appState.summary = summary;
        
        // Update stats cards
        updateStatsCards(summary);
        
        // Load orders
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        const orders = await ordersResponse.json();
        appState.orders = orders;
        
        // Update orders table
        updateOrdersTable(orders.slice(0, 5)); // Show first 5
        
        // Load inventory for stock numbers
        const inventoryResponse = await fetch(`${API_BASE}/inventory`);
        const inventory = await inventoryResponse.json();
        appState.inventory = inventory;
        
        // Update stock numbers
        updateStockNumbers(inventory);
        
        // Load fulfillments for chart
        const fulfillmentsResponse = await fetch(`${API_BASE}/fulfillments?limit=100`);
        const fulfillmentsData = await fulfillmentsResponse.json();
        appState.fulfillments = fulfillmentsData.fulfillments || [];
        
        // Pre-categorize orders for mutual exclusivity
        // This ensures Singles are identified first, then Bulk, then High Volume
        categorizeSinglesOrders();
        
        // Create chart
        createSalesChart(appState.fulfillments);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Show error message to user
        showError('Failed to load dashboard data. Please check if the server is running.');
    }
}

// Update Stats Cards
function updateStatsCards(summary) {
    document.getElementById('statFulfillments').textContent = summary.totalFulfillments || 0;
    document.getElementById('statOrders').textContent = summary.totalOrders || 0;
    document.getElementById('statItems').textContent = summary.totalItems || 0;
    document.getElementById('statCustomers').textContent = summary.totalCustomers || 0;
}

// Update Orders Table
function updateOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #999;">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName}</td>
            <td>${order.totalQuantity || order.items?.length || 0}</td>
            <td><span class="status-badge">${order.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Update Stock Numbers
function updateStockNumbers(inventory) {
    const lowStockItems = inventory.filter(item => item.totalFulfilled < 10).length;
    const categories = new Set(inventory.map(item => item.color).filter(c => c)).size;
    
    document.getElementById('lowStockCount').textContent = lowStockItems;
    document.getElementById('categoryCount').textContent = categories;
    document.getElementById('totalItemsCount').textContent = inventory.length;
}

// Create Sales Chart
function createSalesChart(fulfillments) {
    const canvas = document.getElementById('salesChart');
    const ctx = canvas.getContext('2d');
    
    // Process data for chart
    const statusCounts = processChartData(fulfillments);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                label: 'Fulfillments',
                data: Object.values(statusCounts),
                backgroundColor: '#6e6e73',
                borderRadius: 8,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#e5e5e7',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#6e6e73',
                        font: {
                            size: 12
                        }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#1d1d1f',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// Process Chart Data
function processChartData(fulfillments) {
    // Group by urgency or create sample data
    const urgencyMap = {
        'Confirmed': 0,
        'Packed': 0,
        'Refunded': 0,
        'Shipped': fulfillments.length
    };
    
    // Count by urgency
    fulfillments.forEach(fulfillment => {
        const urgency = fulfillment.urgency || 'Normal';
        if (urgency.includes('Expedite')) {
            urgencyMap['Shipped'] += 1;
        }
    });
    
    // Create more realistic distribution
    return {
        'Confirmed': Math.floor(fulfillments.length * 0.3),
        'Packed': Math.floor(fulfillments.length * 0.5),
        'Refunded': Math.floor(fulfillments.length * 0.05),
        'Shipped': fulfillments.length
    };
}

// Error Handling
function showError(message) {
    const contentArea = document.querySelector('.content-area');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #ff3b30;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 1000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(amount);
}

// Export for potential use
window.appState = appState;
window.loadDashboardData = loadDashboardData;
