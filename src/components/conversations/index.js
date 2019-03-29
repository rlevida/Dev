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
    componentWillUnmount() {
        const { dispatch } = this.props;

        dispatch({ type: "SET_COMMENT_LIST", list: [] });
        dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_NOTES_LIST", list: [] });
        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_NOTES_SELECTED", Selected: {} });
    }
    render() {
        const { match, dispatch } = { ...this.props };
        const projectId = match.params.projectId;

        return (
            <div class="card">
                <div class="mb20 bb">
                    <div class="container-fluid filter mb20">
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-12">
                                <h3 class="title m0">Messages</h3>
                            </div>
                            <div class="col-md-6 col-sm-12 col-xs-12 pd0" >
                                <div class="button-action">
                                    <a class="btn btn-default"
                                        onClick={(e) => {
                                            dispatch({ type: "SET_NOTES_SELECTED", Selected: {} });
                                            dispatch({ type: "SET_COMMENT_LIST", list: [], count: {} });
                                        }}
                                    >
                                        <span>
                                            <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                            New Message
                                         </span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row content-row row-eq-height">
                    <div class="col-md-4 col-sm-12">
                        <ConversationList projectId={projectId} />
                    </div>
                    <div class="col-md-8 col-sm-12">
                        <ConversationForm projectId={projectId} />
                    </div>
                </div>
            </div>
        )
    }
}