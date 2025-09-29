const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
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
  profit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      isDecimal: true
    }
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'mpesa', 'bank', 'credit'),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  customerContact: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isVoided: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  voidReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  soldBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'sales',
  timestamps: true,
  indexes: [
    { fields: ['receiptNumber'] },
    { fields: ['createdAt'] },
    { fields: ['paymentMethod'] },
    { fields: ['soldBy'] },
    { fields: ['isVoided'] }
  ]
});

module.exports = Sale;