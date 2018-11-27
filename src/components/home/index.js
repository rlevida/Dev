import React from "react";
import Header from "../partial/header";
import ProjectStatus from "../project/projectStatus"
import TaskStatus from "../allTask/taskStatus";
import Focus from "../focus";

export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            page: page
        }
    }

    render() {
        var Component = <div class="pd20">
            <h4>Projects</h4>
            <div class="row mb20">
                <div class="col-lg-10">
                    <ProjectStatus/>
                </div>
            </div>
            <h4>Tasks</h4>
            <div class="row mb20">
                <div class="col-lg-10">
                    <TaskStatus/>
                </div>
            </div>
            <h4>Focus</h4>
            <div class="row mb20">
                <div class="col-lg-6">
                    <Focus/>
                </div>
            </div>
        </div>
        return (
            <Header component={Component} page={"My Dashboard"} />
        )
    }
}