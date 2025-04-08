const router = require('express').Router();

const {CreateOrder} = require('../Services/order');

router.post('/create', async (req, res, next) => {
    try {
        const {restaurant_id, user_id, order_items} = req.body;

        if (!restaurant_id || !user_id || !order_items) {
            return res.status(400).json({message: 'restaurant_id, user_id and order_items are required'});
        }

        const order = new CreateOrder({restaurant_id, user_id, order_items});
        const result = await order.CreateOrder();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});


module.exports = { OrderRouter: router };