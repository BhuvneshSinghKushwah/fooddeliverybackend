const db = require('../../Repository/db/db_methods');
const crypto = require('crypto');

class Restaurant {
    constructor({restaurant_name}) {
        if(!restaurant_name && typeof restaurant_name !== 'string') {
            throw new Error('restaurant_name is required');
        }

        this.restaurant_name = restaurant_name;
    }

    async generateUniqId() {
        const uniq_id = `RES${crypto.randomBytes(15).toString('hex').slice(0, 17)}`;
        const check = await db.executeQuery('SELECT id FROM restaurants WHERE uniq_id = ?', [uniq_id]);
        if (check.length > 0) {
            return this.generateUniqId();
        }
        return uniq_id;
    }
}

class CreateRestaurant extends Restaurant {
    constructor({restaurant_name}) {
        super({restaurant_name});
    }

    async #_insertRestaurant() {
        this.restaurant_uniq_id = await this.generateUniqId();
        const query = 'INSERT INTO restaurants (uniq_id, restaurant_name) VALUES (?, ?)';
        const inert_resp = await db.executeQuery(query, [this.restaurant_uniq_id, this.restaurant_name]);

        this.restaurant_id = inert_resp.insertId;

        return {status: true, message: 'Restaurant created successfully', restaurant_id: this.restaurant_id};
    }

    async create() {
        await this.#_insertRestaurant();
        return {status: true, message: 'Restaurant creation process completed.', restaurant_id: this.restaurant_uniq_id};
    }
}

module.exports = {
    CreateRestaurant
}