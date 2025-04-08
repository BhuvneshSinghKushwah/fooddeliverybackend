const router = require('express').Router();

const {CreateAgent, GetAgentDetails, UpdateAgentAvailability, getAvailableAgent} = require('../Services/agent');

router.post('/register', async (req, res, next) => {
    try {
        const { agent_name } = req.body;

        if (!agent_name) {
            return res.status(400).json({ message: 'agent_name is required' });
        }

        const agent = new CreateAgent({ agent_name });
        const result = await agent.CreateAgent();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/details', async (req, res, next) => {
    try {
        const { agent_id } = req.query;

        if (!agent_id) {
            return res.status(400).json({ message: 'agent_id is required' });
        }

        const agent = new GetAgentDetails(agent_id);
        const result = await agent.GetAgentDetails();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.put('/agent_availability', async (req, res, next) => {
    try {
        const { agent_id, is_available } = req.body;

        if (!agent_id || typeof is_available !== 'boolean') {
            return res.status(400).json({ message: 'agent_id and is_available are required' });
        }

        const agent = new UpdateAgentAvailability(agent_id, is_available);
        const result = await agent.UpdateAgentAvailability();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.get('/available_agents', async (req, res, next) => {
    try {
        const result = await getAvailableAgent();

        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});


module.exports = { AgentsRouter: router};