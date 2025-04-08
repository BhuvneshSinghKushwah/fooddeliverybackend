const express = require('express');
const router = express.Router();

const { AssignDeliveryAgent, UpdateDeliveryStatus } = require('../Services/delivery');

router.post('/assign', async (req, res, next) => {
    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ message: 'order_id is required' });
        }

        const deliveryAgent = new AssignDeliveryAgent({ order_id });
        const data = await deliveryAgent.assign();

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
});

router.put('/update_delivery_status', async (req, res, next) => {
    try {
        const { order_id, status } = req.body;

        if (!order_id || !status) {
            return res.status(400).json({ message: 'order_id and status are required' });
        }

        const deliveryStatus = new UpdateDeliveryStatus({ order_id, status });
        const data = await deliveryStatus.update();

        return res.status(200).json(data);
    } catch (error) {
        next(error);
    }
});


module.exports = {DeliveryRouter: router};
