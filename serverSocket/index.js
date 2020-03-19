exports.socketIo = (server) => {
    const io = require('socket.io').listen(server, {
        pingInterval: 10000,
        pingTimeout: 5000,
    });
    const cookieIoParser = require('socket.io-cookie-parser');

    io.use(cookieIoParser());
    io.on('connect', (socketParam) => {
        const socket = socketParam;

        socket.on('FRONT_LOGIN_BROADCAST', (data) => {
            socket.broadcast.emit('FRONT_LOGIN', {
                ...data.userDetails
            })
        });

        socket.on('FRONT_BROADCAST_NEW_NOTE', (data) => {
            console.log(`$$$$$$$$$$$$$ YEAH OUT IT GOES!!!!!!!!!!!`);
            socket.broadcast.emit('FRONT_NEW_NOTE', { ...data })
        });

        socket.on('FRONT_BROADCAST_COMMENT_LIST', (data) => {
            socket.broadcast.emit('FRONT_COMMENT_LIST', { ...data })
        });

        socket.on('FRONT_BROADCAST_NOTIFICATION', (data) => {
            socket.broadcast.emit('FRONT_NOTIFICATION', { ...data })
        });

    });
    return io;
};
