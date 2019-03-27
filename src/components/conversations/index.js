import React from "react";
import { connect } from "react-redux";

import ConversationForm from "./conversationsForm";
import ConversationList from "./conversationList";

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
        const { match } = { ...this.props };
        const projectId = match.params.projectId;

        return (
            <div class="card">
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-12">
                                <h3 class="title m0">Messages</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row content-row row-eq-height">
                    <div class="col-md-4 col-sm-12">
                        <ConversationList projectId={projectId}/>
                    </div>
                    <div class="col-md-8 col-sm-12">
                        <ConversationForm projectId={projectId} />
                    </div>
                </div>
            </div>
        )
    }
}