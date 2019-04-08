import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { Searchbar } from "../../globalComponents";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import WorkstreamDocument from "./workstreamDocument";

import TaskFilters from "../task/taskFilter";
import TaskListCategory from "../task/taskListCategory";
import WorkstreamMembers from "./workstreamMembers";
import ConversationForm from "../conversations/conversationsForm";
import ConversationList from "../conversations/conversationList";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        task: store.task,
        notes: store.notes
    }
})
export default class WorkstreamTabs extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "handleChange",
            "handleTab"
        ], (fn) => { this[fn] = this[fn].bind(this) })
    }

    handleChange(params) {
        const { dispatch, task } = this.props;

        if (task.Filter.task != params.task) {
            dispatch({ type: "SET_TASK_LIST", list: [] });
            dispatch({ type: "SET_TASK_FILTER", filter: params });
        }
    }
    handleTab(o) {
        const { taskAction = "", messageAction = "" } = { ...this.refs };
        const taskActionClassList = (taskAction != "") ? taskAction.classList : "";
        const messageActionClassList = (messageAction != "") ? messageAction.classList : "";

        if (o != 0) {
            (taskActionClassList).add('hide');
        } else {
            (taskActionClassList).remove('hide');
        }

        if (o != 2) {
            (messageActionClassList).add('hide');
        } else {
            (messageActionClassList).remove('hide');
        }

    }
    render() {
        const { project_id, workstream_id, dispatch, notes, loggedUser } = { ...this.props };
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
                                <div class="button-action" ref="taskAction">
                                    <Searchbar
                                        handleChange={this.handleChange}
                                        handleCancel={() => {
                                            dispatch({ type: "SET_TASK_FILTER", filter: { task: "" } });
                                        }}
                                        name="task"
                                    />
                                    {
                                        (loggedUser.data.userRole <= 4) && <a class="btn btn-default"
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
                                    }
                                </div>
                                <div class="button-action hide" ref="messageAction">
                                    {
                                        (typeof notes.Selected.id != "undefined" && notes.Selected.id != "") &&
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
                                    }
                                </div>
                            </TabList>
                            <TabPanel>
                                <TaskFilters
                                    show_tab={false}
                                    show_action={false}
                                />
                                <div class="bt">
                                    <div class="mt20 mb40">
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
                                </div>
                            </TabPanel>
                            <TabPanel class="bt mt20">
                                <div class="mt20">
                                    <WorkstreamDocument workstream_id={workstream_id} />
                                </div>
                            </TabPanel>
                            <TabPanel class="bt mt20">
                                <div class="mt20">
                                    <div class="row content-row row-eq-height">
                                        <div class="col-md-4 col-sm-12">
                                            <ConversationList projectId={project_id} workstreamId={workstream_id} />
                                        </div>
                                        <div class="col-md-8 col-sm-12">
                                            <ConversationForm projectId={project_id} workstreamId={workstream_id} />
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel class="bt mt20">
                                <WorkstreamMembers workstream_id={workstream_id} />
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
            </div>
        )
    }
}