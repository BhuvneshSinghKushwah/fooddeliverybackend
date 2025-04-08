const db = require('../Repository/db/db_methods');
const crypto = require('crypto');

class Agent {
    constructor(agent_id) {
        if (!agent_id || typeof agent_id !== 'string') {
            throw new Error('agent_id is required and must be a string');
        }

        this.agent_id = agent_id;
    }

    async #_getAgentDetails() {
        const query = 'SELECT id, agent_name FROM delivery_agents WHERE uniq_id = ?';
        const values = [this.agent_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('Agent not found');
        }
        return result[0];
    }
}

class CreateAgent {
    constructor({ agent_name }) {

        if (!agent_name || typeof agent_name !== 'string') {
            throw new Error('agent_name is required and must be a string');
        }

        this.agent_name = agent_name;
    }

    async #_generateUniqId() {
        const uniq_id = `AGT${crypto.randomBytes(15).toString('hex').slice(0, 17)}`;
        const check = await db.executeQuery('SELECT id FROM delivery_agents WHERE uniq_id = ?', [uniq_id]);
        if (check.length > 0) {
            return this.#_generateUniqId();
        }
        return uniq_id;
    }

    async #_createAgent() {
        this.agent_id = await this.#_generateUniqId();

        const query = 'INSERT INTO delivery_agents (uniq_id, agent_name) VALUES (?, ?)';
        const values = [this.agent_id, this.agent_name];
        await db.executeQuery(query, values);
        return { status: true, agent_id: this.agent_id};
    }

    async CreateAgent(){
        try {
            const result = await this.#_createAgent();
            return result;
        } catch (error) {
            throw new Error(`Error creating agent: ${error.message}`);
        }
    }
}

class UpdateAgentAvailability extends Agent {
    constructor(agent_id, is_available) {
        super(agent_id);

        if (typeof is_available !== 'boolean') {
            throw new Error('is_available must be a boolean');
        }

        this.is_available = (is_available) ? '1' : '0';
    }

    async #_updateAvailability() {
        const query = 'UPDATE delivery_agents SET is_available = ? WHERE uniq_id = ?';
        const values = [this.is_available, this.agent_id];
        await db.executeQuery(query, values);
    }

    async UpdateAgentAvailability() {
        try {
            await this.#_updateAvailability();
            return { status: true };
        } catch (error) {
            throw new Error(`Error updating agent is_available: ${error.message}`);
        }
    }
}

class GetAgentDetails extends Agent {
    constructor(agent_id) {
        super(agent_id);
    }

    async #_getAgentDetails() {
        const query = 'SELECT id, agent_name, is_available FROM delivery_agents WHERE uniq_id = ?';
        const values = [this.agent_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('Agent not found');
        }
        return result[0];
    }

    async GetAgentDetails() {
        try {
            const agentDetails = await this.#_getAgentDetails();
            return agentDetails;
        } catch (error) {
            throw new Error(`Error getting agent details: ${error.message}`);
        }
    }
}

async function getAvailableAgent() {
    const query = "SELECT uniq_id AS agent_id, agent_name FROM delivery_agents WHERE is_available = '1' LIMIT 1 ";
    const result = await db.executeQuery(query);
    return result[0];
}

module.exports = {
    CreateAgent,
    UpdateAgentAvailability,
    getAvailableAgent,
    GetAgentDetails,
};