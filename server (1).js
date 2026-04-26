const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://buknnzpjcoylqcwmpepm.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1a25uenBqY295bHFjd21wZXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxODk1MDIsImV4cCI6MjA5Mjc2NTUwMn0.97abQRXQ-hgnmH9r7lTTevKQoMuGuICJ-JQbjYaSJvY';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── SUPABASE HELPER ──────────────────────────────────
async function sb(method, table, body = null, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── FARMERS ──────────────────────────────────────────
app.get('/api/farmers', async (req, res) => {
  try { res.json(await sb('GET', 'farmers', null, '?order=created_at.desc')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/farmers', async (req, res) => {
  try {
    const { name, phone, village, district, aadhaar } = req.body;
    const result = await sb('POST', 'farmers', { name, phone, village, district, aadhaar });
    res.status(201).json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/farmers/:id', async (req, res) => {
  try {
    const { name, phone, village, district, aadhaar } = req.body;
    const result = await sb('PATCH', 'farmers', { name, phone, village, district, aadhaar }, `?id=eq.${req.params.id}`);
    res.json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/farmers/:id', async (req, res) => {
  try {
    await sb('DELETE', 'farmers', null, `?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── LANDS ────────────────────────────────────────────
app.get('/api/lands', async (req, res) => {
  try { res.json(await sb('GET', 'lands', null, '?order=created_at.desc')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/lands', async (req, res) => {
  try {
    const { farmerId, landName, areaAcres, soilType, surveyNo } = req.body;
    const result = await sb('POST', 'lands', { farmer_id: farmerId, land_name: landName, area_acres: areaAcres, soil_type: soilType, survey_no: surveyNo });
    res.status(201).json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/lands/:id', async (req, res) => {
  try {
    const { farmerId, landName, areaAcres, soilType, surveyNo } = req.body;
    const result = await sb('PATCH', 'lands', { farmer_id: farmerId, land_name: landName, area_acres: areaAcres, soil_type: soilType, survey_no: surveyNo }, `?id=eq.${req.params.id}`);
    res.json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/lands/:id', async (req, res) => {
  try {
    await sb('DELETE', 'lands', null, `?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── CROPS ────────────────────────────────────────────
app.get('/api/crops', async (req, res) => {
  try { res.json(await sb('GET', 'crops', null, '?order=created_at.desc')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/crops', async (req, res) => {
  try {
    const { landId, variety, season, plantingDate, harvestDate, notes } = req.body;
    const result = await sb('POST', 'crops', { land_id: landId, variety, season, planting_date: plantingDate || null, harvest_date: harvestDate || null, notes });
    res.status(201).json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/crops/:id', async (req, res) => {
  try {
    const { landId, variety, season, plantingDate, harvestDate, notes } = req.body;
    const result = await sb('PATCH', 'crops', { land_id: landId, variety, season, planting_date: plantingDate || null, harvest_date: harvestDate || null, notes }, `?id=eq.${req.params.id}`);
    res.json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/crops/:id', async (req, res) => {
  try {
    await sb('DELETE', 'crops', null, `?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── PRODUCTIONS ──────────────────────────────────────
app.get('/api/productions', async (req, res) => {
  try { res.json(await sb('GET', 'productions', null, '?order=created_at.desc')); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/productions', async (req, res) => {
  try {
    const { cropId, yieldTons, pricePerTon, harvestDate } = req.body;
    const result = await sb('POST', 'productions', { crop_id: cropId, yield_tons: yieldTons, price_per_ton: pricePerTon, harvest_date: harvestDate || null });
    res.status(201).json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/productions/:id', async (req, res) => {
  try {
    const { cropId, yieldTons, pricePerTon, harvestDate } = req.body;
    const result = await sb('PATCH', 'productions', { crop_id: cropId, yield_tons: yieldTons, price_per_ton: pricePerTon, harvest_date: harvestDate || null }, `?id=eq.${req.params.id}`);
    res.json(result[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/productions/:id', async (req, res) => {
  try {
    await sb('DELETE', 'productions', null, `?id=eq.${req.params.id}`);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── REPORTS ──────────────────────────────────────────
app.get('/api/reports/farmer-performance', async (req, res) => {
  try {
    const farmers = await sb('GET', 'farmers');
    const lands = await sb('GET', 'lands');
    const crops = await sb('GET', 'crops');
    const productions = await sb('GET', 'productions');
    const report = farmers.map(farmer => {
      const fLands = lands.filter(l => l.farmer_id == farmer.id);
      const fCrops = crops.filter(c => fLands.some(l => l.id == c.land_id));
      const fProds = productions.filter(p => fCrops.some(c => c.id == p.crop_id));
      const totalYield = fProds.reduce((s, p) => s + parseFloat(p.yield_tons || 0), 0);
      return { farmerName: farmer.name, village: farmer.village, totalYield: totalYield.toFixed(2), landCount: fLands.length, cropCount: fCrops.length };
    }).sort((a, b) => b.totalYield - a.totalYield);
    res.json(report);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/land-utilization', async (req, res) => {
  try {
    const farmers = await sb('GET', 'farmers');
    const lands = await sb('GET', 'lands');
    const crops = await sb('GET', 'crops');
    const productions = await sb('GET', 'productions');
    const report = lands.map(land => {
      const farmer = farmers.find(f => f.id == land.farmer_id);
      const lCrops = crops.filter(c => c.land_id == land.id);
      const lProds = productions.filter(p => lCrops.some(c => c.id == p.crop_id));
      const totalYield = lProds.reduce((s, p) => s + parseFloat(p.yield_tons || 0), 0);
      const yieldPerAcre = land.area_acres > 0 ? (totalYield / land.area_acres).toFixed(2) : 0;
      return { landName: land.land_name, farmerName: farmer ? farmer.name : 'N/A', areaAcres: land.area_acres, totalYield: totalYield.toFixed(2), yieldPerAcre };
    }).sort((a, b) => b.yieldPerAcre - a.yieldPerAcre);
    res.json(report);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/variety-insights', async (req, res) => {
  try {
    const crops = await sb('GET', 'crops');
    const productions = await sb('GET', 'productions');
    const varietyMap = {};
    crops.forEach(crop => {
      if (!varietyMap[crop.variety]) varietyMap[crop.variety] = { totalYield: 0, count: 0 };
      const prods = productions.filter(p => p.crop_id == crop.id);
      const yld = prods.reduce((s, p) => s + parseFloat(p.yield_tons || 0), 0);
      varietyMap[crop.variety].totalYield += yld;
      varietyMap[crop.variety].count += 1;
    });
    const report = Object.entries(varietyMap).map(([variety, s]) => ({
      variety, totalYield: s.totalYield.toFixed(2), cropCount: s.count, avgYield: (s.totalYield / s.count).toFixed(2)
    })).sort((a, b) => b.totalYield - a.totalYield);
    res.json(report);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reports/season-report', async (req, res) => {
  try {
    const crops = await sb('GET', 'crops');
    const productions = await sb('GET', 'productions');
    const yearMap = {};
    productions.forEach(prod => {
      const crop = crops.find(c => c.id == prod.crop_id);
      const year = crop?.harvest_date ? new Date(crop.harvest_date).getFullYear() : 'Unknown';
      if (!yearMap[year]) yearMap[year] = { totalYield: 0, count: 0 };
      yearMap[year].totalYield += parseFloat(prod.yield_tons || 0);
      yearMap[year].count += 1;
    });
    const report = Object.entries(yearMap).map(([year, s]) => ({
      year, totalYield: s.totalYield.toFixed(2), productionCount: s.count
    })).sort((a, b) => b.year - a.year);
    res.json(report);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🌾 Sugarcane DBMS running at http://localhost:${PORT}`));
