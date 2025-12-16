const mongoose = require('mongoose');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async () => {
    let attempt = 0;
    while (true) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            attempt += 1;
            const delay = Math.min(1000 * 2 ** (attempt - 1), 30000);
            console.error(`MongoDB connection attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms`);
            await sleep(delay);
        }
    }
};

module.exports = connectDB;
