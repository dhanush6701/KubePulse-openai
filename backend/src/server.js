require('dotenv').config();
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const connectDB = require('./utils/db');
const socketBroker = require('./services/websocketBroker');

const PORT = process.env.PORT || 5000;

const buildRedisClient = () => createClient({
    url: `redis://${process.env.REDIS_HOST || 'redis'}:${process.env.REDIS_PORT || 6379}`,
    socket: {
        reconnectStrategy: (retries) => Math.min(1000 * 2 ** retries, 15000)
    }
});

const pubClient = buildRedisClient();
const subClient = pubClient.duplicate();

const monitorRedisClient = (client, role) => {
    client.on('error', (err) => console.error(`Redis ${role} error:`, err.message));
    client.on('reconnecting', () => console.warn(`Redis ${role} reconnecting...`));
    client.on('end', () => console.warn(`Redis ${role} connection closed`));
};

monitorRedisClient(pubClient, 'publisher');
monitorRedisClient(subClient, 'subscriber');

const server = http.createServer(app);

const connectRedisWithRetry = async (ioInstance, attempt = 1) => {
    try {
        if (!pubClient.isOpen) {
            await pubClient.connect();
        }

        if (!subClient.isOpen) {
            await subClient.connect();
        }

        ioInstance.adapter(createAdapter(pubClient, subClient));
        console.log('Redis connected for Socket.io adapter');
    } catch (err) {
        const delay = Math.min(1000 * 2 ** (attempt - 1), 15000);
        console.error(`Redis adapter connection failed (attempt ${attempt}): ${err.message}. Retrying in ${delay}ms`);
        setTimeout(() => connectRedisWithRetry(ioInstance, attempt + 1), delay);
    }
};

const initServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Init Socket.io
        const io = new Server(server, {
            cors: {
                origin: '*', // Allow all for dev/demo simplicity
                methods: ['GET', 'POST']
            }
        });

        // Initialize WebSocket Broker
        socketBroker.init(io);

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        // Initialize Redis adapter without blocking HTTP server startup
        connectRedisWithRetry(io);
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

initServer();
