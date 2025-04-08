require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
}));

const { DeliveryRouter } = require('./Routers/delivery');
app.use('/d1/api/delivery', DeliveryRouter);

const { AgentsRouter } = require('./Routers/agents');
app.use('/d1/api/agent', AgentsRouter);


app.get('/d1/status', (req, res) => {
    res.send('Delivery Server is running!');
});

app.get('/', (req, res) => {
    res.send('Delivery Server is running!');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Delivery Server running on port ${PORT}`);
});
