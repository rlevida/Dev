switch (page) {
    case "auth":
        require('./container/auth');
        break;
    case "account":
        require('./container/home');
        break;
    case "notAvailable":
        require('./container/notAvailable')
        break;
    case "forgotPassword":
        require('./container/resetPassword');
        break;
    case "createPassword":
        require('./container/createPassword');
        break;
    case 'activationExpired':
        require('./container/activationExpired');
        break;
}