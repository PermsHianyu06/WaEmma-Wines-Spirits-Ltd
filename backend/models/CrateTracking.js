const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CrateTracking = sequelize.define('CrateTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  transactionType: {
    type: DataTypes.ENUM('delivery', 'sale', 'return', 'adjustment'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Can reference sale_id or delivery_id
    comment: 'References sale_id or delivery_id depending on transaction_type'
  },
  cratesReceived: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  cratesReturned: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  cratesBalance: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true
    },
    comment: 'Running balance of crates owed to supplier'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'crate_tracking',
  timestamps: true,
  indexes: [
    { fields: ['productId'] },
    { fields: ['transactionType'] },
    { fields: ['transactionId'] },
    { fields: ['processedBy'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = CrateTracking;