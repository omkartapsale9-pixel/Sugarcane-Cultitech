const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize data file if it doesn't exist
function initData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { farmers: [], lands: [], crops: [], productions: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function readData() {
  initData();
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ─── FARMERS ───────────────────────────────────────────────
app.get('/api/farmers', (req, res) => {
  const data = readData();
  res.json(data.farmers);
});

app.post('/api/farmers', (req, res) => {
  const data = readData();
  const farmer = { id: generateId(), ...req.body, createdAt: new Date().toISOString() };
  data.farmers.push(farmer);
  writeData(data);
  res.status(201).json(farmer);
});

app.put('/api/farmers/:id', (req, res) => {
  const data = readData();
  const idx = data.farmers.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Farmer not found' });
  data.farmers[idx] = { ...data.farmers[idx], ...req.body };
  writeData(data);
  res.json(data.farmers[idx]);
});

app.delete('/api/farmers/:id', (req, res) => {
  const data = readData();
  const farmerLands = data.lands.filter(l => l.farmerId === req.params.id).map(l => l.id);
  const farmerCrops = data.crops.filter(c => farmerLands.includes(c.landId)).map(c => c.id);
  data.productions = data.productions.filter(p => !farmerCrops.includes(p.cropId));
  data.crops = data.crops.filter(c => !farmerLands.includes(c.landId));
  data.lands = data.lands.filter(l => l.farmerId !== req.params.id);
  data.farmers = data.farmers.filter(f => f.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ─── LANDS ─────────────────────────────────────────────────
app.get('/api/lands', (req, res) => {
  const data = readData();
  res.json(data.lands);
});

app.post('/api/lands', (req, res) => {
  const data = readData();
  const land = { id: generateId(), ...req.body, createdAt: new Date().toISOString() };
  data.lands.push(land);
  writeData(data);
  res.status(201).json(land);
});

app.put('/api/lands/:id', (req, res) => {
  const data = readData();
  const idx = data.lands.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Land not found' });
  data.lands[idx] = { ...data.lands[idx], ...req.body };
  writeData(data);
  res.json(data.lands[idx]);
});

app.delete('/api/lands/:id', (req, res) => {
  const data = readData();
  const landCrops = data.crops.filter(c => c.landId === req.params.id).map(c => c.id);
  data.productions = data.productions.filter(p => !landCrops.includes(p.cropId));
  data.crops = data.crops.filter(c => c.landId !== req.params.id);
  data.lands = data.lands.filter(l => l.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ─── CROPS ─────────────────────────────────────────────────
app.get('/api/crops', (req, res) => {
  const data = readData();
  res.json(data.crops);
});

app.post('/api/crops', (req, res) => {
  const data = readData();
  const crop = { id: generateId(), ...req.body, createdAt: new Date().toISOString() };
  data.crops.push(crop);
  writeData(data);
  res.status(201).json(crop);
});

app.put('/api/crops/:id', (req, res) => {
  const data = readData();
  const idx = data.crops.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Crop not found' });
  data.crops[idx] = { ...data.crops[idx], ...req.body };
  writeData(data);
  res.json(data.crops[idx]);
});

app.delete('/api/crops/:id', (req, res) => {
  const data = readData();
  data.productions = data.productions.filter(p => p.cropId !== req.params.id);
  data.crops = data.crops.filter(c => c.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ─── PRODUCTIONS ───────────────────────────────────────────
app.get('/api/productions', (req, res) => {
  const data = readData();
  res.json(data.productions);
});

app.post('/api/productions', (req, res) => {
  const data = readData();
  const production = { id: generateId(), ...req.body, createdAt: new Date().toISOString() };
  data.productions.push(production);
  writeData(data);
  res.status(201).json(production);
});

app.put('/api/productions/:id', (req, res) => {
  const data = readData();
  const idx = data.productions.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Production not found' });
  data.productions[idx] = { ...data.productions[idx], ...req.body };
  writeData(data);
  res.json(data.productions[idx]);
});

app.delete('/api/productions/:id', (req, res) => {
  const data = readData();
  data.productions = data.productions.filter(p => p.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// ─── REPORTS ───────────────────────────────────────────────
app.get('/api/reports/farmer-performance', (req, res) => {
  const data = readData();
  const report = data.farmers.map(farmer => {
    const lands = data.lands.filter(l => l.farmerId === farmer.id);
    const landIds = lands.map(l => l.id);
    const crops = data.crops.filter(c => landIds.includes(c.landId));
    const cropIds = crops.map(c => c.id);
    const prods = data.productions.filter(p => cropIds.includes(p.cropId));
    const totalYield = prods.reduce((sum, p) => sum + parseFloat(p.yieldTons || 0), 0);
    return { farmerName: farmer.name, village: farmer.village, totalYield: totalYield.toFixed(2), landCount: lands.length, cropCount: crops.length };
  }).sort((a, b) => b.totalYield - a.totalYield);
  res.json(report);
});

app.get('/api/reports/land-utilization', (req, res) => {
  const data = readData();
  const report = data.lands.map(land => {
    const farmer = data.farmers.find(f => f.id === land.farmerId);
    const crops = data.crops.filter(c => c.landId === land.id);
    const cropIds = crops.map(c => c.id);
    const prods = data.productions.filter(p => cropIds.includes(p.cropId));
    const totalYield = prods.reduce((sum, p) => sum + parseFloat(p.yieldTons || 0), 0);
    const yieldPerAcre = land.areaAcres > 0 ? (totalYield / land.areaAcres).toFixed(2) : 0;
    return { landName: land.landName, farmerName: farmer ? farmer.name : 'N/A', areaAcres: land.areaAcres, totalYield: totalYield.toFixed(2), yieldPerAcre };
  }).sort((a, b) => b.yieldPerAcre - a.yieldPerAcre);
  res.json(report);
});

app.get('/api/reports/variety-insights', (req, res) => {
  const data = readData();
  const varietyMap = {};
  data.crops.forEach(crop => {
    if (!varietyMap[crop.variety]) varietyMap[crop.variety] = { totalYield: 0, count: 0 };
    const prods = data.productions.filter(p => p.cropId === crop.id);
    const yld = prods.reduce((sum, p) => sum + parseFloat(p.yieldTons || 0), 0);
    varietyMap[crop.variety].totalYield += yld;
    varietyMap[crop.variety].count += 1;
  });
  const report = Object.entries(varietyMap).map(([variety, stats]) => ({
    variety,
    totalYield: stats.totalYield.toFixed(2),
    cropCount: stats.count,
    avgYield: (stats.totalYield / stats.count).toFixed(2)
  })).sort((a, b) => b.totalYield - a.totalYield);
  res.json(report);
});

app.get('/api/reports/season-report', (req, res) => {
  const data = readData();
  const yearMap = {};
  data.productions.forEach(prod => {
    const crop = data.crops.find(c => c.id === prod.cropId);
    const year = crop && crop.harvestDate ? new Date(crop.harvestDate).getFullYear() : 'Unknown';
    if (!yearMap[year]) yearMap[year] = { totalYield: 0, count: 0 };
    yearMap[year].totalYield += parseFloat(prod.yieldTons || 0);
    yearMap[year].count += 1;
  });
  const report = Object.entries(yearMap).map(([year, stats]) => ({
    year,
    totalYield: stats.totalYield.toFixed(2),
    productionCount: stats.count
  })).sort((a, b) => b.year - a.year);
  res.json(report);
});

app.listen(PORT, () => {
  console.log(`🌾 Sugarcane DBMS running at http://localhost:${PORT}`);
});
