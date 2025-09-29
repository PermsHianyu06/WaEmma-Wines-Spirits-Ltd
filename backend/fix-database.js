const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create a direct connection to PostgreSQL to fix database issues
const fixDatabase = async () => {
  try {
    // Connect to PostgreSQL
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: console.log
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Drop the products table if it exists to recreate it with correct columns
    await sequelize.query('DROP TABLE IF EXISTS "products" CASCADE');
    console.log('✓ Dropped products table');

    // Create the products table with all required columns
    await sequelize.query(`
      CREATE TABLE "products" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(100) NOT NULL,
        "imageUrl" VARCHAR(500),
        "category" VARCHAR(50) NOT NULL,
        "unitType" VARCHAR(50) NOT NULL,
        "costPrice" DECIMAL(10, 2) NOT NULL,
        "sellingPrice" DECIMAL(10, 2) NOT NULL,
        "currentStock" INTEGER DEFAULT 0,
        "minimumStock" INTEGER DEFAULT 10,
        "description" TEXT,
        "barcode" VARCHAR(50),
        "isActive" BOOLEAN DEFAULT TRUE,
        "hasCrateTracking" BOOLEAN DEFAULT FALSE,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ Created products table with correct columns');

    // Insert sample data
    await sequelize.query(`
      INSERT INTO "products" 
        ("name", "category", "unitType", "costPrice", "sellingPrice", "currentStock", "minimumStock", "description", "isActive", "hasCrateTracking", "imageUrl")
      VALUES
        ('Diamond Ice Beer', 'beer', 'crate', 1200, 1500, 50, 10, 'Popular local beer', true, true, 'https://images.unsplash.com/photo-1608270586620-248524c67de9'),
        ('Cabernet Sauvignon', 'wine', 'bottle', 800, 1200, 30, 5, 'Premium red wine', true, false, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3'),
        ('Whiskey Premium', 'whiskey', 'bottle', 2500, 3500, 15, 3, 'Premium whiskey', true, false, 'https://images.unsplash.com/photo-1527281400683-1aae777175f8')
    `);
    console.log('✓ Inserted sample product data');

    console.log('✓ Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing database:', error);
    process.exit(1);
  }
};

fixDatabase();