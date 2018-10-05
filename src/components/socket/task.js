import React from "react"
import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch, task } = this.props;

        socket.on("FRONT_TASK_LIST", (data) => {
            if (data.type == "workstream") {
                dispatch({ type: "SET_TASK_LIST", list: data.data })
            } else {
                dispatch({ type: "SET_TASK_LIST", list: data.data })
            }
        })

        socket.on("FRONT_ALL_TASK_COUNT_LIST", (data) => {
            dispatch({ type: "SET_ALL_TASK_COUNT_LIST", list: data })
        })

        socket.on("FRONT_TASK_COUNT_LIST", (data) => {
            dispatch({ type: "SET_TASK_COUNT_LIST", list: data })
        })

        socket.on("FRONT_TASK_SELECTED", (data) => {
            dispatch({ type: "SET_TASK_SELECTED", Selected: data })
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })
        })

        socket.on("FRONT_TASK_ADD", (data) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", data: data })
            dispatch({ type: "SET_TASK_SELECTED", Selected: data.data[0] })
        })

        socket.on("FRONT_TASK_EDIT", (data) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", data: data });
        })

        socket.on("FRONT_TASK_DELETED", (data) => {
            dispatch({ type: "REMOVE_DELETED_TASK_LIST", id: data.id, List: this.props.task.List })
            showToast("success", "Task already deleted.")
        })

        socket.on("FRONT_TASK_ACTIVE", (data) => {
            dispatch({ type: "SET_TASK_STATUS", record: data })
        })

        socket.on("FRONT_ADD_TASK_DEPENDENCY", (data) => {
            dispatch({ type: "UPDATE_TASK_STATUS", data });
            showToast("success", "Task dependency added.")
        })
    }

    render() { return <div> </div> }
}