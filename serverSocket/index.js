module.exports = function (io) {
    io.on("connection", (socket) => {
        console.log("connected to socket.");
    });
    io.on('reconnect_attempt', (socket) => {
        socket.io.opts.transports = ['polling', 'websocket'];
    })
};