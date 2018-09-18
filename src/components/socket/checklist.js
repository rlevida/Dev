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

        socket.on("FRONT_SAVE_OR_UPDATE_CHECK_LIST", (data) => {
            dispatch({ type: "ADD_CHECKLIST", data: data })
        })

        // socket.on("FRONT_MEMBERS_SELECTED", (data) => {
        //     dispatch({ type: "SET_MEMBERS_SELECTED", Selected: data })
        //     dispatch({ type: "SET_MEMBERS_FORM_ACTIVE", FormActive: "Form" })
        // })

        // socket.on("FRONT_MEMBERS_ADD", (data) => {
        //     if (data.type == "workstream") {
        //         dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
        //         dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
        //         showToast("success", "Successfully updated.")

        //     } else {
        //         dispatch({ type: "SET_MEMBERS_LIST", list: [...this.props.members.List, data.data[0]] })
        //         dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} })
        //         dispatch({ type: "SET_MEMBERS_FORM_ACTIVE", FormActive: "List" });
        //     }
        // })

        // socket.on("FRONT_MEMBERS_EDIT", (data) => {
        //     dispatch({ type: "UPDATE_DATA_MEMBERS_LIST", UpdatedData: data, List: this.props.members.List })
        //     dispatch({ type: "SET_MEMBERS_SELECTED", Selected: {} })
        //     dispatch({ type: "SET_MEMBERS_FORM_ACTIVE", FormActive: "List" })
        // })

        // socket.on("FRONT_MEMBERS_DELETED", (data) => {
        //     if (data.type == "workstream") {
        //         dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
        //         dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" });
        //         showToast("success", "Successfully updated.")
        //     } else {
        //         dispatch({ type: "REMOVE_DELETED_MEMBERS_LIST", id: data.id })
        //         showToast("success", "Member already deleted.")
        //     }
        // })

        // socket.on("FRONT_MEMBERS_ACTIVE", (data) => {
        //     dispatch({ type: "SET_MEMBERS_STATUS", record: data })
        // })
    }

    render() { return <div> </div> }
}