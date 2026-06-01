const fs = require('fs');
const path = require('path');

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

// Create export directory if it doesn't exist
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

console.log(`Generating empty JSON templates for ${COLLECTIONS.length} collections...`);

for (const collName of COLLECTIONS) {
  const filePath = path.join(EXPORT_DIR, `${collName}.json`);
  fs.writeFileSync(filePath, JSON.stringify([], null, 2));
}

// Write README
const readmeContent = `# Vivasaya Ulagam Database Export Files

This folder contains JSON files for all MongoDB collections for the Vivasaya Ulagam project. Currently, these are empty schema files ready for you to import into your production database or modify.

## How to Import using MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to your database.
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
console.log('Successfully created templates and README.md');
