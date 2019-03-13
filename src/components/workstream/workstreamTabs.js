import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import TaskListCategory from "../task/taskListCategory";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

@connect((store) => {
    return {
        workstream: store.workstream,
        task: store.task
    }
})
export default class WorkstreamTabs extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "handleChange",
            "handleShowSearch",
            "handleTab"
        ], (fn) => { this[fn] = this[fn].bind(this) })
    }

    handleChange(e) {
        const { dispatch } = this.props;
        const filterState = { [e.target.name]: e.target.value };

        if (typeof e.key != "undefined" && e.key === 'Enter' && e.target.value != "") {
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: filterState });
        }
    }
    handleTab() {

    }
    handleShowSearch() {
        const { dispatch } = this.props;
        const { searchInput = "", searchIcon = "" } = { ...this.refs };
        const searchClassList = (searchInput != "") ? searchInput.classList : "";
        const searchIconClassList = (searchIcon != "") ? searchIcon.classList : "";

        if (searchClassList.contains('hide')) {
            (searchClassList).remove('hide');
            (searchIconClassList).remove('fa-search');
            (searchIconClassList).add('fa-times-circle-o');
        } else {
            (searchClassList).add('hide');
            (searchIconClassList).remove('fa-times-circle-o');
            (searchIconClassList).add('fa-search');
            searchInput.value = "";
            dispatch({ type: "SET_TASK_FILTER", filter: { task: "" } });
        }
    }
    render() {
        const { workstream_id, dispatch } = { ...this.props };

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <Tabs onSelect={index => this.handleTab(index)}>
                            <TabList>
                                <Tab>Tasks</Tab>
                                <Tab>Active Files</Tab>
                                <Tab>Messages</Tab>
                                <Tab>Members</Tab>
                                <div class="button-action">
                                    <div class="mr10" >
                                        <input
                                            type="text"
                                            name="task"
                                            class="form-control hide"
                                            placeholder="Type and press enter to search"
                                            onKeyPress={this.handleChange}
                                            ref="searchInput"
                                        />
                                    </div>
                                    <a
                                        class="logo-action text-grey"
                                        onClick={this.handleShowSearch}
                                    >
                                        <i ref="searchIcon" class="fa fa-search" aria-hidden="true"></i>
                                    </a>
                                    <a class="btn btn-default"
                                        onClick={(e) => {
                                            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" });
                                            dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
                                        }}
                                    >
                                        <span>
                                            <i class="fa fa-plus mr10" aria-hidden="true"></i>
                                            Add New Task
                                             </span>
                                    </a>
                                </div>
                            </TabList>
                            <TabPanel class="bt">
                                <div class="mt40 mb40">
                                    <TaskListCategory date="Today" workstream_id={workstream_id} />
                                </div>
                                <div class="mb40">
                                    <TaskListCategory date="This week" workstream_id={workstream_id} />
                                </div>
                                <div class="mb40">
                                    <TaskListCategory date="This month" workstream_id={workstream_id} />
                                </div>
                                <div class="mb40">
                                    <TaskListCategory date="Succeeding month" workstream_id={workstream_id} />
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <h2>Active Files</h2>
                            </TabPanel>
                            <TabPanel>
                                <h2>Messages</h2>
                            </TabPanel>
                            <TabPanel>
                                <h2>Members</h2>
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
            </div>
        )
    }
}