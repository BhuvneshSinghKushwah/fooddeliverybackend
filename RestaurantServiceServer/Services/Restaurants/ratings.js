const db = require('../../Repository/db/db_methods');

class Ratings {
    constructor({ restaurant_id }) {
        if (!restaurant_id && typeof restaurant_id !== 'string') {
            throw new Error('restaurant_id is required');
        }

        this.restaurant_id = restaurant_id;
    }

    async _calculateRating(prev_rating, prev_rating_count, new_rating_input) {
        if (
            typeof prev_rating !== 'number' ||
            typeof prev_rating_count !== 'number' ||
            typeof new_rating_input !== 'number'
        ) {
            throw new Error('All inputs must be numbers');
        }

        const total_rating = prev_rating * prev_rating_count + new_rating_input;
        const new_rating_count = prev_rating_count + 1;
        let new_rating = total_rating / new_rating_count;

        new_rating = Math.round(new_rating * 10) / 10;

        new_rating = Math.max(0, Math.min(5, new_rating));

        return { new_rating, new_rating_count };
    }

}

class RestaurantRatings extends Ratings {
    constructor({ restaurant_id, rating }) {
        super({ restaurant_id });

        if (rating !== undefined) {
            rating = Number(rating);

            if (isNaN(rating) || rating < 0 || rating > 5) {
                throw new Error('rating should be a number between 0 and 5');
            }

            rating = Math.round(rating * 10) / 10;
            this.rating = Math.max(0, Math.min(5, rating));
        } else {
            this.rating = undefined;
        }
    }



    async #_updateRating() {
        const { rating, rating_count } = await this.#_getRating();

        const { new_rating, new_rating_count } = await super._calculateRating(rating, rating_count, this.rating);

        await db.executeQuery('UPDATE restaurants SET rating = ?, rating_count = ? WHERE uniq_id = ?', [new_rating, new_rating_count, this.restaurant_id]);
    }

    async #_getRating() {
        const current_rating = await db.executeQuery('SELECT rating, rating_count FROM restaurants WHERE uniq_id = ?', [this.restaurant_id]);

        if (current_rating.length === 0) {
            throw new Error('Restaurant not found');
        }

        return {
            rating: parseFloat(current_rating[0].rating),
            rating_count: parseInt(current_rating[0].rating_count)
        };
    }

    async updateRating() {
        if (this.rating) {
            await this.#_updateRating();
            return { status: true, message: 'Rating updated successfully' };
        } else {
            throw new Error('Rating is required');
        }
    }

    async getRating() {
        const { rating, rating_count } = await this.#_getRating();
        return { status: true, message: 'Rating fetched successfully', rating, rating_count };
    }

}

class MenuRatings extends Ratings {
    constructor({ restaurant_id, menu_id, rating }) {
        super({ restaurant_id });

        if (!menu_id || typeof menu_id !== 'string') {
            throw new Error('menu_id is required');
        }

        this.menu_id = menu_id;

        if (rating !== undefined) {
            rating = Number(rating);

            if (isNaN(rating) || rating < 0 || rating > 5) {
                throw new Error('rating should be a number between 0 and 5');
            }

            rating = Math.round(rating * 10) / 10;
            this.rating = Math.max(0, Math.min(5, rating));
        } else {
            this.rating = undefined;
        }
    }

    async #_getMenuRating() {
        const current_rating = await db.executeQuery('SELECT item_rating, item_rating_count FROM menu_items WHERE uniq_id = ? AND restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?)', [this.menu_id, this.restaurant_id]);

        if (current_rating.length === 0) {
            throw new Error('Menu item not found');
        }

        return {
            rating: parseFloat(current_rating[0].item_rating),
            rating_count: parseInt(current_rating[0].item_rating_count)
        };
    }

    async #_updateMenuRating() {
        const { rating, rating_count } = await this.#_getMenuRating();

        const { new_rating, new_rating_count } = await super._calculateRating(rating, rating_count, this.rating);

        await db.executeQuery('UPDATE menu_items SET item_rating = ?, item_rating_count = ? WHERE uniq_id = ? AND restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?)', [new_rating, new_rating_count, this.menu_id, this.restaurant_id]);
    }

    async updateRating() {
        if (this.rating) {
            await this.#_updateMenuRating();
            return { status: true, message: 'Menu rating updated successfully' };
        } else {
            throw new Error('Rating is required');
        }
    }

    async getRating() {
        const { rating, rating_count } = await this.#_getMenuRating();
        return { status: true, message: 'Menu rating fetched successfully', rating, rating_count };
    }
}

module.exports = {
    RestaurantRatings,
    MenuRatings
}