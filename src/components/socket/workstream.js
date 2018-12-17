import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch } = this.props;

        socket.on("FRONT_WORKSTREAM_LIST", (data) => {
            dispatch({ type: "SET_WORKSTREAM_LIST", list: data })
        })

        socket.on("FRONT_WORKSTREAM_COUNT_LIST",(data) => {
            dispatch({type:"SET_WORKSTREAM_COUNT_LIST",list : data})
        })

        socket.on("FRONT_WORKSTREAM_SELECTED", (data) => {
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: data })
            dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })
        })

        socket.on("FRONT_WORKSTREAM_ADD", (data) => {
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} })
            dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" })
        })

        socket.on("FRONT_WORKSTREAM_EDIT", (data) => {
            dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", UpdatedData: data, List: this.props.workstream.List })
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} })
            dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" })
        })

        socket.on("FRONT_WORKSTREAM_DELETED", (data) => {
            dispatch({ type: "REMOVE_DELETED_WORKSTREAM_LIST", id: data.id, List: this.props.workstream.List })
            showToast("success", "Workstream already deleted.")
        })

        socket.on("FRONT_WORKSTREAM_ACTIVE", (data) => {
            dispatch({ type: "SET_WORKSTREAM_STATUS", record: data })
        })
    }

    render() { return <div> </div> }
}