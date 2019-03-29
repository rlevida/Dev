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
        const { socket, dispatch, notes, loggedUser } = this.props;
        socket.on("FRONT_NEW_NOTE", (data) => {
            if (loggedUser.data.id !== data.createdBy) {
                dispatch({ type: "UPDATE_DATA_NOTES_LIST", list: [data] });
            }
        });
        socket.on("FRONT_COMMENT_LIST", ({ result, members }) => {
            const removedMember = _.find(members, ({ linkId }) => { return linkId == loggedUser.data.id });

            if (loggedUser.data.id !== result.usersId) {
                const conversationNotes = result.conversationNotes;
                dispatch({ type: "ADD_COMMENT_LIST", list: result });
            }

            if (typeof removedMember != "undefined" && removedMember.member_type == "new") {
                dispatch({ type: "UPDATE_DATA_NOTES_LIST", list: [result.conversationNotes] });
            }

            if (typeof removedMember != "undefined" && removedMember.member_type == "old") {
                dispatch({ type: "DELETE_NOTES", id: result.conversationNotes.id });
            }
        })
    }

    render() { return <div> </div> }
}