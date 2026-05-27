# ApexOne Inventory Feed API
## Multi-Dealership Inventory Management System

**Status:** Ready to Deploy  
**Built for:** Grieco Chevrolet Fort Lauderdale (Pilot)  
**Scalable to:** Unlimited dealerships  

---

## 🚀 DEPLOYMENT (One-Click)

### Option 1: Render.com (Recommended - Easiest)

1. Go to: https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub (create one if needed)
4. Paste this repo URL: `[YOUR GITHUB REPO URL]`
5. Set Name: `apexone-inventory-feed`
6. Environment: `Node`
7. Build Command: `npm install`
8. Start Command: `npm start`
9. Click "Deploy"

**Done.** Your API is live at: `https://apexone-inventory-feed.onrender.com`

### Option 2: Railway (Alternative)

Same files, paste into Railway editor, click Deploy.

---

## 📡 HOW IT WORKS

### Step 1: Dealer Inspire Pushes CSV
Dealer Inspire exports your inventory twice daily as CSV → Pushes to:
```
POST https://api.apexone.ai/inventory/upload/grieco-fort-lauderdale
(with CSV file attached)
```

### Step 2: ApexOne Server Receives & Parses
- Receives CSV
- Parses into JSON
- Stores in memory
- Logs update

### Step 3: Showroom Tool Fetches JSON
Your iPad tool calls:
```
GET https://api.apexone.ai/inventory/grieco-fort-lauderdale
```

Returns:
```json
{
  "dealerId": "grieco-fort-lauderdale",
  "totalVehicles": 82,
  "lastUpdated": "2026-05-27T14:30:00Z",
  "vehicles": [
    {
      "vin": "1GCUYSEG2F...",
      "make": "Chevrolet",
      "model": "Silverado",
      "year": 2024,
      "price": 42995,
      "condition": "new",
      "color": "Black",
      "mileage": 0
    },
    ...
  ]
}
```

---

## 🔧 API ENDPOINTS

### Upload Inventory (CSV)
```
POST /api/inventory/upload/:dealerId
Content-Type: multipart/form-data

Parameters:
- dealerId: grieco-fort-lauderdale
- file: inventory.csv
```

**Response:**
```json
{
  "success": true,
  "dealerId": "grieco-fort-lauderdale",
  "vehiclesProcessed": 82,
  "lastUpdated": "2026-05-27T14:30:00Z"
}
```

---

### Fetch Inventory (JSON)
```
GET /api/inventory/:dealerId

Optional Filters:
?condition=new
?make=Chevrolet
?minPrice=30000
?maxPrice=50000
```

**Response:**
```json
{
  "dealerId": "grieco-fort-lauderdale",
  "totalVehicles": 82,
  "filteredVehicles": 12,
  "lastUpdated": "2026-05-27T14:30:00Z",
  "vehicles": [...]
}
```

---

### Check System Status
```
GET /api/status
```

**Response:**
```json
{
  "status": "running",
  "connectedDealerships": 2,
  "dealerships": [
    {
      "dealerId": "grieco-fort-lauderdale",
      "vehicleCount": 82,
      "lastUpdated": "2026-05-27T14:30:00Z"
    },
    {
      "dealerId": "dealer-two",
      "vehicleCount": 156,
      "lastUpdated": "2026-05-27T12:00:00Z"
    }
  ]
}
```

---

## 📋 ONBOARDING: WHAT TO TELL DEALER INSPIRE

**Email to Jo Papp at Dealer Inspire Support:**

---

> Hi Jo,
>
> We're ready for the FTP export. Here's the setup:
>
> **Dealer:** Grieco Chevrolet Fort Lauderdale  
> **Export Destination:** ApexOne API Endpoint  
> **URL:** `https://api.apexone.ai/inventory/upload/grieco-fort-lauderdale`  
> **Method:** HTTP POST  
> **File Format:** CSV  
> **Frequency:** Twice daily (8 AM & 2 PM ET preferred)  
> **File Name:** `grieco_inventory.csv`  
> **Content:** All new and used inventory combined  
>
> Please configure the export to POST the CSV file to the URL above. No authentication required for this pilot.
>
> Once configured, we'll validate with a test export and have our showroom tool live within 24 hours.
>
> Thanks,  
> Matt Harbinson

---

## 🎯 FOR YOUR SHOWROOM TOOL

In your iPad app, replace the hardcoded inventory with this API call:

```javascript
// Fetch inventory from ApexOne
const fetchInventory = async (dealerId) => {
  try {
    const response = await fetch(`https://api.apexone.ai/inventory/${dealerId}`);
    const data = await response.json();
    return data.vehicles;
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
};

// Usage
const inventory = await fetchInventory('grieco-fort-lauderdale');
```

---

## 🔄 SCALING TO NEW DEALERS

For dealer #2, #3, etc., the process is identical:

1. **Dealer name:** `dealer-name-city`  
2. **Endpoint:** `https://api.apexone.ai/inventory/upload/dealer-name-city`  
3. **Email Dealer Inspire:** Same template, swap dealer ID  
4. **Done.** Multiple dealers = same infrastructure

---

## 📊 CSV FORMAT REQUIREMENTS

Your CSV must have these columns (case-insensitive):

```
vin, make, model, year, price, condition, color, mileage, trim, transmission, engine, mpg, exterior_color, interior_color, photo_url
```

**Example:**
```
vin,make,model,year,price,condition,color,mileage
1GCUYSEG2F...,Chevrolet,Silverado 1500,2024,42995,new,Black,0
WBADT44462...,BMW,3 Series,2023,28500,used,White,15000
```

The API only requires: `vin, make, model, year, price, condition`  
All other fields are optional.

---

## 🔐 PRODUCTION NOTES

- API is public (no auth required for MVP)
- Inventory stored in memory (resets on server restart)
- For persistence, upgrade to database (PostgreSQL, MongoDB)
- CORS enabled for all origins
- File size limit: 50MB per upload
- Response limited to 200 vehicles per request

---

## 🆘 TROUBLESHOOTING

### "No inventory found for [dealerId]"
→ Dealer Inspire hasn't uploaded yet. Check the upload endpoint logs.

### API returns 404
→ URL might be wrong. Verify dealerId matches exactly: `grieco-fort-lauderdale` (lowercase, hyphens)

### iPad tool can't reach API
→ Check CORS. If hosted on different domain, CORS is already enabled.

### CSV not parsing
→ Make sure CSV has header row with column names. Extra spaces in headers break parsing.

---

## 📞 SUPPORT

For issues:
1. Check `/api/status` to see connected dealerships
2. Verify CSV format matches example above
3. Confirm dealerId is lowercase with hyphens (no spaces)
4. Check Dealer Inspire upload logs

---

## 🎯 NEXT STEPS (FOR MATT)

1. ✅ Deploy to Render
2. ✅ Get Render URL (e.g., `https://apexone-inventory-feed.onrender.com`)
3. ✅ Send email to Jo Papp with endpoint details
4. ✅ Wait for first CSV push
5. ✅ Call `/api/inventory/grieco-fort-lauderdale` from iPad tool
6. ✅ Test with real inventory
7. ✅ Update showroom tool to call live API
8. 🚀 Launch pilot

---

**Built for ApexOne AI**  
**Matt Harbinson, GM - Grieco Chevrolet Fort Lauderdale**  
**May 2026**
