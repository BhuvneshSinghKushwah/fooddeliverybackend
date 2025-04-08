const router = require('express').Router();

const {CreateOrder, UpdateOrderStatus} = require('../Services/Orders/orders');

router.post('/create', async (req, res, next) => {
    try {
        const {restaurant_id, user_id, order_items} = req.body;

        if (!restaurant_id || !user_id || !order_items) {
            return res.status(400).json({message: 'restaurant_id, user_id and order_items are required'});
        }

        const order = new CreateOrder({restaurant_id, user_id, order_items});
        const result = await order.create();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.put('/update_order_status', async (req, res, next) => {
    try {
        const {restaurant_id, order_id, status} = req.body;

        if (!restaurant_id || !order_id || !status) {
            return res.status(400).json({message: 'restaurant_id, order_id and status are required'});
        }

        const orderStatus = new UpdateOrderStatus({restaurant_id, order_id, status});
        const result = await orderStatus.updateStatus();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

module.exports = { OrderRouter: router };