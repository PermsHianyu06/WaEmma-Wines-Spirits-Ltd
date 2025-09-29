const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deliveryNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  supplier: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true
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
  deliveryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isReceived: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  receivedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'deliveries',
  timestamps: true,
  indexes: [
    { fields: ['deliveryNumber'] },
    { fields: ['deliveryDate'] },
    { fields: ['supplier'] },
    { fields: ['receivedBy'] }
  ]
});

module.exports = Delivery;