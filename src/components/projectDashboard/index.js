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
        projectData: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
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
            <div class="row">
                <div class="col-md-8">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-lg-6 col-xs-6">
                                <h4 style={{ marginLeft: '-15px' }}>Documents</h4>
                            </div>
                            <div class="col-lg-6 col-xs-6 mt10" style={{ textAlign: 'right' }}>
                                <a style={{ left: '0' }} href={`/project/${project}/documents`}>+ More</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <DocumentStatus />
                </div>
            </div>
            <div class="row">
                <div class="col-md-8">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-lg-6 col-xs-6">
                                <h4 style={{ marginLeft: '-15px' }}>Conversations</h4>
                            </div>
                            <div class="col-lg-6 col-xs-6 mt10" style={{ textAlign: 'right' }}>
                                <a style={{ left: '0' }} href={`/project/${project}/conversations`}>+ More</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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