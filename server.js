/**
 * Module dependencies.
 */

var http = require("http"),
    express = require("express"),
    path = require("path"),
    logger = require("morgan"),
    cookieParser = require("cookie-parser"),
    bodyParser = require("body-parser")

// global configuration
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
process.env.TZ = "Asia/Manila"; // force node to use utc timezone on staging

var config = require("./config");
var serverAuth = require("./auth");

if (process.env.ENABLE_CRON == 1) {
    require("./script/taskCompletedNotification");
    require("./script/taskDuedateNotification");
    require("./script/backup");
}

// get
var index = require("./routes");
var auth = require("./routes/auth");
var forgot = require("./routes/forgotPassword");
var createPassword = require("./routes/createPassword");
var api = require("./routes/api");

var app = express();

// auth
if (global.environment == "staging") {
    app.use(serverAuth);
}

app.set("superSecret", config.secret); // secret variable
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require("less-middleware")(path.join(__dirname, "public")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use(express.static(path.join(__dirname, "public")));

// manage token
app.use(function (req, res, next) {
    if (typeof req.cookies["app.sid"] == "undefined") {
        const TokenGenerator = require("uuid-token-generator");
        res.cookie("app.sid", new TokenGenerator(256).generate(), { httpOnly: true });
    }
    return next();
});

app.use("/api", api);
app.use("/forgotPassword", forgot);
app.use("/createPassword", createPassword);
app.use("/auth", auth);
app.use("/", index);

app.use(function (req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

if (app.get("env") === "development") {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});

if (process.env.NODE_ENV == "production") {
    var port = "8080";
    var server_ip_address = "127.0.0.1";
    app.set("port", port);
} else {
    var port = "3008";
    var server_ip_address = "127.0.0.1";
    app.set("port", port);
}

var server = http.createServer(app);

require('./serverSocket').socketIo(server);

server.listen(app.get("port"));
