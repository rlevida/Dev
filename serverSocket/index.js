module.exports = function (io) {
    io.sockets.on("connection", (socket) => {
        console.log("connected to socket.");
    });
};