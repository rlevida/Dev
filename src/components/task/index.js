import React from "react"
import Header from "../partial/header"
import Form from "./form"
import List from "./list"
import Calendar from "./calendar"
import Timeline from './timeline'
import Link from "./link"
import TaskStatus from "./taskStatus";
import TaskFilter from "./taskFilter";
import _ from "lodash";

import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
        projectData: store.project
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        let { task, projectData } = this.props;
        let Component = <div class="pd20">
            <h3 class="mt10 mb10"><a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{projectData.Selected.project}</a></h3>
            {
                (
                    task.FormActive == "Form" &&
                    typeof task.Selected.workstream != "undefined"
                ) && <ul class="list-inline" style={{ margin: "20px" }}>
                    <li style={{ width: "60px" }}>&nbsp;&nbsp;<span class="fa fa-tag" title="tag"></span></li>
                    <li style={{ width: "100x" }}>&nbsp;&nbsp;<span class="label label-success" style={{ margin: "5px" }}>{task.Selected.workstream.workstream}</span></li>
                </ul>
            }
            {
                (task.FormActive != "Form") &&
                <div>
                    <Link />
                    <div class="row mb10">
                        <div class="col-lg-10 pd0">
                            <TaskFilter />
                        </div>
                    </div>
                </div>
            }
            {
                (task.FormActive == "List") &&
                <List />
            }
            {
                (task.FormActive == "Timeline") &&
                <Timeline />
            }
            {
                (task.FormActive == "Calendar") &&
                <Calendar />
            }
            {
                (task.FormActive == "Form") &&
                <Form />
            }
        </div>
        return (
            <Header component={Component} page={"task"} />
        )
    }
}