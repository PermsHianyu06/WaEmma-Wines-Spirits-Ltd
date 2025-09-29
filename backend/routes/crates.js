const express = require('express');
const { CrateTracking, Product, User, sequelize } = require('../models');
const { requireAuth } = require('./auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get crate tracking history for a specific product
router.get('/product/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: crateHistory } = await CrateTracking.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'hasCrateTracking']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Get current balance (latest record)
    const latestRecord = crateHistory.length > 0 ? crateHistory[0] : null;
    const currentBalance = latestRecord ? latestRecord.cratesBalance : 0;
    
    res.json({
      crateHistory,
      currentBalance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get crate history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current crate balances for all products with crate tracking
router.get('/balances', requireAuth, async (req, res) => {
  try {
    const productsWithCrates = await Product.findAll({
      where: { 
        hasCrateTracking: true,
        isActive: true
      }
    });
    
    const balances = [];
    
    for (const product of productsWithCrates) {
      const latestRecord = await CrateTracking.findOne({
        where: { productId: product.id },
        order: [['createdAt', 'DESC']]
      });
      
      balances.push({
        productId: product.id,
        productName: product.name,
        currentBalance: latestRecord ? latestRecord.cratesBalance : 0,
        lastUpdated: latestRecord ? latestRecord.createdAt : null
      });
    }
    
    res.json(balances);
  } catch (error) {
    console.error('Get crate balances error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Record crate return (empty crates returned to supplier)
router.post('/return', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      productId,
      cratesReturned,
      notes
    } = req.body;

    if (!productId || !cratesReturned || cratesReturned <= 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Product ID and crates returned (greater than 0) are required' 
      });
    }

    // Verify product has crate tracking enabled
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.hasCrateTracking) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'This product does not have crate tracking enabled' 
      });
    }

    // Get current balance
    const lastCrateRecord = await CrateTracking.findOne({
      where: { productId },
      order: [['createdAt', 'DESC']],
      transaction
    });

    const currentBalance = lastCrateRecord ? lastCrateRecord.cratesBalance : 0;
    const newBalance = Math.max(0, currentBalance - parseInt(cratesReturned));

    // Create new crate tracking record
    const crateRecord = await CrateTracking.create({
      productId,
      transactionType: 'return',
      transactionId: null,
      cratesReceived: 0,
      cratesReturned: parseInt(cratesReturned),
      cratesBalance: newBalance,
      notes: notes?.trim() || `Returned ${cratesReturned} empty crates`,
      processedBy: req.session.userId
    }, { transaction });

    await transaction.commit();

    // Fetch the created record with associations
    const createdRecord = await CrateTracking.findByPk(crateRecord.id, {
      include: [
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: 'Crate return recorded successfully',
      crateRecord: createdRecord,
      newBalance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Record crate return error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manual crate balance adjustment
router.post('/adjust', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      productId,
      adjustment,
      notes
    } = req.body;

    if (!productId || adjustment === undefined || adjustment === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Product ID and adjustment value (non-zero) are required' 
      });
    }

    if (!notes || notes.trim().length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Notes are required for manual adjustments' 
      });
    }

    // Verify product has crate tracking enabled
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.hasCrateTracking) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'This product does not have crate tracking enabled' 
      });
    }

    // Get current balance
    const lastCrateRecord = await CrateTracking.findOne({
      where: { productId },
      order: [['createdAt', 'DESC']],
      transaction
    });

    const currentBalance = lastCrateRecord ? lastCrateRecord.cratesBalance : 0;
    const newBalance = Math.max(0, currentBalance + parseInt(adjustment));

    // Create new crate tracking record
    const crateRecord = await CrateTracking.create({
      productId,
      transactionType: 'adjustment',
      transactionId: null,
      cratesReceived: adjustment > 0 ? adjustment : 0,
      cratesReturned: adjustment < 0 ? Math.abs(adjustment) : 0,
      cratesBalance: newBalance,
      notes: notes.trim(),
      processedBy: req.session.userId
    }, { transaction });

    await transaction.commit();

    // Fetch the created record with associations
    const createdRecord = await CrateTracking.findByPk(crateRecord.id, {
      include: [
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: 'Crate balance adjusted successfully',
      crateRecord: createdRecord,
      newBalance
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Adjust crate balance error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get summary report for crate tracking
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let whereClause = {};
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    const summary = await CrateTracking.findAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Process summary data
    const productSummaries = new Map();
    
    summary.forEach(record => {
      const productName = record.product?.name || 'Unknown Product';
      if (!productSummaries.has(productName)) {
        productSummaries.set(productName, {
          productName,
          totalReceived: 0,
          totalReturned: 0,
          adjustments: 0,
          currentBalance: 0
        });
      }
      
      const productData = productSummaries.get(productName);
      productData.totalReceived += record.cratesReceived;
      productData.totalReturned += record.cratesReturned;
      
      if (record.transactionType === 'adjustment') {
        productData.adjustments += (record.cratesReceived - record.cratesReturned);
      }
      
      // Update current balance (will be the latest record's balance for each product)
      productData.currentBalance = record.cratesBalance;
    });

    const summaryData = Array.from(productSummaries.values());

    res.json({
      summary: summaryData,
      totalRecords: summary.length
    });

  } catch (error) {
    console.error('Get crate summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;