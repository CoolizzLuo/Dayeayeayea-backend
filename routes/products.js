const express = require('express')
const router = express.Router()
const Products = require('../controller/products')
const { checkAuth } = require('../middlewares/authHandler')


// 搜尋商品 ?search=keyword
router.get('/', Products.getAll)
router.get('/:id([0-9]+)', Products.getOne)
router.get('/page/:page([1-9]|[1-9][0-9]+)', Products.getByPage)
router.get('/category/:category', Products.getByCategory)
router.get('/article/:article', Products.getByArticle)

router.use(checkAuth)
router.post('/', Products.addOne)
router.patch('/:id([0-9]+)', Products.updateOne)
router.delete('/:id([0-9]+)', Products.deleteOne)
router.patch('/imgs/:id([0-9]+)', Products.updateImgs)
router.delete('/imgs/:id([0-9]+)', Products.deleteImgs)

module.exports = router
