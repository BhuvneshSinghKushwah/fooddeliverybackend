const router = require('express').Router();

const { CreateMenu, GetMenu, UpdateMenu, DeleteMenu } = require('../Services/Restaurants/menu');
const { MenuRatings } = require('../Services/Restaurants/ratings');

router.post('/create', async (req, res, next) => {
    try {
        const { restaurant_id, menu_items } = req.body;

        if (!restaurant_id || !Array.isArray(menu_items) || menu_items.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and menu_items are required' });
        }

        const menu = new CreateMenu({ restaurant_id, menu_items });
        const response = await menu.create();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.put('/update', async (req, res, next) => {
    try {
        const { restaurant_id, menu_items } = req.body;

        if (!restaurant_id || !Array.isArray(menu_items) || menu_items.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and menu_items are required' });
        }

        const menu = new UpdateMenu({ restaurant_id, menu_items });
        const response = await menu.update();

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

        const menu = new GetMenu({ restaurant_id });
        const response = await menu.get();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.delete('/delete', async (req, res, next) => {
    try {
        const { restaurant_id, menu_ids } = req.body;

        if (!restaurant_id || !Array.isArray(menu_ids) || menu_ids.length === 0) {
            return res.status(400).json({ status: false, message: 'restaurant_id and menu_ids are required' });
        }

        const menu = new DeleteMenu({ restaurant_id, menu_ids });
        const response = await menu.delete();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.post('/rating', async (req, res, next) => {
    try {
        const { restaurant_id, menu_id, rating } = req.body;

        if (!restaurant_id || !menu_id || rating === undefined) {
            return res.status(400).json({ status: false, message: 'restaurant_id, menu_id and rating are required' });
        }

        const menu = new MenuRatings({ restaurant_id, menu_id, rating });
        const response = await menu.updateRating();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

router.get('/rating', async (req, res, next) => {
    try {
        const { restaurant_id, menu_id } = req.query;

        if (!restaurant_id || !menu_id) {
            return res.status(400).json({ status: false, message: 'restaurant_id and menu_id are required' });
        }

        const menu = new MenuRatings({ restaurant_id, menu_id });
        const response = await menu.getRating();

        return res.status(200).json(response);
    } catch (error) {
        next(error);
    }
});

module.exports = {MenuRouter: router};