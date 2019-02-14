import React from "react";
import Header from "../partial/header";
import TaskStatus from "../allTask/taskStatus";
import ProjectSummary from "../project/projectSummary";

export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        var Component = <div>
            <div class="row">
                <div class="col-lg-6">
                    <div class="card mb20">
                        <div class="card-header">
                            <h4>Tasks Due Today</h4>
                        </div>
                        <div class="card-body">
                            <TaskStatus />
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-12">
                    <div class="card mb10">
                        <div class="card-header">
                            <h4>Projects Summary</h4>
                        </div>
                        <div class="card-body">
                            <ProjectSummary />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}