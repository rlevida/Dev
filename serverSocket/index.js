var socketIo = exports.socketIo = function (server) {
    const io = require('socket.io').listen(server, {
        pingInterval: 10000,
        pingTimeout: 5000
    });
    const cookieIoParser = require('socket.io-cookie-parser');

    io.use(cookieIoParser());
    io.on('connect', (socket) => {
        socket.on('TEST', function (data) {
            socket.emit("test", { test: "pass server socket" })
        });

        socket.use((packet, next) => {
            if (
                packet.find((c) => { return "SEND_FORGOT_PASSWORD" == c }) != undefined
                || packet.find((c) => { return "COMPLETE_FORGOT_PASSWORD" == c }) != undefined
                || packet.find((c) => { return "USER_LOGGED_IN" == c }) != undefined
                || packet.find((c) => { return "IS_USER_LOGGED_IN" == c }) != undefined

            ) {
                return next();
            } else if (packet.find((c) => { return "LOGOUT" == c }) != undefined) {
                socket.handshake.query.Token = (typeof socket.request.cookies["app.sid"] != "undefined")
                    ? socket.request.cookies["app.sid"]
                    : packet[1].Token;
                next()
            } else {
                let session = global.initModel("session");
                if ((typeof packet[1] != "undefined" && typeof packet[1].Token != "undefined")) {
                    session.getData("session", { session: packet[1].Token }, {}, (ret) => {
                        if (ret.status && ret.data.length > 0) {
                            socket.handshake.query.Token = packet[1].Token;
                            socket.handshake.query.UserId = ret.data[0].usersId;
                            socket.handshake.query.LastLoggedIn = ret.data[0].dateUpdated;
                            next()
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Access denied. You need to login to proceed." });
                            socket.emit("AUTHENTICATION_FAIL", { message: "Access denied. You need to login to proceed." });

                            if (packet.find((c) => { return "LOGGED_USER" == c }) != undefined) {
                                socket.emit("RETURN_LOGGED_USER", { data: {}, status: false })
                            }
                        }
                    })
                } else if (typeof socket.request.cookies["app.sid"] != "undefined") {
                    session.getData("session", { session: socket.request.cookies["app.sid"] }, {}, (ret) => {
                        if (ret.data.length > 0) {
                            // packet[0].Token = socket.request.cookies["app.sid"];
                            // packet[0].UserId = ret.data[0].userid;
                            // packet[0].LastLoggedIn = ret.data[0].dateUpdated;
                            socket.handshake.query.Token = socket.request.cookies["app.sid"];
                            socket.handshake.query.UserId = ret.data[0].usersId;
                            socket.handshake.query.LastLoggedIn = ret.data[0].dateUpdated;
                            next()
                        } else {
                            socket.emit("RETURN_ERROR_MESSAGE", { message: "Access denied. You need to login to proceed." });
                            socket.emit("AUTHENTICATION_FAIL", { message: "Access denied. You need to login to proceed." });

                            if (packet.find((c) => { return "LOGGED_USER" == c }) != undefined) {
                                socket.emit("RETURN_LOGGED_USER", { data: {}, status: false })
                            }
                        }
                    })
                } else {
                    socket.emit("RETURN_ERROR_MESSAGE", { message: "Access denied. You need to login to proceed." });
                    socket.emit("AUTHENTICATION_FAIL", { message: "Access denied. You need to login to proceed." });
                }
            }
        })

        require("./global").init(socket);
        require("./login").init(socket);
        require("./user").init(socket);
        require("./company").init(socket);
        require("./project").init(socket);
        require("./status").init(socket);
        require("./type").init(socket);
        require("./role").init(socket);
        require("./teams").init(socket);
        require("./workstream").init(socket);
        require("./member").init(socket);
        require("./document").init(socket);
        require("./task").init(socket);
        require("./conversation").init(socket);
        require("./starred").init(socket);
        require("./folder").init(socket);
        require("./reminder").init(socket);
        require("./usersTeam").init(socket);
    });
}