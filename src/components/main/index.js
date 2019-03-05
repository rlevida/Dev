import React from "react";
import { connect } from "react-redux";
import { HashRouter as Router } from 'react-router-dom';
import App from "./app";

@connect((store) => {
    return {
        user: store.loggedUser.data,
        reminder: store.reminder
    }
})
export default class Main extends React.Component {
    render() {
        return (
            <Router>
                <App/>
            </Router>
        )
    }
}