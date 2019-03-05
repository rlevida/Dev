switch (page) {
    case "auth":
        require('./container/auth');
        break;
    case "account":
        require('./container/home');
        break;
}
