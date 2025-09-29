const express = require('express');
const { Delivery, DeliveryItem, Product, User, CrateTracking, sequelize } = require('../models');
const { requireAuth } = require('./auth');
const { Op } = require('sequelize');
const router = express.Router();

// Get all deliveries
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, supplier } = req.query;
    
    let whereClause = {};
    
    // Date range filter
    if (startDate && endDate) {
      whereClause.deliveryDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    // Supplier filter
    if (supplier) {
      whereClause.supplier = {
        [Op.iLike]: `%${supplier}%`
      };
    }
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const { count, rows: deliveries } = await Delivery.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: DeliveryItem,
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
      order: [['deliveryDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    res.json({
      deliveries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get deliveries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single delivery
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: DeliveryItem,
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
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    res.json(delivery);
  } catch (error) {
    console.error('Get delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new delivery
router.post('/', requireAuth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      supplier,
      deliveryDate,
      items, // Array of { productId, quantity, unitCost, expiryDate }
      notes
    } = req.body;

    // Validate input
    if (!supplier || !deliveryDate || !items || !Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        error: 'Supplier, delivery date, and items are required' 
      });
    }

    // Generate delivery number
    const today = new Date(deliveryDate);
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastDelivery = await Delivery.findOne({
      where: {
        deliveryNumber: {
          [Op.like]: `DEL-${dateStr}-%`
        }
      },
      order: [['deliveryNumber', 'DESC']],
      transaction
    });

    let deliveryNumber;
    if (lastDelivery) {
      const lastNumber = parseInt(lastDelivery.deliveryNumber.split('-')[2]);
      deliveryNumber = `DEL-${dateStr}-${String(lastNumber + 1).padStart(3, '0')}`;
    } else {
      deliveryNumber = `DEL-${dateStr}-001`;
    }

    // Validate and process items
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

      const quantity = parseInt(item.quantity);
      const unitCost = parseFloat(item.unitCost) || product.costPrice;
      const itemTotalCost = unitCost * quantity;

      if (quantity <= 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
      }

      if (unitCost < 0) {
        await transaction.rollback();
        return res.status(400).json({ error: 'Unit cost must be non-negative' });
      }

      totalCost += itemTotalCost;

      processedItems.push({
        productId: product.id,
        product: product,
        quantity,
        unitCost,
        totalCost: itemTotalCost,
        expiryDate: item.expiryDate || null
      });
    }

    // Create delivery
    const delivery = await Delivery.create({
      deliveryNumber,
      supplier: supplier.trim(),
      totalCost,
      deliveryDate,
      notes: notes?.trim(),
      receivedBy: req.session.userId
    }, { transaction });

    // Create delivery items and update stock
    for (const item of processedItems) {
      // Create delivery item
      await DeliveryItem.create({
        deliveryId: delivery.id,
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.totalCost,
        expiryDate: item.expiryDate
      }, { transaction });

      // Update product stock
      await item.product.update({
        currentStock: item.product.currentStock + item.quantity
      }, { transaction });

      // Handle crate tracking for products with crate tracking enabled
      if (item.product.hasCrateTracking) {
        // Get current crate balance
        const lastCrateRecord = await CrateTracking.findOne({
          where: { productId: item.productId },
          order: [['createdAt', 'DESC']],
          transaction
        });

        const currentBalance = lastCrateRecord ? lastCrateRecord.cratesBalance : 0;
        // For deliveries, we received full crates, so no change to balance (we owe the same amount)
        // But we record the crates received

        await CrateTracking.create({
          productId: item.productId,
          transactionType: 'delivery',
          transactionId: delivery.id,
          cratesReceived: item.quantity,
          cratesReturned: 0,
          cratesBalance: currentBalance, // Balance stays same, but we track received crates
          notes: `Delivery received ${item.quantity} crates - ${deliveryNumber}`,
          processedBy: req.session.userId
        }, { transaction });
      }
    }

    await transaction.commit();

    // Fetch the created delivery with all associations
    const createdDelivery = await Delivery.findByPk(delivery.id, {
      include: [
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'fullName', 'username']
        },
        {
          model: DeliveryItem,
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
      message: 'Delivery created successfully',
      delivery: createdDelivery
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Create delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update delivery
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const { supplier, deliveryDate, notes, isReceived } = req.body;

    await delivery.update({
      supplier: supplier?.trim() || delivery.supplier,
      deliveryDate: deliveryDate || delivery.deliveryDate,
      notes: notes !== undefined ? notes?.trim() : delivery.notes,
      isReceived: isReceived !== undefined ? isReceived : delivery.isReceived
    });

    res.json({
      message: 'Delivery updated successfully',
      delivery
    });

  } catch (error) {
    console.error('Update delivery error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get suppliers list
router.get('/meta/suppliers', requireAuth, async (req, res) => {
  try {
    const suppliers = await Delivery.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('supplier')), 'supplier']],
      order: [['supplier', 'ASC']]
    });
    
    const supplierList = suppliers.map(s => s.supplier).filter(Boolean);
    
    res.json(supplierList);
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;