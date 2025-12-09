let io;

const init = (socketIoInstance) => {
    io = socketIoInstance;

    io.of('/chat').on('connection', (socket) => {
        console.log('User connected to chat:', socket.id);

        socket.on('join_room', async (room) => {
            socket.join(room);
            // Send last 50 messages
            try {
                const Message = require('../models/message.model');
                const messages = await Message.find({ room }).sort({ timestamp: -1 }).limit(50);
                socket.emit('history', messages.reverse());
            } catch (err) {
                console.error('Error fetching history:', err);
            }
        });

        socket.on('send_message', async (data) => {
            try {
                const Message = require('../models/message.model');
                const msg = await Message.create({
                    userId: data.userId,
                    username: data.username,
                    text: data.text,
                    room: data.room || 'general',
                    timestamp: new Date()
                });

                // Broadcast to room
                io.of('/chat').to(data.room || 'general').emit('message', {
                    id: msg._id,
                    userId: msg.userId,
                    username: msg.username,
                    text: msg.text,
                    timestamp: msg.timestamp,
                    room: msg.room
                });
            } catch (err) {
                console.error('Error saving message:', err);
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected from chat');
        });
    });

    io.of('/logs').on('connection', (socket) => {
        console.log('Client connected to logs:', socket.id);

        socket.on('join_log_room', (room) => {
            // room format: pod:<namespace>:<podname>
            socket.join(room);
            console.log(`Socket ${socket.id} joined ${room}`);
        });

        socket.on('leave_log_room', (room) => {
            socket.leave(room);
        });
    });
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    init,
    getIO
};
