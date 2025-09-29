const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
    }
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  category: {
    type: DataTypes.ENUM('beer', 'wine', 'vodka', 'gin', 'whiskey', 'rum', 'brandy', 'champagne', 'other'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  unitType: {
    type: DataTypes.ENUM('crate', 'carton', 'bottle', 'piece', 'case'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  costPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  currentStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  minimumStock: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    validate: {
      min: 0,
      isInt: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  barcode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Special handling for Diamond Ice crates
  hasCrateTracking: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  indexes: [
    { fields: ['name'] },
    { fields: ['category'] },
    { fields: ['barcode'] },
    { fields: ['currentStock'] }
  ]
});

module.exports = Product;