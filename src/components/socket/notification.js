import React from "react";

import { connect } from "react-redux";
import _ from "lodash";
import { showToast, notificationType } from "../../globalFunction";
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        notification: store.notification
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            list: []
        }
    }

    componentWillMount() {
        const { socket, dispatch, loggedUser, notification } = { ...this.props };
        socket.on("FRONT_NOTIFICATION", (data) => {
            if (data.usersId === loggedUser.data.id) {
                const newList = [...this.state.list, data]
                showToast("info", `<span style="font-weight: bolder">${data.from.firstName} ${data.from.lastName}</span> ${notificationType(data.type)}`);
                dispatch({ type: "SET_NOTIFICATION_LIST", list: _.orderBy(newList, ["dateAdded"], ["desc"]) })
            }

        })
    }

    componentWillReceiveProps(prevProps) {
        this.setState({ list: prevProps.notification.List })
    }

    render() { return <div> </div> }
}