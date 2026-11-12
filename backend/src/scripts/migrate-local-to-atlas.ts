import mongoose from 'mongoose';
const { MongoClient } = mongoose.mongo;
import fs from 'fs';
import path from 'path';

const LOCAL_URI = 'mongodb://127.0.0.1:27017/aarogya_drishti';
const ATLAS_URI = 'mongodb+srv://tejeshindian97_db_user:v2ZZ54flJj2fhhbG@cluster0.bd3uufn.mongodb.net/aarogya_drishti?retryWrites=true&w=majority';
const RESILIENT_STORE_PATH = path.resolve(process.cwd(), 'backend', 'src', 'data', 'resilient_store.json');

async function migrate() {
  console.log('========================================================================');
  console.log('🚀 AAROGYA DRISHTI: LOCAL DATABASE -> MONGODB ATLAS FULL MIGRATION');
  console.log('========================================================================');

  console.log('\n[1/5] Connecting to Local MongoDB & Atlas Cluster...');
  const localClient = new MongoClient(LOCAL_URI);
  const atlasClient = new MongoClient(ATLAS_URI);

  try {
    await localClient.connect();
    console.log('  ✅ Connected to Local MongoDB (127.0.0.1:27017)');
  } catch (err: any) {
    console.warn('  ⚠️ Could not connect to Local MongoDB:', err.message);
  }

  await atlasClient.connect();
  console.log('  ✅ Connected to MongoDB Atlas (cluster0.bd3uufn.mongodb.net)');

  const localDb = localClient.db('aarogya_drishti');
  const atlasDb = atlasClient.db('aarogya_drishti');

  // Load resilient store json
  let resilientData: any = {};
  if (fs.existsSync(RESILIENT_STORE_PATH)) {
    try {
      resilientData = JSON.parse(fs.readFileSync(RESILIENT_STORE_PATH, 'utf-8'));
      console.log('  ✅ Loaded offline resilient_store.json snapshot');
    } catch (e: any) {
      console.warn('  ⚠️ Could not read resilient_store.json:', e.message);
    }
  }

  // Get list of all collections from local Mongo
  let localCollectionNames: string[] = [];
  try {
    const cols = await localDb.listCollections().toArray();
    localCollectionNames = cols.map(c => c.name);
    console.log(`\n[2/5] Found ${localCollectionNames.length} collections in Local MongoDB:`);
    console.log('  ' + localCollectionNames.join(', '));
  } catch (err: any) {
    console.warn('  ⚠️ Could not list collections from local MongoDB:', err.message);
  }

  // Map known collections and their resilient data counterparts
  const allCollectionNames = Array.from(new Set([
    ...localCollectionNames,
    'users',
    'patients',
    'doctors',
    'hospitals',
    'screenings',
    'appointments',
    'prescriptions',
    'auditlogs',
    'referrals',
    'clinicalreviews',
    'diagnosticorders',
    'grievances',
    'consents',
    'followups'
  ]));

  const summary: Record<string, { local: number; resilient: number; atlasFinal: number }> = {};

  console.log('\n[3/5] Migrating collections to Atlas...');

  for (const colName of allCollectionNames) {
    // 1. Fetch from Local MongoDB
    let docsFromLocal: any[] = [];
    try {
      docsFromLocal = await localDb.collection(colName).find({}).toArray();
    } catch {
      docsFromLocal = [];
    }

    // 2. Fetch from resilient store if present
    const resilientKey = colName === 'auditlogs' ? 'auditLogs' : colName;
    const docsFromResilient: any[] = Array.isArray(resilientData[resilientKey]) ? resilientData[resilientKey] : [];

    // 3. Merge documents cleanly without duplicates
    const mergedMap = new Map<string, any>();

    // Helper to get unique key for document by business identifier
    const getDocKey = (d: any, index: number) => {
      if (d.uidn) return `uidn_${String(d.uidn).trim().toLowerCase()}`;
      if (d.doctorId) return `doc_${String(d.doctorId).trim().toLowerCase()}`;
      if (d.hospitalId) return `hosp_${String(d.hospitalId).trim().toLowerCase()}`;
      if (d.screeningId) return `scr_${String(d.screeningId).trim().toLowerCase()}`;
      if (d.appointmentId) return `apt_${String(d.appointmentId).trim().toLowerCase()}`;
      if (d.prescriptionId) return `rx_${String(d.prescriptionId).trim().toLowerCase()}`;
      if (d.rxId) return `rx_${String(d.rxId).trim().toLowerCase()}`;
      if (d.phone && colName === 'users') return `user_phone_${String(d.phone).trim()}`;
      if (d.email && colName === 'users') return `user_email_${String(d.email).trim().toLowerCase()}`;
      if (d._id) return `id_${String(d._id)}`;
      return `idx_${index}`;
    };

    // Insert resilient first
    docsFromResilient.forEach((d, i) => {
      mergedMap.set(getDocKey(d, i), { ...d });
    });

    // Overwrite / merge with local mongo docs (more recent / authoritative)
    docsFromLocal.forEach((d, i) => {
      mergedMap.set(getDocKey(d, i), { ...d });
    });

    const docsToInsert = Array.from(mergedMap.values());

    if (docsToInsert.length > 0) {
      const atlasCol = atlasDb.collection(colName);
      // Clean target collection first for idempotent full import
      await atlasCol.deleteMany({});
      
      // Bulk insert
      const res = await atlasCol.insertMany(docsToInsert, { ordered: false });
      summary[colName] = {
        local: docsFromLocal.length,
        resilient: docsFromResilient.length,
        atlasFinal: res.insertedCount
      };
      console.log(`  ✅ [${colName}]: Migrated ${res.insertedCount} documents (Local: ${docsFromLocal.length}, Snapshot: ${docsFromResilient.length})`);
    } else {
      summary[colName] = {
        local: docsFromLocal.length,
        resilient: docsFromResilient.length,
        atlasFinal: 0
      };
    }
  }

  console.log('\n[4/5] Establishing Atlas Performance & Identity Indexes...');
  try {
    await atlasDb.collection('patients').createIndex({ uidn: 1 }, { unique: true, sparse: true });
    await atlasDb.collection('patients').createIndex({ phone: 1 });
    await atlasDb.collection('patients').createIndex({ aadhar: 1 });
    console.log('  ✅ Created indexes on patients (uidn, phone, aadhar)');
  } catch (e: any) {
    console.log('  ℹ️ Patients indexes notice:', e.message);
  }

  try {
    await atlasDb.collection('users').createIndex({ phone: 1 }, { sparse: true });
    await atlasDb.collection('users').createIndex({ email: 1 }, { sparse: true });
    console.log('  ✅ Created indexes on users (phone, email)');
  } catch (e: any) {
    console.log('  ℹ️ Users indexes notice:', e.message);
  }

  try {
    await atlasDb.collection('screenings').createIndex({ screeningId: 1 }, { unique: true, sparse: true });
    await atlasDb.collection('screenings').createIndex({ patientUidn: 1 });
    console.log('  ✅ Created indexes on screenings (screeningId, patientUidn)');
  } catch (e: any) {
    console.log('  ℹ️ Screenings indexes notice:', e.message);
  }

  try {
    await atlasDb.collection('doctors').createIndex({ doctorId: 1 }, { unique: true, sparse: true });
    await atlasDb.collection('doctors').createIndex({ email: 1 }, { sparse: true });
    console.log('  ✅ Created indexes on doctors (doctorId, email)');
  } catch (e: any) {
    console.log('  ℹ️ Doctors indexes notice:', e.message);
  }

  try {
    await atlasDb.collection('hospitals').createIndex({ hospitalId: 1 }, { unique: true, sparse: true });
    console.log('  ✅ Created indexes on hospitals (hospitalId)');
  } catch (e: any) {
    console.log('  ℹ️ Hospitals indexes notice:', e.message);
  }

  console.log('\n[5/5] Migration Verification on MongoDB Atlas:');
  const atlasCollections = await atlasDb.listCollections().toArray();
  for (const c of atlasCollections) {
    const count = await atlasDb.collection(c.name).countDocuments();
    console.log(`  📊 Atlas Collection [${c.name}]: ${count} verified records`);
  }

  console.log('\n========================================================================');
  console.log('🎉 FULL MIGRATION COMPLETED SUCCESSFULLY TO MONGODB ATLAS!');
  console.log('========================================================================');

  await localClient.close();
  await atlasClient.close();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
