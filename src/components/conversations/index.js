import React from "react";
import { connect } from "react-redux";

import ConversationForm from "./conversationsForm";

@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    render() {
        return (
            <div>
                <ConversationForm />
            </div>
        )
    }
}