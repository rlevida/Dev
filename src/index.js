switch (page) {
    case "auth":
        require('./container/auth');
        break;
    case "account":
        require('./container/home');
        break;
    case "projectNotAvailable":
        require('./container/projectNotAvailable')
        break;
}