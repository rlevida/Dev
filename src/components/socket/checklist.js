import React from "react";

import { showToast } from '../../globalFunction';
import { connect } from "react-redux";

@connect((store) => {
    return {
        socket: store.socket.container,
        checkList: store.checkList
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch } = this.props;

        socket.on("FRONT_SAVE_CHECK_LIST", (data) => {
            dispatch({ type: "ADD_CHECKLIST", data });
            dispatch({ type: "SET_CHECKLIST_ACTION" , action : undefined})
            showToast("success", "Checklist added.");
        });

        socket.on("FRONT_UPDATE_CHECK_LIST", (data) => {
            dispatch({ type: "SET_CHECKLIST_SELECTED" , Selected : {}})
            dispatch({ type: "UPDATE_CHECKLIST", data });
            dispatch({ type: "SET_CHECKLIST_ACTION" , action : undefined})

            showToast("success", "Checklist already updated.");
        });

        socket.on("FRONT_CHECK_LIST", (data) => {
            dispatch({ type: "SET_CHECKLIST", list: data })
        });

        socket.on("FRONT_CHECKLIST_DELETED", (data) => {
            dispatch({ type: "DELETE_CHECKLIST", data })
            showToast("success", "Checklist already deleted.")
        });
    }

    render() { return <div> </div> }
}