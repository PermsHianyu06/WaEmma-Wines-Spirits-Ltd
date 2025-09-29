const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryItem = sequelize.define('DeliveryItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'deliveries',
      key: 'id'
    }
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true
    }
  },
  unitCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  totalCost: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      min: 0,
      isDecimal: true
    }
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'delivery_items',
  timestamps: true,
  indexes: [
    { fields: ['deliveryId'] },
    { fields: ['productId'] }
  ]
});

module.exports = DeliveryItem;