const { sequelize } = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');
const SaleItem = require('./SaleItem');
const Delivery = require('./Delivery');
const DeliveryItem = require('./DeliveryItem');
const CrateTracking = require('./CrateTracking');

// Define associations

// User associations
User.hasMany(Sale, { foreignKey: 'soldBy', as: 'sales' });
User.hasMany(Delivery, { foreignKey: 'receivedBy', as: 'deliveries' });
User.hasMany(CrateTracking, { foreignKey: 'processedBy', as: 'crateTransactions' });

// Product associations
Product.hasMany(SaleItem, { foreignKey: 'productId', as: 'saleItems' });
Product.hasMany(DeliveryItem, { foreignKey: 'productId', as: 'deliveryItems' });
Product.hasMany(CrateTracking, { foreignKey: 'productId', as: 'crateTransactions' });

// Sale associations
Sale.belongsTo(User, { foreignKey: 'soldBy', as: 'seller' });
Sale.hasMany(SaleItem, { foreignKey: 'saleId', as: 'items' });

// SaleItem associations
SaleItem.belongsTo(Sale, { foreignKey: 'saleId', as: 'sale' });
SaleItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Delivery associations
Delivery.belongsTo(User, { foreignKey: 'receivedBy', as: 'receiver' });
Delivery.hasMany(DeliveryItem, { foreignKey: 'deliveryId', as: 'items' });

// DeliveryItem associations
DeliveryItem.belongsTo(Delivery, { foreignKey: 'deliveryId', as: 'delivery' });
DeliveryItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// CrateTracking associations
CrateTracking.belongsTo(User, { foreignKey: 'processedBy', as: 'processor' });
CrateTracking.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Initialize database
const initializeDatabase = async () => {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✓ Database connection established successfully');

    // Sync all models
    await sequelize.sync({ force: false }); // Set to true only for development reset
    console.log('✓ Database models synchronized');

    // Create default admin user if not exists
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'admin123', // Will be hashed by the model hook
        fullName: 'System Administrator',
        role: 'admin'
      });
      console.log('✓ Default admin user created (username: admin, password: admin123)');
    }

    // Create Diamond Ice product with crate tracking if not exists
    const diamondIce = await Product.findOne({ where: { name: 'Diamond Ice Beer' } });
    if (!diamondIce) {
      await Product.create({
        name: 'Diamond Ice Beer',
        category: 'beer',
        unitType: 'crate',
        costPrice: 600.00,
        sellingPrice: 750.00,
        currentStock: 0,
        minimumStock: 5,
        description: 'Diamond Ice Beer - 24 bottles per crate',
        hasCrateTracking: true
      });
      console.log('✓ Diamond Ice product created with crate tracking enabled');
    }

  } catch (error) {
    console.error('✗ Database initialization failed:', error);
    throw error;
  }
};

module.exports = {
  sequelize,
  User,
  Product,
  Sale,
  SaleItem,
  Delivery,
  DeliveryItem,
  CrateTracking,
  initializeDatabase
};