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
        const { match = "", dispatch, notes, workstream_id = "", project_id, history } = { ...this.props };
        const projectId = (match != "") ? match.params.projectId : project_id;
        return (
            <div class={(workstream_id == "") ? "card" : ""}>
                <div class={`mb20 ${(workstream_id == "") ? "bb" : ""}`}>
                    <div class={`mb20 ${(workstream_id == "") ? "container-fluid mb20" : ""}`}>
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-12">
                                {
                                    (workstream_id != "") && <div class="card-header">
                                        <h4 class="title m0">Messages</h4>
                                    </div>
                                }
                                {
                                    (workstream_id == "") && <h3 class="title m0">Messages</h3>
                                }
                            </div>
                            <div class="col-md-6 col-sm-12 col-xs-12" >
                                {
                                    (typeof notes.Selected.id != "undefined" && notes.Selected.id != "") && <div class="button-action">
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
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row content-row row-eq-height">
                    <div class="col-md-4 col-sm-12">
                        <ConversationList projectId={projectId} workstreamId={workstream_id} />
                    </div>
                    <div class="col-md-8 col-sm-12">
                        <ConversationForm projectId={projectId} workstreamId={workstream_id} />
                    </div>
                </div>
            </div>
        )
    }
}