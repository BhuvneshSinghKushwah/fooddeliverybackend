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

const {startAvailabilityCron} = require('./Services/Restaurants/availability');
startAvailabilityCron();

const { AvailabilityRouter } = require('./Routers/availability');
app.use('/v1/api/availability', AvailabilityRouter);

const { MenuRouter } = require('./Routers/menu');
app.use('/v1/api/menu', MenuRouter);

const { RestaurantRouter }  = require('./Routers/restaurant');
app.use('/v1/api/restaurants', RestaurantRouter);

app.get('/v1/status', (req, res) => {
    res.send('Restaurant Server is running!');
});

app.get('/', (req, res) => {
    res.send('Restaurant Server is running!');
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
    console.log(`Restaurant Server running on port ${PORT}`);
});
