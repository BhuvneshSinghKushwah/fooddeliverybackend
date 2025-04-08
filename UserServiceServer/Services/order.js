const axios = require('axios');

class Users {
    constructor(user_id) {
        if (!user_id || typeof user_id !== 'string') {
            throw new Error('user_id is required and must be a string');
        }
        this.user_id = user_id;
    }
}

class CreateOrder extends Users {
    constructor({ restaurant_id, user_id, order_items }) {

        super(user_id);

        if (!restaurant_id || typeof restaurant_id !== 'string') {
            throw new Error('restaurant_id is required and must be a string');
        }
        this.restaurant_id = restaurant_id;

        if (!order_items || !Array.isArray(order_items)) {
            throw new Error('order_items is required and must be an array');
        }
        this.order_items = order_items;
    }

    async #_createOrder() {
        await axios.post(`${process.env.RESTAURANT_SERVICE_URL}/r1/api/orders/create`, {
            restaurant_id: this.restaurant_id,
            user_id: this.user_id,
            order_items: this.order_items
        }).then(response => {
            if (response.status !== 200) {
                throw new Error('Failed to create order');
            }

            return { status: 'success', message: 'Order created successfully', data: response.data };
        }).catch(error => {
            throw new Error(`Error creating order: ${error.message}`);
        });

    }

    async CreateOrder() {
        try {
            const result = await this.#_createOrder();
            return result;
        } catch (error) {
            throw new Error(`Error creating order: ${error.message}`);
        }
    }
}

module.exports = { CreateOrder };