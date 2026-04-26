const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omkartapsale9_db_user:Omkar@1512@cluster0.fdgsilq.mongodb.net/sugarcanedb?retryWrites=true&w=majority&appName=Cluster0';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const FarmerSchema = new mongoose.Schema({ name: String, phone: String, village: String, district: String, aadhaar: String }, { timestamps: true });
const LandSchema = new mongoose.Schema({ farmerId: String, landName: String, areaAcres: Number, soilType: String, surveyNo: String }, { timestamps: true });
const CropSchema = new mongoose.Schema({ landId: String, variety: String, season: String, plantingDate: String, harvestDate: String, notes: String }, { timestamps: true });
const ProductionSchema = new mongoose.Schema({ cropId: String, yieldTons: Number, pricePerTon: Number, harvestDate: String }, { timestamps: true });

const Farmer = mongoose.model('Farmer', FarmerSchema);
const Land = mongoose.model('Land', LandSchema);
const Crop = mongoose.model('Crop', CropSchema);
const Production = mongoose.model('Production', ProductionSchema);

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// FARMERS
app.get('/api/farmers', async (req, res) => res.json(await Farmer.find()));
app.post('/api/farmers', async (req, res) => res.status(201).json(await Farmer.create(req.body)));
app.put('/api/farmers/:id', async (req, res) => res.json(await Farmer.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/farmers/:id', async (req, res) => {
  const lands = await Land.find({ farmerId: req.params.id });
  const landIds = lands.map(l => l._id.toString());
  const crops = await Crop.find({ landId: { $in: landIds } });
  const cropIds = crops.map(c => c._id.toString());
  await Production.deleteMany({ cropId: { $in: cropIds } });
  await Crop.deleteMany({ landId: { $in: landIds } });
  await Land.deleteMany({ farmerId: req.params.id });
  await Farmer.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// LANDS
app.get('/api/lands', async (req, res) => res.json(await Land.find()));
app.post('/api/lands', async (req, res) => res.status(201).json(await Land.create(req.body)));
app.put('/api/lands/:id', async (req, res) => res.json(await Land.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/lands/:id', async (req, res) => {
  const crops = await Crop.find({ landId: req.params.id });
  const cropIds = crops.map(c => c._id.toString());
  await Production.deleteMany({ cropId: { $in: cropIds } });
  await Crop.deleteMany({ landId: req.params.id });
  await Land.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// CROPS
app.get('/api/crops', async (req, res) => res.json(await Crop.find()));
app.post('/api/crops', async (req, res) => res.status(201).json(await Crop.create(req.body)));
app.put('/api/crops/:id', async (req, res) => res.json(await Crop.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/crops/:id', async (req, res) => {
  await Production.deleteMany({ cropId: req.params.id });
  await Crop.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// PRODUCTIONS
app.get('/api/productions', async (req, res) => res.json(await Production.find()));
app.post('/api/productions', async (req, res) => res.status(201).json(await Production.create(req.body)));
app.put('/api/productions/:id', async (req, res) => res.json(await Production.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/productions/:id', async (req, res) => {
  await Production.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// REPORTS
app.get('/api/reports/farmer-performance', async (req, res) => {
  const farmers = await Farmer.find();
  const report = await Promise.all(farmers.map(async farmer => {
    const lands = await Land.find({ farmerId: farmer._id.toString() });
    const landIds = lands.map(l => l._id.toString());
    const crops = await Crop.find({ landId: { $in: landIds } });
    const cropIds = crops.map(c => c._id.toString());
    const prods = await Production.find({ cropId: { $in: cropIds } });
    const totalYield = prods.reduce((s, p) => s + (p.yieldTons || 0), 0);
    return { farmerName: farmer.name, village: farmer.village, totalYield: totalYield.toFixed(2), landCount: lands.length, cropCount: crops.length };
  }));
  res.json(report.sort((a, b) => b.totalYield - a.totalYield));
});

app.get('/api/reports/land-utilization', async (req, res) => {
  const lands = await Land.find();
  const report = await Promise.all(lands.map(async land => {
    const farmer = await Farmer.findById(land.farmerId).catch(() => null);
    const crops = await Crop.find({ landId: land._id.toString() });
    const cropIds = crops.map(c => c._id.toString());
    const prods = await Production.find({ cropId: { $in: cropIds } });
    const totalYield = prods.reduce((s, p) => s + (p.yieldTons || 0), 0);
    const yieldPerAcre = land.areaAcres > 0 ? (totalYield / land.areaAcres).toFixed(2) : 0;
    return { landName: land.landName, farmerName: farmer ? farmer.name : 'N/A', areaAcres: land.areaAcres, totalYield: totalYield.toFixed(2), yieldPerAcre };
  }));
  res.json(report.sort((a, b) => b.yieldPerAcre - a.yieldPerAcre));
});

app.get('/api/reports/variety-insights', async (req, res) => {
  const crops = await Crop.find();
  const varietyMap = {};
  await Promise.all(crops.map(async crop => {
    if (!varietyMap[crop.variety]) varietyMap[crop.variety] = { totalYield: 0, count: 0 };
    const prods = await Production.find({ cropId: crop._id.toString() });
    const yld = prods.reduce((s, p) => s + (p.yieldTons || 0), 0);
    varietyMap[crop.variety].totalYield += yld;
    varietyMap[crop.variety].count += 1;
  }));
  const report = Object.entries(varietyMap).map(([variety, s]) => ({
    variety, totalYield: s.totalYield.toFixed(2), cropCount: s.count, avgYield: (s.totalYield / s.count).toFixed(2)
  }));
  res.json(report.sort((a, b) => b.totalYield - a.totalYield));
});

app.get('/api/reports/season-report', async (req, res) => {
  const prods = await Production.find();
  const yearMap = {};
  await Promise.all(prods.map(async prod => {
    const crop = await Crop.findById(prod.cropId).catch(() => null);
    const year = crop?.harvestDate ? new Date(crop.harvestDate).getFullYear() : 'Unknown';
    if (!yearMap[year]) yearMap[year] = { totalYield: 0, count: 0 };
    yearMap[year].totalYield += prod.yieldTons || 0;
    yearMap[year].count += 1;
  }));
  const report = Object.entries(yearMap).map(([year, s]) => ({
    year, totalYield: s.totalYield.toFixed(2), productionCount: s.count
  }));
  res.json(report.sort((a, b) => b.year - a.year));
});

app.listen(PORT, () => console.log(`🌾 Sugarcane DBMS running at http://localhost:${PORT}`));
