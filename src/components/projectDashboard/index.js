import React from "react";
import Header from "../partial/header";
import WorkstreamStatus from "../workstream/workstreamStatus";
import TaskStatus from "../task/taskStatus";
import DocumentStatus from "../document/documentStatus";
import NotesStatus from "./noteStatus";
import Task from "./task";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(props) {
        const { socket } = { ...this.props };
        const url = window.location.pathname;
        const urlsplit = url.split("/");
        const projectId = urlsplit[urlsplit.length - 1];
        socket.emit("GET_PROJECT_DETAIL", { id: projectId });
    }

    render() {
        const { projectData } = this.props
        const Component = <div class="pd20">
            <h3 class="mt0 mb20"><a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{projectData.Selected.project}</a></h3>
            <h4 class="mb10">Workstreams</h4>
            <div class="row">
                <div class="col-md-8">
                    <WorkstreamStatus />
                </div>
            </div>
            <h4 class="mb10">Tasks</h4>
            <div class="row">
                <div class="col-md-8">
                    <TaskStatus />
                </div>
            </div>
            <h4 class="mt20 mb20">My Tasks</h4>
            <Task />
            <h4 class="mt20 mb20">Documents</h4>
            <div class="row">
                <div class="col-md-8">
                    <DocumentStatus />
                </div>
            </div>
            <h4 class="mt20 mb20">Conversation</h4>
            <div class="row">
                <div class="col-md-8">
                    <NotesStatus />
                </div>
            </div>
        </div>;

        return (
            <Header component={Component} page={"Project Dashboard"} />
        );
    }
}