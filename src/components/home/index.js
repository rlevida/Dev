import React from "react";
import ReactDOM from "react-dom";

import Header from "../partial/header";

import ProjectStatus from "../project/projectStatus"
import TaskStatus from "../allTask/taskStatus";

export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: page
        }
    }

    render() {
        var Component = <div id="content">
            <div class="row pdl20 pdr20">
                <div class="col-md-12 mb20">
                    <h4>Project</h4>
                    <ProjectStatus style={{}} />
                </div>
                <div class="col-md-12">
                    <h4>My Tasks</h4>
                    <TaskStatus style={{}} />
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}