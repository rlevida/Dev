import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        loggedUser: store.loggedUser
    }
})
export default class Socket extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount() {
        var { socket, dispatch, notes } = this.props;
        socket.on("FRONT_COMMENT_LIST", (data) => {
            if (this.props.loggedUser.data.id !== data[0].users.id) {
                const dataToUpdate = this.props.notes.List.filter((e) => { return e.id == data[0].linkId });
                if (dataToUpdate.length > 0) {
                    dataToUpdate[0].comments.push(data[0]);
                    dataToUpdate[0].isSeen = 0;
                    dispatch({ type: "UPDATE_DATA_NOTES_LIST", list: dataToUpdate })
                }
            }
        })
    }

    render() { return <div> </div> }
}