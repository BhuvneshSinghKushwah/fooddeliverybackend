const db = require('../../Repository/db/db_methods');
const cron = require('node-cron');

class RestaurantAvailability {
    constructor({ restaurant_id }) {
        if (!restaurant_id && typeof restaurant_id !== 'string') {
            throw new Error('restaurant_id is required');
        }

        this.restaurant_id = restaurant_id;
    }

    async _getRestaurantDetails() {
        const query = `SELECT id FROM restaurants WHERE uniq_id = ?`;
        const resp = await db.executeQuery(query, [this.restaurant_id]);

        if (!resp || resp.length === 0) {
            throw new Error('Restaurant not found');
        }

        this.restaurant_prim_id = resp[0].id;
    }
}

class CreateRestaurantAvailablility extends RestaurantAvailability {
    constructor({ restaurant_id, availability }) {
        super({ restaurant_id });

        if(!availability || !Array.isArray(availability)) {
            throw new Error('availability is required and must be an array');
        }

        this.availability = availability;
    }


    #_validateAvailability(item) {
        if (!item.day_of_week || !item.start_hour || !item.end_hour) {
            throw new Error('day, start_hour and end_hour are required for each availability item');
        }

        if (typeof item.day_of_week !== 'string' || ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(item.day_of_week) === -1) {
            throw new Error('day_of_week must be a string and one of the valid days');
        }
        if (typeof item.start_hour !== 'number' || item.start_hour < 0 || item.start_hour > 24) {
            throw new Error('start_hour must be a number between 0 and 24');
        }
        if (typeof item.end_hour !== 'number' || item.end_hour < 0 || item.end_hour > 24 || item.end_hour <= item.start_hour) {
            throw new Error('end_hour must be a number between 0 and 24 and greater than start_hour');
        }
    }

    async #_insertAvailability() {
        const query = `
            INSERT INTO restaurant_availability 
            (restaurant_id, day_of_week, start_hour, end_hour) 
            VALUES ? 
            ON DUPLICATE KEY UPDATE 
            start_hour = VALUES(start_hour), 
            end_hour = VALUES(end_hour)
        `;
        
        const values = this.availability.map(item => {
            this.#_validateAvailability(item);
            return [
                this.restaurant_prim_id,
                item.day_of_week,
                item.start_hour,
                item.end_hour
            ];
        });
    
        await db.executeQuery(query, [values]);
    }

    async create() {
        await super._getRestaurantDetails();

        await this.#_insertAvailability();

        return { status: true, message: 'Restaurant availability created successfully' };
    }
}

class UpdateRestaurantAvailability extends RestaurantAvailability {
    constructor({ restaurant_id, availability }) {
        super({ restaurant_id });

        if (!availability?.length) {
            throw new Error('availability is required and must be a non-empty array');
        }

        this.availability = availability;
    }

    async update() {
        await this.#_getRestaurantDetails();
        const updates = this.availability.map(item => this.#_processAvailability(item));
        await Promise.all(updates);
        return { status: true, message: 'Availability updated successfully' };
    }

    async #_getRestaurantDetails() {
        const query = `SELECT r.id, ra.day_of_week FROM restaurants r JOIN restaurant_availability ra ON r.id = ra.restaurant_id WHERE r.uniq_id = ?`;
        const resp = await db.executeQuery(query, [this.restaurant_id]);

        if (!resp?.length) {
            throw new Error('Restaurant not found');
        }

        this.restaurant_prim_id = resp[0].id;
        this.existingDays = new Set(resp.map(item => item.day_of_week));
    }

    async #_processAvailability(item) {
        this.#_validateAvailability(item);
        await this.#_updateDayAvailability(item);
    }

    async #_updateDayAvailability(item) {
        const fields = [];
        const values = [];
        
        const updates = {
            start_hour: () => { fields.push('start_hour = ?'); values.push(item.start_hour); },
            end_hour: () => { fields.push('end_hour = ?'); values.push(item.end_hour); },
            is_open: () => { fields.push('is_open = ?'); values.push(item.is_open ? 1 : 0); }
        };

        Object.keys(updates).forEach(key => item[key] !== undefined && updates[key]());
        
        if (!fields.length) return;
        
        const query = `UPDATE restaurant_availability SET ${fields.join(', ')} WHERE restaurant_id = ? AND day_of_week = ?`;
        await db.executeQuery(query, [...values, this.restaurant_prim_id, item.day_of_week]);
    }

    #_validateAvailability(item) {
        if (!this.existingDays.has(item.day_of_week)) {
            throw new Error('Invalid day_of_week');
        }

        if (!['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].includes(item.day_of_week)) {
            throw new Error('Invalid day_of_week');
        }

        if (item.start_hour !== undefined && (item.start_hour < 0 || item.start_hour > 24)) {
            throw new Error('Invalid start_hour');
        }

        if (item.end_hour !== undefined) {
            if (item.end_hour < 0 || item.end_hour > 24) {
                throw new Error('Invalid end_hour');
            }
            if (item.start_hour !== undefined && item.end_hour <= item.start_hour) {
                throw new Error('end_hour must be greater than start_hour');
            }
        }

        if (item.is_open !== undefined && typeof item.is_open !== 'boolean') {
            throw new Error('Invalid is_open');
        }
    }
}

class DeleteRestaurantAvailability extends RestaurantAvailability {
    constructor({ restaurant_id, days }) {
        super({ restaurant_id });

        if (!Array.isArray(days) || days.length === 0) {
            throw new Error('days must be a non-empty array of day_of_week');
        }

        this.days = days;
    }

    async delete() {
        await super._getRestaurantDetails();

        const query = `
            DELETE FROM restaurant_availability
            WHERE restaurant_id = ? AND day_of_week = ?
        `;

        for (const day of this.days) {
            if (typeof day !== 'string' || !['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].includes(day)) {
                throw new Error('Invalid day in delete list');
            }

            await db.executeQuery(query, [this.restaurant_prim_id, day]);
        }

        return { status: true, message: 'Availability entries deleted successfully' };
    }
}

class GetRestaurantAvailability  {
    async getOpenRestaurants() {

        const day_of_week = new Date().toLocaleString('en-US', { weekday: 'short' });

        const query = `
            SELECT r.uniq_id AS restaurant_id, r.restaurant_name, ra.start_hour, ra.end_hour, ra.is_open
            FROM restaurant_availability ra JOIN restaurants r ON ra.restaurant_id = r.id
            WHERE ra.is_open = '1' AND ra.day_of_week = ? 
        `;

        const openRestaurants = await db.executeQuery(query, [day_of_week]);

        return { status: true, message: 'Open restaurants fetched successfully', openRestaurants };
    }

    async get(restaurant_id) {

        const query = `
            SELECT day_of_week, start_hour, end_hour
            FROM restaurant_availability
            WHERE restaurant_id = (select id from restaurants where uniq_id = ?)
        `;

        const availability = await db.executeQuery(query, [restaurant_id]);

        if(!availability || availability.length === 0) {
            throw new Error('No availability found for this restaurant');
        }

        return { status: true, message: 'Availability fetched successfully', availability };
    }
}

async function updateRestaurantOpenStatus() {
    const now = new Date();
    const day = now.toLocaleString('en-US', { weekday: 'short' });
    const currentHour = now.getHours();

    const query = `
        UPDATE restaurant_availability
        SET is_open = CASE
            WHEN start_hour <= ? AND end_hour > ? THEN 1
            ELSE 0
        END
        WHERE day_of_week = ?
    `;

    await db.executeQuery(query, [currentHour, currentHour, day]);
}

function startAvailabilityCron() {
    cron.schedule('0 * * * *', async () => {
        try {
            await updateRestaurantOpenStatus();
        } catch (err) {
            console.error('Error running availability cron:', err);
        }
    });
}

async function toggleOpenStatus(restaurant_id, is_open, day_of_week = null) {
    if (!restaurant_id || typeof restaurant_id !== 'string') {
        throw new Error('restaurant_id is required and must be a string');
    }
    if (typeof is_open !== 'boolean') {
        throw new Error('is_open must be a boolean');
    }

    if(day_of_week && typeof day_of_week !== 'string') {
        throw new Error('day_of_week must be a string');
    }

    if(day_of_week && ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(day_of_week) === -1) {
        throw new Error('day_of_week must be one of the valid days');
    }

    day_of_week = day_of_week ?? new Date().toLocaleString('en-US', { weekday: 'short' });

    const query = `
        UPDATE restaurant_availability
        SET is_open = ?
        WHERE restaurant_id = (SELECT id FROM restaurants WHERE uniq_id = ?) AND day_of_week = ?
    `;

    const resp = await db.executeQuery(query, [is_open ? '1' : '0', restaurant_id, day_of_week]);

    if(!resp || resp.affectedRows === 0) {
        throw new Error('No availability found for this restaurant');
    }
    return { status: true, message: 'Restaurant open status updated successfully' };
}

module.exports = {
    CreateRestaurantAvailablility,
    UpdateRestaurantAvailability,
    DeleteRestaurantAvailability,
    GetRestaurantAvailability,
    startAvailabilityCron,
    toggleOpenStatus
}
