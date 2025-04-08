const db = require('../Repository/db/db_methods');
const { getAvailableAgent, UpdateAgentAvailability } = require('./agent');

class AssignDeliveryAgent {
    constructor({ order_id }) { 
        if (!order_id || typeof order_id !== 'string') {
            throw new Error('order_id is required and must be a string');
        }
        this.order_id = order_id;
    }

    async #_getAvailableAgent() {
        const available_agent = await getAvailableAgent();
        if (!available_agent) {
            throw new Error('No available agent found');
        }

        const UpdateAgentAvailabilityInstance = new UpdateAgentAvailability(available_agent.agent_id, false);
        await UpdateAgentAvailabilityInstance.UpdateAgentAvailability();

        this.agent_id = available_agent.agent_id;
    }

    async #_checkOrderStatus() {
        const query = 'SELECT id AS order_prim_id, status FROM orders WHERE uniq_id = ?';
        const values = [this.order_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('Order not found');
        }

        if (result[0].status !== 'food_prepared') {
            throw new Error('Order is not in a state to assign a delivery agent');
        }


        this.order_prim_id = result[0].order_prim_id;
    }

    async #_insertDeliveryAgent() {
        const query = 'INSERT INTO order_delivery (order_id, delivery_agent_id) VALUES (?, (SELECT id FROM delivery_agents WHERE uniq_id = ?))';
        const values = [this.order_prim_id, this.agent_id];
        await db.executeQuery(query, values);

        const updateQuery = 'UPDATE orders SET status = ? WHERE uniq_id = ?';
        const updateValues = ['out_for_delivery', this.order_id];   
        await db.executeQuery(updateQuery, updateValues); 
    }

    async assign() {
        await this.#_getAvailableAgent();
        await this.#_checkOrderStatus();
        await this.#_insertDeliveryAgent();

        return {
            status: true,
            message: 'Delivery agent assigned successfully',
            order_id: this.order_id,
            agent_id: this.agent_id
        };
    }
}

class UpdateDeliveryStatus {
    constructor({ order_id, status }) {
        if (!order_id || typeof order_id !== 'string') {
            throw new Error('order_id is required and must be a string');
        }

        if (!status || typeof status !== 'string' || ['out_for_delivery', 'delivered', 'canceled'].indexOf(status) === -1) {
            throw new Error('status is required and must be one of: out_for_delivery, delivered, canceled');
        }

        this.order_id = order_id;
        this.status = status;
    }

    async #_getOrderDetails() {
        const query = 'SELECT o.id AS order_prim_id, o.status, od.delivery_agent_id AS agent_prim_id, da.uniq_id AS agent_id FROM orders o JOIN order_delivery od ON od.order_id = o.id JOIN delivery_agents da ON da.id = od.delivery_agent_id WHERE o.uniq_id = ?'; 
        const values = [this.order_id];
        const result = await db.executeQuery(query, values);

        if (result.length === 0) {
            throw new Error('Order not found');
        }

        this.order_prim_id = result[0].order_prim_id;
        this.agent_idagent_prim_id = result[0].agent_prim_id;
        this.agent_id = result[0].agent_id;
        this.order_status = result[0].status;
    }

    async #_updateDeliveredOrderStatus() { 
        const UpdateAgentAvailabilityInstance = new UpdateAgentAvailability(this.agent_id, true);

        await UpdateAgentAvailabilityInstance.UpdateAgentAvailability();
    }

    async #_cancelOrder() {
        const UpdateAgentAvailabilityInstance = new UpdateAgentAvailability(this.agent_id, true);

        await UpdateAgentAvailabilityInstance.UpdateAgentAvailability();
    }

    async #_processStatus() {
        await this.#_getOrderDetails();

        if (this.order_status !== 'out_for_delivery') {
            throw new Error('Order is not in a state to update delivery status');
        }

        if (this.status === 'delivered') {
            await this.#_updateDeliveredOrderStatus();
        } else if (this.status === 'canceled') {
            await this.#_cancelOrder();
        }
    }

    async #_updateOrderStatus() {
        const query = 'UPDATE orders SET status = ? WHERE uniq_id = ?';
        const values = [this.status, this.order_id];
        await db.executeQuery(query, values);
    }

    async update() {
        await this.#_processStatus();

        await this.#_updateOrderStatus();

        return {
            status: true,
            message: 'Delivery status updated successfully',
            order_id: this.order_id,
            status: this.status
        };
    }


}


module.exports = {
    AssignDeliveryAgent,
    UpdateDeliveryStatus,
};