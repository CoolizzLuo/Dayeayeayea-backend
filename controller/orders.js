const db = require('../models')
const { Op } = require('sequelize')
const { sequelize } = require('../models')
const { Order, Order_item, Member, Product, Product_img, Message, Admin } = db
const { serialNumber } = require('../utils/helper')
const createError = require('http-errors')


const orderController = {
  getAll: async (req, res, next) => {
    const { condition = 'active' } = req.params

    const option = {
      all: {},
      active: { isDeleted: 0 },
      archive: { isDeleted: 1 }
    }
    const where = option[condition]


    try {
      const data = await Order.findAll({
        where,
        include: [
          {
            model: Member,
            attributes: ['fullname', 'username', 'email', 'address', 'phone']
          },
          {
            model: Order_item,
            attributes: ['id', 'productId', 'quantity'],
            include: [
              {
                model: Product,
                include: [
                  {
                    model: Product_img,
                    attributes: ['id','imgUrlSm', 'imgUrlMd', 'imgUrlLg']
                  }
                ]
              }
            ]
          },
          {
            model: Message,
            include: [
              {
                model: Member,
                attributes: ['fullname', 'username', 'email', 'address', 'phone']
              },
              {
                model: Admin,
                attributes: ['username']
              }
            ]
          }
        ]
      })
      return res.status(200).json({
        ok: 1,
        data
      })

    } catch (error) {
      return next(createError(401, 'Get orders fail'))
    }
  },
  getOneById: async (req, res, next) => {
    const { id } = req.params
    const { memberId, role } = req.auth
    const where = role ? { id } : { id, memberId }

    try {
      const data = await Order.findOne({ 
        where,
        include: [
          {
            model: Member,
            attributes: ['fullname', 'username', 'email', 'address', 'phone']
          },
          {
            model: Order_item,
            attributes: ['id', 'productId', 'quantity'],
            include: [
              {
                model: Product,
                include: [
                  {
                    model: Product_img,
                    attributes: ['id','imgUrlSm', 'imgUrlMd', 'imgUrlLg']
                  }
                ]
              }
            ]
          },
          {
            model: Message,
            include: [
              {
                model: Member,
                attributes: ['fullname', 'username', 'email', 'address', 'phone']
              },
              {
                model: Admin,
                attributes: ['username']
              }
            ]
          }
        ]
      })
      if (data) {
        return res.status(200).json({
          ok: 1,
          data
        })
      }
      return next(createError(401, 'Get order fail'))

    } catch (error) {
      return next(createError(401, 'Get order fail'))
    }
  },
  getOneByTicket: async (req, res, next) => {
    const { ticket } = req.params
    const { memberId, role } = req.auth
    const where = role ? { ticketNo: ticket } : { ticketNo: ticket, memberId }

    try {
      const data = await Order.findOne({ 
        where,
        include: [
          {
            model: Member,
            attributes: ['fullname', 'username', 'email', 'address', 'phone']
          },
          {
            model: Order_item,
            attributes: ['id', 'productId', 'quantity'],
            include: [
              {
                model: Product,
                include: [
                  {
                    model: Product_img,
                    attributes: ['id','imgUrlSm', 'imgUrlMd', 'imgUrlLg']
                  }
                ]
              }
            ]
          },
          {
            model: Message,
            include: [
              {
                model: Member,
                attributes: ['fullname', 'username', 'email', 'address', 'phone']
              },
              {
                model: Admin,
                attributes: ['username']
              }
            ]
          }
        ]
      })
      if (data) {
        return res.status(200).json({
          ok: 1,
          data
        })
      }
      return next(createError(401, 'Get order fail'))

    } catch (error) {
      console.log(error)
      return next(createError(401, 'Get order fail'))
    }
  },
  getAllByUser: async (req, res, next) => {
    const { memberId } = req.auth

    try {
      const data = await Order.findAll({
        where: {
          memberId
        },
        include: [
          {
            model: Member,
            attributes: ['fullname', 'username', 'email', 'address', 'phone']
          },
          {
            model: Order_item,
            attributes: ['id', 'productId', 'quantity'],
            include: [
              {
                model: Product,
                include: [
                  {
                    model: Product_img,
                    attributes: ['id','imgUrlSm', 'imgUrlMd', 'imgUrlLg']
                  }
                ]
              }
            ]
          },
          {
            model: Message,
            include: [
              {
                model: Member,
                attributes: ['fullname', 'username', 'email', 'address', 'phone']
              },
              {
                model: Admin,
                attributes: ['username']
              }
            ]
          }
        ]
      })
      
      if (data) {
        return res.status(200).json({
          ok: 1,
          data
        })
      }
      return next(createError(401, 'Get order fail'))

    } catch (error) {
      console.log(error)
      return next(createError(401, 'Get order fail'))
    }
  },
  addOne: async (req, res, next) => {
    const { memberId } = req.auth
    const ticketNo = serialNumber()
    const { 
      status,
      isDeleted = 0,
      subTotal,
      orderAddress,
      orderName,
      orderEmail,
      orderPhone,
      payment,
      shipping,
      orderItem
    } = req.body

    try {
      const productsData = await Product.findAll({
        where: { id: { [Op.in]: orderItem.map((item) => item.productId) } },
        attributes: ['id', 'status', 'quantity']
      })

      const isProductStatusOn = productsData.every((product) => product.status === 'on')
      const isProductEnough = orderItem.every((item) => {
        const _product = productsData.find((product) => product.id === item.productId)
        return _product.quantity >= item.quantity
      })

      if (!isProductEnough || !isProductStatusOn) {
        orderItem.forEach((item) => {
          const _product = productsData.find((product) => product.id === item.productId)
          item.stock = _product.quantity
          item.status = _product.status
        })
        return res.status(401).json({
          ok: 0,
          message: !isProductEnough ? 'Product stock is not enough' : 'Product status is off',
          data: orderItem
        })
      }

      await sequelize.transaction(async (t) => {
        const _order = await Order.create({
          memberId,
          ticketNo,
          status,
          isDeleted,
          subTotal,
          orderAddress,
          orderName,
          orderEmail,
          orderPhone,
          payment,
          shipping,
          Order_items: orderItem
        }, 
        { include: Order_item },
        { transaction: t })

        await Promise.all(productsData.map(
          (product) => {
            const _item = orderItem.find((item) => product.id === item.productId)
            if (product.quantity - _item.quantity < 0 ) throw Error()
            Product.update(
              { quantity: product.quantity - _item.quantity },
              { where: { id: product.id } },
              { transaction: t }
            );
          })
        );

        if (_order) {
          return res.status(201).json({
            ok: 1,
            ticketNo,
            message: 'Add order success',
            data: _order
          })
        }
        return next(createError(401, 'Add order fail'))
      })

    } catch (error) {
      console.log(error)
      return next(createError(401, 'Add order fail'))
    }
  },
  updateOne: async (req, res, next) => {
    const { ticket } = req.params
    const { memberId, role } = req.auth
    const where = role ? { ticketNo: ticket } : { ticketNo: ticket, memberId }

    const { 
      status,
      isDeleted,
      orderAddress,
      orderName,
      orderEmail,
      orderPhone,
      payment,
      shipping,
      orderItem
    } = req.body

    try {
      const _order = await Order.findOne({ where })
      await _order.update({
        status,
        isDeleted,
        orderAddress,
        orderName,
        orderEmail,
        orderPhone,
        payment,
        shipping,
        Order_items: orderItem
      })

      if (orderItem && orderItem.length > 0) {
        orderItem.map(async ({ id, productId, quantity }) => {
          const _order_item = await Order_item.findByPk(id)
          if (!_order_item) return next(createError(401, 'Update order fail'))

          await _order_item.update({
            productId,
            quantity
          })
        })
      }

      return res.status(200).json({
        ok: 1,
        message: 'Update order success'
      })

    } catch (error) {
      return next(createError(401, 'Update order fail'))
    }
    
  },
  updateStatus: async (req, res, next) => {
    const { ticket, action } = req.params
    const { memberId, role } = req.auth
    const where = role ? { ticketNo: ticket } : { ticketNo: ticket, memberId }

    const orderAction = {
      normal: '處理中',
      cancel: '已取消',
      ship: '已出貨',
      complete: '已完成',
    }

    try {
      const _order = await Order.findOne({ where })
      if (!_order) return next(createError(401, 'Update order status fail'))
      console.log(_order)

      await _order.update({
        status: orderAction[action]
      })

      return res.status(200).json({
        ok: 1,
        message: `Update order status to ${action}`
      })

    } catch (error) {
      return next(createError(401, 'Update order status fail'))
    }
    
  },
  deleteOne: async (req, res, next) => {
    const { ticket } = req.params
    const { memberId, role } = req.auth
    const where = role ? { ticketNo: ticket } : { ticketNo: ticket, memberId }

    try {
      const _order = await Order.findOne({ where })
      await _order.update({
        isDeleted: true
      })
      return res.status(200).json({
        ok: 1,
        message: 'Update order success'
      })

    } catch (error) {
      return next(createError(401, 'Delete order fail'))
    }
  }
}

module.exports = orderController
