const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vivasaya_ullagam';
const EXPORT_DIR = path.join(__dirname, '..', 'mongodb-export');

const COLLECTIONS = [
  'users',
  'products',
  'orders',
  'categories',
  'settings',
  'otps',
  'counters',
  'contacts',
  'newsletters',
  'pages',
  'themes',
  'themesections',
  'videos'
];

async function exportDatabase() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    
    // Create export directory if it doesn't exist
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    console.log(`Exporting ${COLLECTIONS.length} collections to ${EXPORT_DIR}`);

    for (const collName of COLLECTIONS) {
      console.log(`Exporting collection: ${collName}`);
      const collection = db.collection(collName);
      
      try {
        const documents = await collection.find({}).toArray();
        
        // Write to JSON file
        const filePath = path.join(EXPORT_DIR, `${collName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        
        console.log(`  -> Saved ${documents.length} documents to ${collName}.json`);
      } catch (err) {
        console.log(`  -> Error exporting ${collName} or collection does not exist yet. Created empty file.`);
        const filePath = path.join(EXPORT_DIR, `${collName}.json`);
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      }
    }

    // Write README
    const readmeContent = `# Vivasaya Ulagam Database Export

This folder contains JSON exports of all MongoDB collections for the Vivasaya Ulagam project.

## How to Import using MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to your database (e.g., \`mongodb://localhost:27017\`).
3. Click **Create Database** (Name: \`vivasaya_ullagam\`, Collection Name: \`users\`).
4. Select the \`vivasaya_ullagam\` database on the left sidebar.
5. For each JSON file in this folder:
   - Hover over the database name and click the **+** button to create a collection (if it doesn't exist).
   - Click on the collection name.
   - Click **Add Data** -> **Import JSON or CSV file**.
   - Select the corresponding \`.json\` file from this folder.
   - Click **Import**.

## Exported Collections
${COLLECTIONS.map(c => `- \`${c}.json\``).join('\n')}
`;

    fs.writeFileSync(path.join(EXPORT_DIR, 'README.md'), readmeContent);
    console.log('Successfully created README.md');
    
    console.log('Export completed successfully!');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  } finally {
    await client.close();
  }
}

exportDatabase();
