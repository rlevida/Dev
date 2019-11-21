import React from "react";
import { connect } from "react-redux";
import { getData } from "../../globalFunction";
import Mark from "mark.js";
import ConversationForm from "./conversationsForm";
import ConversationList from "./conversationList";
let keyTimer = "";

@connect(store => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        projectData: store.project,
        loggedUser: store.loggedUser,
        conversation: store.conversation
    };
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
        _.map(["handleChange"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_COMMENT_LIST", list: [] });
        dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_NOTES_LIST", list: [] });
        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_NOTES_SELECTED", Selected: {} });
    }

    componentWillUnmount(){
        window.stop();
    }

    handleChange(e) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_COMMENT_LIST", list: [] });
        dispatch({ type: "SET_COMMENT_LOADING", Loading: "RETRIEVING" });

        dispatch({
            type: "SET_COMMENT_FILTER",
            filter: {
                search: e.target.value
            }
        });
    }

    componentDidUpdate(prevProps) {
        const { conversation, notes, dispatch } = { ...this.props };

        if (_.isEqual(prevProps.conversation.Filter, conversation.Filter) == false) {
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                const { search } = { ...conversation.Filter };
                let requestUrl = `/api/conversation/getConversationList?page=1&linkType=notes&linkId=${notes.Selected.id}`;
                if (search) {
                    requestUrl += `&search=${search}`;
                }
                getData(requestUrl, {}, c => {
                    dispatch({ type: "SET_COMMENT_LIST", list: c.data.result, count: c.data.count });
                    dispatch({ type: "SET_COMMENT_LOADING", Loading: "" });
                    if (conversation.Filter.search) {
                        this.highlight(conversation.Filter.search);
                    }
                });
            }, 1500);
        }
    }

    highlight(text) {
        var instance = new Mark(document.querySelector("#message-thread"));
        instance.mark(text, {
            accuracy: {
                value: "partially",
                limiters: [".", ",", "!"]
            },
            background: "orange"
        });
    }

    render() {
        const { match = "", dispatch, notes, workstream_id = "", project_id } = { ...this.props };
        const { Filter } = { ...notes };
        const projectId = match != "" ? match.params.projectId : project_id;
        return (
            <div class={workstream_id == "" ? "card" : ""}>
                <div class={`mb20 ${workstream_id == "" ? "bb" : ""}`}>
                    <div class={`mb20 ${workstream_id == "" ? "container-fluid mb20" : ""}`}>
                        <div class="row content-row">
                            <div class="col-md-6 col-sm-12 pd0">
                                {workstream_id != "" && (
                                    <div class="card-header">
                                        <h4 class="title m0">Messages</h4>
                                    </div>
                                )}
                                {workstream_id == "" && <h3 class="title m0">Messages</h3>}
                            </div>
                            {typeof notes.Selected.id != "undefined" && notes.Selected.id != "" && (
                                <div class="col-md-6 col-sm-12 col-xs-12 pd0">
                                    {/* <div class="mb20 display-flex"> */}
                                    {/* <input
                                            type="text"
                                            name="note"
                                            class="form-control"
                                            placeholder="Search note"
                                            onChange={this.handleChange}
                                        />
                                        {
                                            (typeof Filter.title != "undefined" && Filter.title != "") && <a
                                                class="logo-action text-grey"
                                                onClick={this.clearSearch}
                                            >
                                                <i class="fa fa-times-circle-o ml5" aria-hidden="true"></i>
                                            </a>
                                        } */}
                                    <a
                                        class="btn btn-default ml10 pull-right"
                                        onClick={e => {
                                            dispatch({ type: "SET_NOTES_SELECTED", Selected: {} });
                                            dispatch({ type: "SET_COMMENT_LIST", list: [], count: {} });
                                        }}
                                    >
                                        <span>
                                            <i class="fa fa-plus mr10" aria-hidden="true" />
                                            New Message
                                        </span>
                                    </a>
                                    {/* </div> */}
                                </div>
                            )}
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
        );
    }
}
