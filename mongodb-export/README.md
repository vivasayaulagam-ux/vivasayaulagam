# Vivasaya Ulagam Database Export Files

This folder contains JSON files for all MongoDB collections for the Vivasaya Ulagam project. Currently, these are empty schema files ready for you to import into your production database or modify.

## How to Import using MongoDB Compass

1. Open **MongoDB Compass**.
2. Connect to your database.
3. Click **Create Database** (Name: `vivasaya_ullagam`, Collection Name: `users`).
4. Select the `vivasaya_ullagam` database on the left sidebar.
5. For each JSON file in this folder:
   - Hover over the database name and click the **+** button to create a collection (if it doesn't exist).
   - Click on the collection name.
   - Click **Add Data** -> **Import JSON or CSV file**.
   - Select the corresponding `.json` file from this folder.
   - Click **Import**.

## Exported Collections
- `users.json`
- `products.json`
- `orders.json`
- `categories.json`
- `settings.json`
- `otps.json`
- `counters.json`
- `contacts.json`
- `newsletters.json`
- `pages.json`
- `themes.json`
- `themesections.json`
- `videos.json`
