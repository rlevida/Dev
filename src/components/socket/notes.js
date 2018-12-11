import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch } = this.props;

        socket.on("FRONT_NOTES_LIST", (data) => {
            dispatch({ type: "UPDATE_DATA_NOTES_LIST", List: data })
        })
    }

    render() { return <div> </div> }
}