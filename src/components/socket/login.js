import React from "react";

import { connect } from "react-redux";
import { showToast, deleteData } from "../../globalFunction";
@connect(store => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
    };
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillMount() {
        const { socket, loggedUser } = { ...this.props };
        socket.on("FRONT_LOGIN", data => {
            if (loggedUser.data.id && loggedUser.data.id === data.id) {
                deleteData(`/api/login/${loggedUser.data.id}`, {}, () => {
                    showToast("warning", "Someone logged your account.");
                    setTimeout(function () {
                        window.location.replace("/");
                    }, 300);
                });
            }
        });
    }
    render() {
        return <div> </div>;
    }
}
