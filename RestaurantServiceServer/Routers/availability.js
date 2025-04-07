const router = require('express').Router();

const { CreateRestaurantAvailablility, UpdateRestaurantAvailability, DeleteRestaurantAvailability, GetRestaurantAvailability, toggleOpenStatus } = require('../Services/Restaurants/availability');

router.post('/create', async (req, res, next) => {
    try {
        const { restaurant_id, availability } = req.body;

        if (!restaurant_id || !Array.isArray(availability) || availability.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and availability are required' });
        }

        const restaurantAvailability = new CreateRestaurantAvailablility({ restaurant_id, availability });
        const response = await restaurantAvailability.create();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.put('/update', async (req, res, next) => {
    try {
        const { restaurant_id, availability } = req.body;

        if (!restaurant_id || !Array.isArray(availability) || availability.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and availability are required' });
        }

        const restaurantAvailability = new UpdateRestaurantAvailability({ restaurant_id, availability });
        const response = await restaurantAvailability.update();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.put('/update_open', async (req, res, next) => {
    try {
        const { restaurant_id, is_open, day_of_week} = req.body;

        if (!restaurant_id || typeof is_open !== 'boolean' || (day_of_week && typeof day_of_week !== 'string') ) {
            return res.status(400).json({ status: false, message: 'restaurant_id, is_open, and day_of_week are required' });
        }

        const response = await toggleOpenStatus(restaurant_id, is_open, day_of_week);

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.delete('/delete', async (req, res, next) => {
    try {
        const { restaurant_id, days } = req.body;

        if (!restaurant_id || !Array.isArray(days) || days.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and days are required' });
        }

        const restaurantAvailability = new DeleteRestaurantAvailability({ restaurant_id, days });
        const response = await restaurantAvailability.delete();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.get('/get', async (req, res, next) => {
    try {
        const { restaurant_id } = req.query;

        if (!restaurant_id) {
            return res.status(400).json({ status: false, message: 'restaurant_id is required' });
        }

        const restaurantAvailability = new GetRestaurantAvailability();
        const response = await restaurantAvailability.get(restaurant_id);

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.get('/get_open', async (req, res, next) => {
    try {
        const restaurantAvailability = new GetRestaurantAvailability();
        const response = await restaurantAvailability.getOpenRestaurants();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});


module.exports = {AvailabilityRouter: router};