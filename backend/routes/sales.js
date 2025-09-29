const express = require('express');
const { Sale, SaleItem, Product, User, CrateTracking, sequelize } = require('../models');
const { requireAuth } = require('./auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get all sales
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, paymentMethod } = req.query;
    
    let whereClause = { isVoided: false };
    
    // Date range filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }
    
    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      whereClause.paymentMethod = paymentMethod;
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: sales } = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'unitType']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      sales,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single sale
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'unitType', 'hasCrateTracking']
            }
          ]
        }
      ]
    });
    
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(sale);
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new sale
router.post('/', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      items, // Array of { productId, quantity, unitPrice }
      paymentMethod,
      customerName,
      customerContact,
      notes
    } = req.body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sale items are required' });
    }

    if (!paymentMethod) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Payment method is required' });
    }

    // Generate receipt number
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastSale = await Sale.findOne({
      where: {
        receiptNumber: {
          [Op.like]: `RCP-${dateStr}-%`
        }
      },
      order: [['receiptNumber', 'DESC']],
      transaction
    });

    let receiptNumber;
    if (lastSale) {
      const lastNumber = parseInt(lastSale.receiptNumber.split('-')[2]);
      receiptNumber = `RCP-${dateStr}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      receiptNumber = `RCP-${dateStr}-001`;
    }

    // Validate and process items
    let totalAmount = 0;
    let totalCost = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction });
      
      if (!product) {
        await transaction.rollback();
        return res.status(404).json({ error: `Product with ID ${item.productId} not found` });
      }

      if (!product.isActive) {
        await transaction.rollback();
        return res.status(400).json({ error: `Product ${product.name} is not active` });
      }

      if (product.currentStock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.currentStock}, Requested: ${item.quantity}` 
        });
      }

      const unitPrice = parseFloat(item.unitPrice) || product.sellingPrice;
      const unitCost = product.costPrice;
      const totalPrice = unitPrice * item.quantity;
      const itemTotalCost = unitCost * item.quantity;
      const itemProfit = totalPrice - itemTotalCost;

      totalAmount += totalPrice;
      totalCost += itemTotalCost;

      processedItems.push({
        productId: product.id,
        product: product,
        quantity: item.quantity,
        unitPrice,
        unitCost,
        totalPrice,
        totalCost: itemTotalCost,
        profit: itemProfit
      });
    }

    const profit = totalAmount - totalCost;

    // Create sale
    const sale = await Sale.create({
      receiptNumber,
      totalAmount,
      totalCost,
      profit,
      paymentMethod,
      customerName: customerName?.trim(),
      customerContact: customerContact?.trim(),
      notes: notes?.trim(),
      soldBy: req.session.userId
    }, { transaction });

    // Create sale items and update stock
    for (const item of processedItems) {
      // Create sale item
      await SaleItem.create({
        saleId: sale.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        totalPrice: item.totalPrice,
        totalCost: item.totalCost,
        profit: item.profit
      }, { transaction });

      // Update product stock
      await item.product.update({
        currentStock: item.product.currentStock - item.quantity
      }, { transaction });

      // Handle crate tracking for Diamond Ice
      if (item.product.hasCrateTracking) {
        // Get current crate balance
        const lastCrateRecord = await CrateTracking.findOne({
          where: { productId: item.productId },
          order: [['createdAt', 'DESC']],
          transaction
        });

        const currentBalance = lastCrateRecord ? lastCrateRecord.cratesBalance : 0;
        const newBalance = currentBalance + item.quantity; // Sale increases crates owed

        await CrateTracking.create({
          productId: item.productId,
          transactionType: 'sale',
          transactionId: sale.id,
          cratesReceived: 0,
          cratesReturned: 0,
          cratesBalance: newBalance,
          notes: `Sale of ${item.quantity} crates - Receipt: ${receiptNumber}`,
          processedBy: req.session.userId
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch the created sale with all associations
    const createdSale = await Sale.findByPk(sale.id, {
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'unitType']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Sale created successfully',
      sale: createdSale
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Void sale
router.post('/:id/void', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { voidReason } = req.body;
    
    if (!voidReason) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Void reason is required' });
    }

    const sale = await Sale.findByPk(req.params.id, {
      include: [
        {
          model: SaleItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ],
      transaction
    });

    if (!sale) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (sale.isVoided) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Sale is already voided' });
    }

    // Restore stock for each item
    for (const item of sale.items) {
      await item.product.update({
        currentStock: item.product.currentStock + item.quantity
      }, { transaction });

      // Handle crate tracking reversal
      if (item.product.hasCrateTracking) {
        const lastCrateRecord = await CrateTracking.findOne({
          where: { productId: item.productId },
          order: [['createdAt', 'DESC']],
          transaction
        });

        const currentBalance = lastCrateRecord ? lastCrateRecord.cratesBalance : 0;
        const newBalance = currentBalance - item.quantity; // Void reduces crates owed

        await CrateTracking.create({
          productId: item.productId,
          transactionType: 'adjustment',
          transactionId: sale.id,
          cratesReceived: 0,
          cratesReturned: 0,
          cratesBalance: newBalance,
          notes: `Void sale ${sale.receiptNumber} - ${voidReason}`,
          processedBy: req.session.userId
        }, { transaction });
      }
    }

    // Void the sale
    await sale.update({
      isVoided: true,
      voidReason
    }, { transaction });

    await transaction.commit();

    res.json({ message: 'Sale voided successfully' });

  } catch (error) {
    await transaction.rollback();
    console.error('Void sale error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;