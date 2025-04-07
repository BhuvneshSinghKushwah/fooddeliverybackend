const db = require('../../Repository/db/db_methods');
const crypto = require('crypto');

class RestaurantMenu {
    constructor({ restaurant_id }) {
        if (!restaurant_id || typeof restaurant_id !== 'string') {
            throw new Error('restaurant_id is required and must be a string');
        }

        this.restaurant_id = restaurant_id;
    }

    async generateUniqId() {
        const uniq_id = `MEN${crypto.randomBytes(15).toString('hex').slice(0, 17)}`;
        const check = await db.executeQuery('SELECT id FROM menu_items WHERE uniq_id = ?', [uniq_id]);
        if (check.length > 0) {
            return this.generateUniqId();
        }
        return uniq_id;
    }
}

class CreateMenu extends RestaurantMenu {
    constructor({ restaurant_id, menu_items }) {
        super({ restaurant_id });

        if (!menu_items || !Array.isArray(menu_items)) {
            throw new Error('menu_items is required and must be an array');
        }

        this.menu_items = menu_items;
    }

    async #_restaurantDetails() {
        const query = `SELECT id FROM restaurants WHERE uniq_id = ?`;
        const resp = await db.executeQuery(query, [this.restaurant_id]);

        if (!resp || resp.length === 0) {
            throw new Error('Restaurant not found');
        }

        this.restaurant_prim_id = resp[0].id;
    }

    async #_constructMenuItems() {
        return await Promise.all(this.menu_items.map(async item => {
            this.#_validateMenuItems(item);

            const uniq_id = await this.generateUniqId();

            return [
                uniq_id,
                this.restaurant_prim_id,
                item.item_name,
                item.item_price,
                item.item_description || null
            ];
        }));
    }

    async #_insertMenuItems(menuItemsData) {
        const query = `INSERT INTO menu_items (uniq_id, restaurant_id, item_name, item_price, item_description) VALUES ?`;
        await db.executeQuery(query, [menuItemsData]);
    }

    #_validateMenuItems(item) {
        if (!item.item_name || typeof item.item_name !== 'string') {
            throw new Error('item_name is required and should be a string');
        }
        if (typeof item.item_price !== 'number') {
            throw new Error('item_price is required and should be a number');
        }
        if (item.item_description && typeof item.item_description !== 'string') {
            throw new Error('item_description should be a string');
        }
    }

    async create() {
        await this.#_restaurantDetails();
        const constructedMenuItems = await this.#_constructMenuItems();
        await this.#_insertMenuItems(constructedMenuItems);
        return { status: true, message: 'Menu items created successfully.' };
    }
}

class UpdateMenu extends RestaurantMenu {
    constructor({ restaurant_id, menu_items }) {
        super({ restaurant_id });

        if (!Array.isArray(menu_items) || menu_items.length === 0) {
            throw new Error('menu_items must be a non-empty array');
        }

        this.menu_items = menu_items;
    }

    #_validateMenuItem(item) {
        if (!item.menu_id || typeof item.menu_id !== 'string') {
            throw new Error('menu_id is required for update and should be a string');
        }

        if (item.item_name && typeof item.item_name !== 'string') {
            throw new Error('item_name must be a string');
        }

        if (item.item_price && typeof item.item_price !== 'number') {
            throw new Error('item_price must be a number');
        }

        if (item.item_description && typeof item.item_description !== 'string') {
            throw new Error('item_description must be a string');
        }
    }

    async update() {
        for (const item of this.menu_items) {
            this.#_validateMenuItem(item);

            const fields = [];
            const values = [];

            if (item.item_name) {
                fields.push('item_name = ?');
                values.push(item.item_name);
            }
            if (item.item_price !== undefined) {
                fields.push('item_price = ?');
                values.push(item.item_price);
            }
            if (item.item_description !== undefined) {
                fields.push('item_description = ?');
                values.push(item.item_description);
            }

            if (fields.length === 0) continue;

            values.push(item.menu_id, this.restaurant_id);

            const query = `UPDATE menu_items SET ${fields.join(', ')} WHERE uniq_id = ? AND restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?)`;
            await db.executeQuery(query, values);
        }

        return { status: true, message: 'Menu items updated successfully' };
    }
}

class DeleteMenu extends RestaurantMenu {
    constructor({ restaurant_id, menu_ids }) {
        super({ restaurant_id });

        if (!Array.isArray(menu_ids) || menu_ids.length === 0) {
            throw new Error('menu_ids must be a non-empty array');
        }

        this.menu_ids = menu_ids;
    }

    async delete() {
        const placeholders = this.menu_ids.map(() => '?').join(',');
        const query = `DELETE FROM menu_items WHERE uniq_id IN (${placeholders}) AND restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?)`;
        const values = [...this.menu_ids, this.restaurant_id];

        await db.executeQuery(query, values);

        return { status: true, message: 'Menu items deleted successfully' };
    }
}

class GetMenu extends RestaurantMenu {
    constructor({ restaurant_id }) {
        super({ restaurant_id });
    }

    async get() {
        const query = `SELECT uniq_id, item_name, item_price, item_description FROM menu_items WHERE restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?)`;
        const menuItems = await db.executeQuery(query, [this.restaurant_id]);

        if (!menuItems || menuItems.length === 0) {
            return { status: false, message: 'No menu items found for this restaurant' };
        }

        return { status: true, menu_items: menuItems };
    }
}

module.exports = {
    CreateMenu,
    UpdateMenu,
    DeleteMenu,
    GetMenu
}