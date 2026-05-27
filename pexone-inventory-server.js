const express = require('express');
const multer = require('multer');
const csv = require('csv-parse/sync');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for inventory by dealership
const inventoryStore = {};

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ApexOne Inventory Feed API Running',
    version: '1.0.0',
    endpoints: {
      upload: 'POST /api/inventory/upload/:dealerId',
      fetch: 'GET /api/inventory/:dealerId',
      health: 'GET /health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload CSV endpoint
// Dealer Inspire pushes CSV here: POST /api/inventory/upload/grieco-fort-lauderdale
app.post('/api/inventory/upload/:dealerId', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const dealerId = req.params.dealerId;
    const fileContent = req.file.buffer.toString('utf-8');

    // Parse CSV
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true
    });

    // Store in memory
    inventoryStore[dealerId] = {
      vehicles: records,
      lastUpdated: new Date().toISOString(),
      totalVehicles: records.length
    };

    console.log(`[${dealerId}] Inventory updated: ${records.length} vehicles`);

    res.json({
      success: true,
      dealerId,
      vehiclesProcessed: records.length,
      lastUpdated: inventoryStore[dealerId].lastUpdated
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch inventory as JSON
// Showroom tool calls: GET /api/inventory/grieco-fort-lauderdale
app.get('/api/inventory/:dealerId', (req, res) => {
  try {
    const dealerId = req.params.dealerId;
    const inventory = inventoryStore[dealerId];

    if (!inventory) {
      return res.status(404).json({ 
        error: `No inventory found for ${dealerId}`,
        availableDealerships: Object.keys(inventoryStore)
      });
    }

    // Optional: filter by query params
    let vehicles = inventory.vehicles;

    // Filter by condition (new/used)
    if (req.query.condition) {
      vehicles = vehicles.filter(v => 
        v.condition?.toLowerCase() === req.query.condition.toLowerCase()
      );
    }

    // Filter by make
    if (req.query.make) {
      vehicles = vehicles.filter(v => 
        v.make?.toLowerCase().includes(req.query.make.toLowerCase())
      );
    }

    // Filter by price range
    if (req.query.minPrice) {
      vehicles = vehicles.filter(v => v.price >= parseFloat(req.query.minPrice));
    }
    if (req.query.maxPrice) {
      vehicles = vehicles.filter(v => v.price <= parseFloat(req.query.maxPrice));
    }

    res.json({
      dealerId,
      totalVehicles: inventory.totalVehicles,
      filteredVehicles: vehicles.length,
      lastUpdated: inventory.lastUpdated,
      vehicles: vehicles.slice(0, 200) // Limit response to 200 vehicles
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for automatic updates
// Dealer Inspire can POST to this with webhook data
app.post('/api/inventory/webhook/:dealerId', (req, res) => {
  try {
    const dealerId = req.params.dealerId;
    const csvData = req.body.data; // Expecting CSV string in body

    if (!csvData) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    // Parse CSV
    const records = csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: true
    });

    // Store in memory
    inventoryStore[dealerId] = {
      vehicles: records,
      lastUpdated: new Date().toISOString(),
      totalVehicles: records.length
    };

    console.log(`[${dealerId}] Webhook update: ${records.length} vehicles`);

    res.json({
      success: true,
      dealerId,
      vehiclesProcessed: records.length,
      lastUpdated: inventoryStore[dealerId].lastUpdated
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Status endpoint - shows all connected dealerships
app.get('/api/status', (req, res) => {
  const dealerships = Object.keys(inventoryStore).map(dealerId => ({
    dealerId,
    vehicleCount: inventoryStore[dealerId].vehicles.length,
    lastUpdated: inventoryStore[dealerId].lastUpdated
  }));

  res.json({
    status: 'running',
    connectedDealerships: dealerships.length,
    dealerships
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✅ ApexOne Inventory Feed API running on port ${PORT}`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`\n📤 Upload: POST /api/inventory/upload/:dealerId`);
  console.log(`📥 Fetch:  GET /api/inventory/:dealerId`);
  console.log(`✨ Status: GET /api/status\n`);
});

module.exports = app;
