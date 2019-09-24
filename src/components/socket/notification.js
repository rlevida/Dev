import React from "react";

import { connect } from "react-redux";
import _ from "lodash";
import { showToast, notificationType } from "../../globalFunction";
@connect(store => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        notification: store.notification
    };
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            list: [],
            notificationCount: 0,
            notificationBellIsOpen: false
        };
    }

    componentWillMount() {
        const { socket, dispatch, loggedUser, notification } = { ...this.props };
        socket.on("FRONT_NOTIFICATION", data => {
            const { notificationBellIsOpen, notificationCount } = { ...this.state };
            if (data.usersId === loggedUser.data.id) {
                showToast("info", `<span style="font-weight: bolder">${data.from.firstName} ${data.from.lastName}</span> ${notificationType(data.type)}`, undefined, true);
                if (notificationBellIsOpen) {
                    dispatch({ type: "SET_NOTIFICATION_LIST", list: [data] });
                }
                dispatch({ type: "SET_NOTIFICATION_COUNT", Count: notificationCount + 1 });
            }
        });
    }

    componentWillReceiveProps(prevProps) {
        this.setState({ list: prevProps.notification.List, notificationCount: prevProps.notification.NotificationCount, notificationBellIsOpen: prevProps.notification.NotificationBellIsOpen });
    }

    render() {
        return <div> </div>;
    }
}
