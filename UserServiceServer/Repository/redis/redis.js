require('dotenv').config();
const redis = require('redis');

class RedisClient {
    constructor() {
        if (!RedisClient.instance) {
            this.client = redis.createClient({
                socket: {
                    host: process.env.REDIS_HOST,
                    port: process.env.REDIS_PORT
                }
            });

            this.client.on('connect', () => console.log('Connected to Redis'));
            this.client.on('error', (err) => console.error(`Redis Error: ${err.message}`));

            this.client.connect();
            RedisClient.instance = this;
        }
        return RedisClient.instance;
    }

    getClient() {
        return this.client;
    }

    async set(key, value, expiry = 0) {
        if (expiry > 0) {
            await this.client.set(key, value, { EX: expiry });
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key) {
        return await this.client.get(key);
    }

    async del(key) {
        return await this.client.del(key);
    }

    async exists(key) {
        const result = await this.client.exists(key);
        return result === 1;
    }

    async close() {
        await this.client.quit();
    }
}

module.exports = new RedisClient();
