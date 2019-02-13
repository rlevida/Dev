import React from "react";
import Header from "../partial/header";
import ProjectStatus from "../project/projectStatus"
import TaskStatus from "../allTask/taskStatus";
import Focus from "../focus";

export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        var Component = <div>
            <div class="row">
                <div class="col-lg-6">
                    <div class="card mb10">
                        <div class="card-header">
                            <h4>Tasks Due Today</h4>
                        </div>
                        <div class="card-body">
                            <TaskStatus />
                        </div>
                    </div>
                </div>
            </div>
            {/* <div class="card">
                <div class="card-header">
                    <h3>Tasks</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-lg-10">
                        <TaskStatus />
                        </div>
                    </div>
                </div>
            </div>
            <h4>Focus</h4>
            <div class="row mb20">
                <div class="col-lg-6 col-lg-offset-1">
                    <Focus />
                </div>
            </div> */}
        </div>
        return (
            <Header component={Component} page={"Dashboard"} />
        )
    }
}