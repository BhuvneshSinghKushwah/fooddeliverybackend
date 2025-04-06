const router = require('express').Router();

const { CreateRestaurant } = require('../Services/Restaurants/manage');
const { RestaurantRatings } = require('../Services/Restaurants/ratings');

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

router.post('/rating', async (req, res, next) => {
    try {
        const { restaurant_id, rating } = req.body;

        if (!restaurant_id || !rating) {
            return res.status(400).json({ status: false, message: 'restaurant_id and rating are required' });
        }

        const restaurant = new RestaurantRatings({ restaurant_id, rating });
        const response = await restaurant.updateRating();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.get('/rating', async (req, res, next) => {
    try {
        const { restaurant_id } = req.query;

        if (!restaurant_id) {
            return res.status(400).json({ status: false, message: 'restaurant_id is required' });
        }

        const restaurant = new RestaurantRatings({ restaurant_id });
        const response = await restaurant.getRating();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

module.exports = {RestaurantRouter: router};