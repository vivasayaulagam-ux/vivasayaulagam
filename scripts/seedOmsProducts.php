<?php
declare(strict_types=1);

require_once 'c:/xampp/htdocs/OMS/functions.php';

$products = [
    ['id' => 1, 'sku' => 'PROD-A', 'name' => 'Product A', 'price' => 100, 'weight_grams' => 250],
    ['id' => 2, 'sku' => 'PRICKLY-PE', 'name' => 'Prickly Pear Half Kg / Kalli Palam', 'price' => 269, 'weight_grams' => 500],
    ['id' => 3, 'sku' => 'RAVA-LADDU', 'name' => 'Rava Laddu 500 Gm', 'price' => 200, 'weight_grams' => 500],
    ['id' => 4, 'sku' => 'SATHU-MAAV', 'name' => 'SATHU MAAVU 500 GM', 'price' => 400, 'weight_grams' => 500],
    ['id' => 5, 'sku' => 'SMBAR-POWD', 'name' => 'SAMBAR POWDER 200 GM', 'price' => 180, 'weight_grams' => 200],
    ['id' => 6, 'sku' => 'SUNDAKAI-1', 'name' => 'SUNDAKAI (100 g)', 'price' => 1, 'weight_grams' => 100],
    ['id' => 7, 'sku' => 'AVAARAM-PO', 'name' => 'AVAARAM POO SORU PODI 200 GM', 'price' => 180, 'weight_grams' => 200],
];

$pdo = db();
$pdo->beginTransaction();

try {
    foreach ($products as $p) {
        $stmt = $pdo->prepare('SELECT id FROM products WHERE id = ?');
        $stmt->execute([$p['id']]);
        if ($stmt->fetch()) {
            $update = $pdo->prepare('UPDATE products SET sku = ?, name = ?, price = ?, weight_grams = ? WHERE id = ?');
            $update->execute([$p['sku'], $p['name'], $p['price'], $p['weight_grams'], $p['id']]);
        } else {
            $insert = $pdo->prepare('INSERT INTO products (id, sku, name, price, weight_grams, status) VALUES (?, ?, ?, ?, ?, "active")');
            $insert->execute([$p['id'], $p['sku'], $p['name'], $p['price'], $p['weight_grams']]);
        }
    }
    $pdo->commit();
    echo "OMS Products successfully seeded!\n";
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo "Seed failed: " . $e->getMessage() . "\n";
    exit(1);
}
