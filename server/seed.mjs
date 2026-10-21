import { db, dbPath, seedDatabase } from './db.mjs'
seedDatabase()
const products = db.prepare('SELECT COUNT(*) AS count FROM products').get().count
const categories = db.prepare('SELECT COUNT(*) AS count FROM categories').get().count
console.log(`Database ready at ${dbPath}`)
console.log(`${products} products · ${categories} categories`)
db.close()
