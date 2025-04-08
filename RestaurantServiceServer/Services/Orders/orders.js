const db = require('../../Repository/db/db_methods');
const crypto = require('crypto');
const axios = require('axios');

class Orders {
    constructor(restaurant_id) {
        if (!restaurant_id || typeof restaurant_id !== 'string') {
            throw new Error('restaurant_id is required');
        }

        this.restaurant_id = restaurant_id;
    }

    async generateUniqId() {
        const uniq_id = `ORD${crypto.randomBytes(15).toString('hex').slice(0, 17)}`;
        const check = await db.executeQuery('SELECT id FROM orders WHERE uniq_id = ?', [uniq_id]);
        if (check.length > 0) {
            return this.generateUniqId();
        }
        return uniq_id;
    }

    async _getRestaurantDetails() {
        const restaurant = await db.executeQuery('SELECT id, restaurant_name FROM restaurants WHERE uniq_id = ?', [this.restaurant_id]);
        if (restaurant.length === 0) {
            throw new Error('Restaurant not found');
        }
        return restaurant[0];
    }
}

class CreateOrder extends Orders {
    constructor({restaurant_id, user_id, order_items}) {
        super(restaurant_id);
        if(!user_id || typeof user_id !== 'string') {
            throw new Error('user_id is required');
        }   
        this.user_id = user_id;

        if (!order_items || !Array.isArray(order_items)) {
            throw new Error('order_items is required');
        }

        this.order_items = order_items;
    }

    async #_getMenuItems() {
        const query = `SELECT item_name, item_price, id AS menu_item_prim_id, uniq_id AS menu_item_id FROM menu_items WHERE restaurant_id = ? AND uniq_id IN (?) AND is_available = '1'`;

        const params = [this.restaurant_prim_id, this._order_items_ids];

        const result = await db.executeQuery(query, params);
        console.log(result);

        if (result.length !== this._order_items_ids.length) {
            throw new Error('Some Menu items not found or are not available');
        }

        for(const item of result) {
            this._order_items_map[item.menu_item_id] = {
                ...this._order_items_map[item.menu_item_id],
                ...item
            }

            this.total_amount += item.item_price * this._order_items_map[item.menu_item_id].quantity;
        }
    }

    async #_validateOrderItems() { 
        if (this.order_items.length === 0) {
            throw new Error('Order items cannot be empty');
        }

        this._order_items_map = {}

        for (const item of this.order_items) {
            if (!item.menu_item_id || typeof item.menu_item_id !== 'string') {
                throw new Error('Item id is required and must be a string');
            }
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
                throw new Error('Item quantity is required and must be a positive number');
            }

            if(this._order_items_map.hasOwnProperty(item.menu_item_id)) { 
                this._order_items_map[item.menu_item_id].quantity += item.quantity;
            } else {
                this._order_items_map[item.menu_item_id] = item;
            }
        }

        this._order_items_ids = Object.keys(this._order_items_map);
    }

    async #_createOrder() {

        this.order_id = await this.generateUniqId();

        const query = `INSERT INTO orders (uniq_id, restaurant_id, user_id, total_amount) VALUES (?, ?, (SELECT id FROM users WHERE uniq_id = ?), ?)`;
        const params = [this.order_id, this.restaurant_prim_id, this.user_id, this.total_amount];
        console.log(params);

        const result = await db.executeQuery(query, params);
        this.order_prim_id = result.insertId;

        const order_items = Object.values(this._order_items_map).map(item => {
            return [
                this.order_prim_id,
                item.menu_item_prim_id,
                item.quantity
            ];
        });

        console.log(order_items);
        await db.executeQuery(`INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES ?`, [order_items]);
    }

    async create() {
        this.total_amount = 0;

        await this.#_validateOrderItems();

        const restaurant = await this._getRestaurantDetails();
        console.log(restaurant);

        this.restaurant_prim_id = restaurant.id;

        await this.#_getMenuItems();

        await this.#_createOrder();

        return {status: 'success', message: 'Order created successfully', order_id: this.order_id, total_amount: this.total_amount};
    }
}

class UpdateOrderStatus extends Orders {
    constructor({restaurant_id, order_id, status}) {
        super(restaurant_id);

        if (!order_id || typeof order_id !== 'string') {
            throw new Error('order_id is required');
        }

        this.order_id = order_id;

        if (!status || typeof status !== 'string' || ['food_prepared', 'canceled'].indexOf(status) === -1) {
            throw new Error('status is required and must be a string');
        }

        this.status = status;
    }

    async #_processStatus() {
        if (this.status === 'food_prepared') {
            await this.#_assignDeliveryAgent();
        } else if (this.status === 'canceled') {
            await this.#_deassignDeliveryAgent();
        }
    }

    async #_assignDeliveryAgent() {
        await axios.post(`${process.env.DELIVERY_AGENT_SERVICE_URL}/v1/api/delivery/assign`, {
            order_id: this.order_id
        }).then(response => {
            if (response.status !== 200) {
                throw new Error('Failed to assign delivery agent');
            }
        }
        ).catch(error => {
            throw new Error(`Error assigning delivery agent: ${error.message}`);
        });
    }

    async #_deassignDeliveryAgent() {
        await axios.put(`${process.env.DELIVERY_AGENT_SERVICE_URL}/v1/api/delivery/update_delivery_status`, {
            order_id: this.order_id,
            status: 'canceled'
        }).then(response => {
            if (response.status !== 200) {
                throw new Error('Failed to deassign delivery agent');
            }
        }
        ).catch(error => {
            throw new Error(`Error deassigning delivery agent: ${error.message}`);
        });
    }

    async updateStatus() {
        const query = `UPDATE orders SET status = ? WHERE uniq_id = ?`;
        const params = [this.status, this.order_id];
        
        const resp = await db.executeQuery(query, params);

        if(resp.affectedRows === 0) {
            throw new Error('Order not found');
        }

        await this.#_processStatus();

        return {status: 'success', message: 'Order status updated successfully'};
    }
}

module.exports = { CreateOrder, UpdateOrderStatus };