const db = require('../Repository/db/db_methods');
const crypto = require('crypto');

class CreateUsers {
    constructor({name, email}) {
        if (!name || typeof name !== 'string') {
            throw new Error('name is required and must be a string');
        }
        this.name = name;

        if (!email || typeof email !== 'string') {
            throw new Error('email is required and must be a string');
        }
        this.email = email;
    }

    async #_generateUniqId() {
        const uniq_id = `USR${crypto.randomBytes(15).toString('hex').slice(0, 17)}`;
        const check = await db.executeQuery('SELECT id FROM users WHERE uniq_id = ?', [uniq_id]);
        if (check.length > 0) {
            return this.#_generateUniqId();
        }
        return uniq_id;
    }
    async #_createUser() {
        this.user_id = await this.#_generateUniqId();

        const query = 'INSERT INTO users (uniq_id, name, email) VALUES (?, ?, ?)';
        const values = [this.user_id, this.name, this.email];
        await db.executeQuery(query, values);
        return { status: true, user_id: this.user_id};
    }
    async CreateUser(){
        try {
            const result = await this.#_createUser();
            return result;
        } catch (error) {
            throw new Error(`Error creating user: ${error.message}`);
        }
    }
}

class UpdateUsers {
    constructor(user_id, { name, email }) {
        if (!user_id || typeof user_id !== 'string') {
            throw new Error('user_id is required and must be a string');
        }
        this.user_id = user_id;

        if (name !== undefined && typeof name !== 'string') {
            throw new Error('name must be a string');
        }
        this.name = name;

        if (email !== undefined && typeof email !== 'string') {
            throw new Error('email must be a string');
        }
        this.email = email;
    }

    async #_updateUser() {
        const fields = [];
        const values = [];

        if (this.name !== undefined) {
            fields.push('name = ?');
            values.push(this.name);
        }

        if (this.email !== undefined) {
            fields.push('email = ?');
            values.push(this.email);
        }

        if (fields.length === 0) {
            throw new Error('At least one field (name or email) must be provided for update');
        }

        const query = `UPDATE users SET ${fields.join(', ')} WHERE uniq_id = ?`;
        values.push(this.user_id);

        await db.executeQuery(query, values);
        return { status: true };
    }

    async UpdateUser() {
        try {
            const result = await this.#_updateUser();
            return result;
        } catch (error) {
            throw new Error(`Error updating user: ${error.message}`);
        }
    }
}

class GetUserDetails {
    constructor(user_id) {
        if (!user_id || typeof user_id !== 'string') {
            throw new Error('user_id is required and must be a string');
        }
        this.user_id = user_id;
    }

    async #_getUserDetails() {
        const query = 'SELECT uniq_id AS user_id, name, email FROM users WHERE uniq_id = ?';
        const values = [this.user_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('User not found');
        }
        return result[0];
    }
    async GetUserDetails() {
        try {
            const result = await this.#_getUserDetails();
            return result;
        } catch (error) {
            throw new Error(`Error getting user details: ${error.message}`);
        }
    }

    async #_getUserOrders() {
        const query = 'SELECT o.uniq_id AS order_id, o.status, o.total_amount FROM orders o WHERE o.user_id = (SELECT id FROM users WHERE uniq_id = ?)';
        const values = [this.user_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('No orders found for this user');
        }
        return result;
    }

}

module.exports = {
    CreateUsers,
    UpdateUsers,
    GetUserDetails
};