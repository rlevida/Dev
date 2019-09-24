import React from "react";
import { connect } from "react-redux";
import { HashRouter as Router } from "react-router-dom";
import App from "./app";
import NetworkChecker from "./internetChecker";
@connect(store => {
    return {
        user: store.loggedUser.data,
        reminder: store.reminder
    };
})
class Main extends React.Component {
    render() {
        return (
            <Router>
                <App />
            </Router>
        );
    }
}

export default NetworkChecker(Main);
