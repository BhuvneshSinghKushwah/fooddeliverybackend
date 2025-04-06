const router = require('express').Router();

const { CreateRestaurant } = require('../Services/Restaurants/manage');

router.post('/create', async (req, res, next) => {
    try {
        const { restaurant_name } = req.body;

        if (!restaurant_name) {
            return res.status(400).json({ status: false, message: 'restaurant_name is required' });
        }

        const restaurant = new CreateRestaurant({ restaurant_name });
        const response = await restaurant.create();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

module.exports = {RestaurantRouter: router};