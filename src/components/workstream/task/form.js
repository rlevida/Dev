import React from "react";
import _ from 'lodash';
import moment from 'moment';
import { connect } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';


import { setDatePicker, showToast, postData, putData, deleteData, getData } from '../../../globalFunction';
import { DropDown, Loading } from "../../../globalComponents";

import TaskComment from "./comment";
import TaskActivities from "./taskActivities";

import UploadModal from "./uploadModal";
import ApprovalModal from "./approvalModal";
import RejectMessageModal from "./rejectMessageModal";
import LogtimeModal from "./logtimeModal";
import TasklogTime from "./tasklogTime";
import DocumentViewerModal from "../document/documentViewerModal"
let keyTimer;

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        activity_log: store.activityLog,
        taskDependency: store.taskDependency,
        loggedUser: store.loggedUser,
        status: store.status,
        workstream: store.workstream,
        members: store.members,
        teams: store.teams,
        users: store.users,
        global: store.global,
        document: store.document,
        checklist: store.checklist,
        project: store.project
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
        this.addChecklist = this.addChecklist.bind(this);
        this.addDependency = this.addDependency.bind(this);
        this.updateChecklist = this.updateChecklist.bind(this);
        this.completeChecklist = this.completeChecklist.bind(this);
        this.deleteChecklist = this.deleteChecklist.bind(this);
        this.openCheckListUploadModal = this.openCheckListUploadModal.bind(this);
        this.getTaskList = this.getTaskList.bind(this);
        this.deleteTaskDependency = this.deleteTaskDependency.bind(this);
    }

    componentDidMount() {
        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "dueDate");
    }

    followTask() {
        let { dispatch, socket, loggedUser, task, workstream } = this.props;
        let { followersIds, followersName } = { ...task.Selected };
        let followerIdStack = (followersIds != null && followersIds != "") ? followersIds.split(",") : [];
        let followersNameStack = (followersName != null && followersIds != "") ? followersName.split(",") : [];

        followerIdStack.push(loggedUser.data.id);
        followersNameStack.push(loggedUser.data.firstName + " " + loggedUser.data.lastName);

        dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, followersIds: followerIdStack.join(","), followersName: followersNameStack.join(",") } });
        socket.emit("SAVE_OR_UPDATE_MEMBERS", { data: { usersType: "users", userTypeLinkId: loggedUser.data.id, linkType: "task", linkId: task.Selected.id, memberType: "Follower" }, type: "workstream" })

    }

    unFollowTask(id) {
        let { dispatch, socket, loggedUser, task } = this.props;
        let { followersIds, followersName } = { ...task.Selected };
        let followerIdStack = followersIds.split(",");
        let followersNameStack = followersName.split(",");

        socket.emit("DELETE_MEMBERS", { filter: { userTypeLinkId: loggedUser.data.id, linkId: task.Selected.id, memberType: "Follower" }, type: "workstream" })
        followerIdStack = _.filter(followerIdStack, (o) => { return o != loggedUser.data.id }).join(",");
        followersNameStack = _.filter(followersNameStack, (o) => { return o != loggedUser.data.firstName + " " + loggedUser.data.lastName }).join(",");

        dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, followersIds: followerIdStack, followersName: followersNameStack } });
    }

    markTaskAsCompleted() {
        let { socket, task, checklist, loggedUser, dispatch } = this.props;
        if (task.Selected.approvalRequired && loggedUser.data.userRole != 1 && loggedUser.data.userRole != 2 && loggedUser.data.userRole != 3) {
            const checklistToComplete = checklist.List
                .filter((e, index) => {
                    return e.isMandatory && !e.isCompleted;
                })
            if (checklistToComplete == 0) {
                $(`#approvalModal`).modal("show");
            } else {
                showToast("error", "There are items to be completed in the checklist before completing the task.")
            }
        } else {
            const checklistToComplete = checklist.List
                .filter((e, index) => {
                    return e.isMandatory && !e.isCompleted;
                })
            if (checklistToComplete.length == 0) {
                let status = "Completed"
                if (task.Selected.task_id && task.Selected.task_status != "Completed") {
                    status = "For Approval"
                    socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
                } else {
                    putData(`/api/task/status/${task.Selected.id}`,
                        {
                            userId: loggedUser.data.id,
                            username: loggedUser.data.username,
                            periodTask: task.Selected.periodTask,
                            periodic: task.Selected.periodic,
                            id: task.Selected.id,
                            status: "Completed"
                        }, (c) => {
                            if (c.status == 200) {
                                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data.task[0] });
                                dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                                showToast("success", "Task successfully updated.");
                            } else {
                                showToast("error", "Something went wrong please try again later.");
                            }
                            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                        });
                }
            } else {
                showToast("error", "There are items to be completed in the checklist before completing the task.")
            }
        }
    }

    rejectTask() {
        $(`#rejectMessageModal`).modal("show");
    }

    handleChange(e) {
        let { checklist, dispatch } = this.props;
        let Selected = Object.assign({}, checklist.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected })
    }

    addChecklist() {
        const { checklist, task, loggedUser, dispatch } = this.props;
        const toBeSubmitted = {
            description: checklist.Selected.checklist,
            taskId: task.Selected.id,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            isMandatory: (typeof checklist.Selected.isMandatory != "undefined" && checklist.Selected.isMandatory != "") ? checklist.Selected.isMandatory : 0,
            isDocument: (typeof checklist.Selected.isDocument != "undefined" && checklist.Selected.isDocument != "") ? checklist.Selected.isDocument : 0,
            createdBy: loggedUser.data.id
        };

        postData(`/api/checklist/`, toBeSubmitted, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_CHECKLIST", data: c.data.checklist });
                dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                showToast("success", "Checklist successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    updateChecklist() {
        const { checklist, task, loggedUser, dispatch } = this.props;
        const toBeSubmitted = {
            id: checklist.Selected.id,
            description: checklist.Selected.checklist,
            taskId: task.Selected.id,
            periodChecklist: checklist.Selected.periodChecklist,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            isMandatory: (typeof checklist.Selected.isMandatory != "undefined" && checklist.Selected.isMandatory != "") ? checklist.Selected.isMandatory : 0,
            isDocument: (typeof checklist.Selected.isDocument != "undefined" && checklist.Selected.isDocument != "") ? checklist.Selected.isDocument : 0,
            createdBy: loggedUser.data.id
        };
        putData(`/api/checklist/${checklist.Selected.id}`, toBeSubmitted, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_CHECKLIST", data: c.data.checklist });
                if (typeof c.data.activity_log != "undefined") {
                    dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                }
                dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                showToast("success", "Checklist successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    deleteChecklist(id) {
        const { task, dispatch, loggedUser } = this.props;

        deleteData(`/api/checklist/${id}?taskId=${task.Selected.id}&userId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "DELETE_CHECKLIST", data: { id } });
            dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
            showToast("success", "Item successfully deleted.");
        });
    }

    completeChecklist(params, data) {
        const { dispatch, loggedUser } = this.props;
        if (data.isDocument && data.document.length === 0 && !data.isCompleted) {
            showToast("error", "Please upload a document.");
            return;
        }
        putData(`/api/checklist/${params.id}`, { ...params, createdBy: loggedUser.data.id }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_CHECKLIST", data: c.data.checklist });
                dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                showToast("success", "Checklist successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    addDependency() {
        const { task, loggedUser, dispatch, activity_log } = this.props;
        const toBeSubmitted = {
            dependencyType: task.Selected.dependency_type,
            taskId: task.Selected.id,
            task_dependencies: task.Selected.task_dependency,
            userId: loggedUser.data.id
        };
        postData(`/api/taskDependency`, toBeSubmitted, (c) => {
            const updatedActivityLog = _.concat(c.data.activity_log, activity_log.List);
            dispatch({ type: "UPDATE_DATA_TASK_DEPENDENCY_LIST", List: c.data.task_dependencies });
            dispatch({ type: "SET_ACTIVITYLOG_LIST", list: updatedActivityLog });
            dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, dependency_type: "", task_dependency: [] } });
            dispatch({ type: "SET_TASK_SELECT_LIST", List: [] });
            showToast("success", "Task Dependency successfully updated.");
            keyTimer && clearTimeout(keyTimer);
        });
    }

    handleCheckbox(name, value) {
        let { checklist, dispatch } = this.props
        let Selected = Object.assign({}, checklist.Selected)
        Selected[name] = value;
        if (name === 'isDocument') {
            dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...Selected, isMandatory: value } })
        } else {
            dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected });
        }
    }

    setDropDownMultiple(name, values) {
        let { checklist, task, dispatch } = this.props;


        if (values.filter(e => { return e.value == "Document" }).length) {
            dispatch({ type: "SET_TASK_MODAL_TYPE", ModalType: "checklist" })
            $('#uploadFileModal').modal({
                backdrop: 'static',
                keyboard: false
            })
        }
        if (name == "task_dependency") {
            dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, [name]: values } })
        } else {
            dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...checklist.Selected, [name]: values } })
        }
    }

    setDropDown(name, value) {
        let { dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "dependencyType" && value == "") {
            Selected["task_dependency"] = [];
        }

        dispatch({ type: "SET_TASK_SELECTED", Selected: Selected })
    }

    editChecklist({ ...value }) {
        let { dispatch } = { ...this.props };
        let description = value.description
        delete value.description;

        dispatch({ type: "SET_CHECKLIST_ACTION", action: `Edit` })
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...value, checklist: description, documents: (value.documents != "") ? value.documents : [] } })
    }

    openCheckListUploadModal(data) {
        let { dispatch } = this.props;

        dispatch({ type: "SET_TASK_MODAL_TYPE", ModalType: "checklist" })
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: data })
        $('#uploadFileModal').modal({
            backdrop: 'static',
            keyboard: false
        })
    }

    back() {
        let { task, dispatch } = this.props;

        if (task.TaskComponentCurrentPage == "Reminder") {
            dispatch({ type: "SET_REMINDER_FORM_ACTIVE", FormActive: "List" })
            dispatch({ type: "SET_TASK_COMPONENT_CURRENT_PAGE", Page: "" })
        } else if (task.TaskComponentCurrentPage == "My Tasks") {
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" })
            dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
        } else {
            dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" })
            dispatch({ type: "SET_TASK_FORM_ACTION", FormAction: "" })
            dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
        }
    }

    getTaskList(options) {
        const { dispatch, task, taskDependency } = this.props;

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/task?projectId=${project}&page=1&task=${options}`, {}, (c) => {
                    const taskOptions = _(c.data.result)
                        .filter((o) => {
                            const findSelectedTaskIndex = _.findIndex(taskDependency.List, (taskDependencyObj) => { return taskDependencyObj.task.id == o.id });
                            return findSelectedTaskIndex < 0 && o.id != task.Selected.id;
                        })
                        .map((e) => { return { id: e.id, name: e.task } })
                        .value();
                    dispatch({ type: "SET_TASK_SELECT_LIST", List: _.concat(taskOptions, _.map(task.Selected.task_dependency, (o) => { return { id: o.value, name: o.label } })) });
                });
            }, 1500)
        }
    }

    deleteTaskDependency(id) {
        const { dispatch, loggedUser } = this.props;
        deleteData(`/api/taskDependency/${id}?userId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "DELETE_TASK_DEPENDENCY", id });
            dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
            showToast("success", "Task Dependency successfully deleted.");
        });
    }

    viewDocument(data) {
        let { socket, dispatch } = this.props;
        getData(`/api/conversation/getConversationList?linkType=document&linkId=${data.id}`, {}, (c) => {
            dispatch({ type: 'SET_COMMENT_LIST', list: c.data })
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
            $(`#documentViewerModal`).modal('show')
        })
    }


    render() {
        const { dispatch, task, status, global, loggedUser, checklist, project, taskDependency, workstream } = { ...this.props };
        let statusList = [], taskList = [{ id: "", name: "Select..." }], projectUserList = [], isVisible = false;

        status.List.map((e, i) => { if (e.linkType == "task") { statusList.push({ id: e.id, name: e.status }) } });

        if (typeof this.props.global.SelectList.taskList != "undefined") {
            this.props.global.SelectList["taskList"].map((e) => {
                taskList.push({ id: e.id, name: e.task })
            })
        }

        if (typeof global.SelectList.ProjectMemberList != "undefined") {
            global.SelectList.ProjectMemberList.map((e, i) => { projectUserList.push({ id: e.id, name: e.username + " - " + e.firstName }) })
        }

        let taskStatus = 0;
        let dueDate = moment(task.Selected.dueDate);
        let currentDate = moment(new Date());

        if (dueDate.diff(currentDate, 'days') < 0 && task.Selected.status != 'Completed') {
            taskStatus = 2
        } else if (dueDate.diff(currentDate, 'days') == 0 && task.Selected.status != 'Completed') {
            taskStatus = 1
        }

        if ((task.Selected.status != "Completed" && task.Selected.assignedTo == loggedUser.data.id && task.Selected.isActive == 1) || loggedUser.data.id == workstream.Selected.responsible || loggedUser.data.userRole < 3) {
            isVisible = true
        } else if ((task.Selected.status != "Completed" && task.Selected.assignedUserType == "Internal" && task.Selected.isActive == 1)) {
            let userData = loggedUser.data
            if (loggedUser.data.userType == "Internal" && (userData.userRole == 1 || userData.userRole == 2 || userData.userRole == 3 || task.Selected.assignedTo == userData.id)) {
                isVisible = true;
            }
        }

        const preceedingTask = _(taskDependency.List)
            .filter((o) => {
                return o.dependencyType == "Preceded by"
            })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();

        const succedingTask = _(taskDependency.List)
            .filter((o) => { return o.dependencyType == "Succeeding" })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();

        return (
            <div>
                <Tabs class="mb40">
                    <TabList>
                        <Tab>Overview</Tab>
                        <Tab>Dependents</Tab>
                    </TabList>
                    <TabPanel>
                        <div>
                            {
                                (task.Loading != "FETCHING_DETAILS") && <div>
                                    <h4 class="mt20 mb0">
                                        {(taskStatus == 0 && (task.Selected.dueDate != "" && task.Selected.dueDate != null)) && <span class="fa fa-circle fa-lg" style={{ color: "#27ae60", marginRight: 5 }}></span>}
                                        {(taskStatus == 1 && (task.Selected.dueDate != "" && task.Selected.dueDate != null)) && <span class="fa fa-circle fa-lg" style={{ color: "#f39c12", marginRight: 5 }}></span>}
                                        {(taskStatus == 2 && (task.Selected.dueDate != "" && task.Selected.dueDate != null)) && <span class="fa fa-exclamation-circle fa-lg" style={{ color: "#c0392b", marginRight: 5 }}></span>}
                                        {task.Selected.task}
                                        {(task.Selected.status == "Completed") && "( Completed )"}
                                        {(!task.Selected.status || task.Selected.status == "In Progress") && "( In Progress )"}
                                        {(task.Selected.status == "For Approval") && "( For Approval )"}
                                        {(task.Selected.status == "Rejected") && "( Rejected )"}
                                    </h4>

                                    {
                                        (typeof task.Selected.description != "undefined"
                                            && task.Selected.description != ""
                                            && task.Selected.description != null) && <p class="mt10 mb10">{task.Selected.description}</p>
                                    }

                                    <div class="form-group mt10 mb10 text-center">
                                        {(isVisible && task.Selected.status != "For Approval") &&
                                            <a href="javascript:void(0);" class="btn btn-primary" style={{ marginRight: 5 }} title="Mark Task as Completed" onClick={() => this.markTaskAsCompleted()}>Complete Task</a>
                                        }
                                        {(task.Selected.status == "For Approval" && task.Selected.assignedTo !== loggedUser.data.id) &&
                                            <span>
                                                <a href="javascript:void(0);" class="btn btn-primary" style={{ marginRight: 5 }} title="Mark Task as Completed" onClick={() => this.markTaskAsCompleted()}>Approve</a>
                                                <a href="javascript:void(0);" class="btn btn-primary" title="Reject Task" onClick={() => this.rejectTask()}>Reject</a>
                                            </span>
                                        }
                                        {(task.Selected.followersName != null && task.Selected.followersIds.split(",").filter(e => { return e == loggedUser.data.id }).length > 0)
                                            ? <a href="javascript:void(0);" class="btn btn-primary" style={{ marginRight: 5 }} title="Unfollow task" onClick={() => this.unFollowTask()}>Unfollow Task</a>
                                            : <a href="javascript:void(0);" class="btn btn-primary" title="Follow task" onClick={() => this.followTask()}>Follow Task</a>
                                        }
                                    </div>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <div class="details">
                                                <span class="fa fa-calendar"></span>
                                                <p>
                                                    {
                                                        `Start Date: ${(task.Selected.startDate != "" && task.Selected.startDate != null) ? moment(task.Selected.startDate).format('ll') : "N/A"}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="details">
                                                <span class="fa fa-calendar"></span>
                                                <p>
                                                    {
                                                        `Due Date: ${(task.Selected.dueDate != "" && task.Selected.dueDate != null) ? moment(task.Selected.dueDate).format('ll') : "N/A"}`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <a href="#" type="button" data-toggle="modal" data-target="#time-log"><span class="fa fa-lg fa-clock-o" title="Log Time"></span> Time Spent</a>
                                        </div>
                                        {
                                            (task.Selected.periodic == 1) && <div class="col-md-6">
                                                <div class="details">
                                                    <span class="fa fa-undo"></span>
                                                    <p>Repeat: {task.Selected.period + " " + (task.Selected.periodType).charAt(0).toUpperCase() + (task.Selected.periodType).slice(1)}</p>
                                                </div>
                                            </div>
                                        }
                                        <div class="col-md-12">
                                            <div class="details">
                                                <span class="fa fa-user"></span>
                                                <p class="m0">Followers: {(task.Selected.followersName == null) ? "N/A" : ""} </p>
                                            </div>
                                            <ul>
                                                {(task.Selected.followersName != null) &&
                                                    task.Selected.followersName.split(",").map((user, index) => {
                                                        return <li key={index}>{user}</li>
                                                    })
                                                }
                                            </ul>
                                        </div>
                                    </div>
                                    <div>
                                        <div>
                                            <h5 class="mb0">Checklist</h5>
                                        </div>
                                        {(checklist.Action != "Edit") &&
                                            <div id="checklist">
                                                {
                                                    _.map(checklist.List, (o, index) => {
                                                        let isEditable = (loggedUser.data.id == o.createdBy
                                                            || loggedUser.data.userRole == 1
                                                            || loggedUser.data.userRole == 2
                                                            || loggedUser.data.userRole == 3
                                                            || project.Selected.projectManagerId == loggedUser.data.id)
                                                            ? true : false
                                                        return (
                                                            <div className={
                                                                ((isEditable || task.Selected.assignedTo == loggedUser.data.id) && task.Selected.status != "Completed")
                                                                    ? (o.isCompleted == 1)
                                                                        ? "wrapper completed"
                                                                        : "wrapper"
                                                                    : "wrapper-disabled"} key={index}>
                                                                {
                                                                    ((isEditable || task.Selected.assignedTo == loggedUser.data.id) && task.Selected.status !== "Completed") &&
                                                                    <div class="dropdown task-checklist-actions">
                                                                        <button class="btn btn-default dropdown-toggle" type="button" id="documentViewerActions" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="documentViewerActions">
                                                                            {((o.createdBy == loggedUser.data.id || loggedUser.data.userRole <= 3) && o.isCompleted == 0) &&
                                                                                <li>
                                                                                    <a onClick={() => { this.editChecklist(o) }}>Edit</a>
                                                                                </li>
                                                                            }
                                                                            {((o.createdBy == loggedUser.data.id || loggedUser.data.userRole <= 3) && o.isCompleted == 0) &&
                                                                                <li>
                                                                                    <a onClick={() => { this.deleteChecklist(o.id) }}>Delete</a>
                                                                                </li>
                                                                            }
                                                                            {((task.Selected.assignedTo == loggedUser.data.id || loggedUser.data.userRole <= 3) && (!o.isDocument || o.isDocument && o.isCompleted > 0)) &&
                                                                                <li>
                                                                                    <a onClick={() => { this.completeChecklist({ id: o.id, isCompleted: (o.isCompleted != 1) ? 1 : 0 }, o) }}>
                                                                                        {(o.isCompleted) ? "Not Complete" : "Complete"}
                                                                                    </a>
                                                                                </li>
                                                                            }
                                                                            {(Boolean(o.isDocument)) &&
                                                                                <li>
                                                                                    <a href="javascript:void(0)" onClick={() => this.openCheckListUploadModal(o)}>Upload Document</a>
                                                                                </li>

                                                                            }
                                                                        </ul>
                                                                    </div>
                                                                }
                                                                <p class="m0">
                                                                    {
                                                                        (o.isMandatory == 1) && <span style={{ color: "red" }}>*</span>
                                                                    }
                                                                    {o.description}
                                                                </p>
                                                                <div id="checklist-action-wrapper">
                                                                    {
                                                                        (o.isMandatory == 1) && <span class="label label-info mr5">Mandatory</span>
                                                                    }
                                                                    {
                                                                        (o.isDocument == 1) && <span class="label label-success">Document</span>
                                                                    }
                                                                    {
                                                                        (typeof o.document != "undefined" && o.document.length > 0) && <div class="mt5">
                                                                            <p class="mb0">Documents:</p>
                                                                            {
                                                                                _.map(o.document, (o, index) => {
                                                                                    return (
                                                                                        <p class="ml15 mt0 m0" key={index}><a href="javascript:void(0)" onClick={() => this.viewDocument(o)}>{o.origin}</a></p>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                    }
                                                                    <p style={{ marginTop: 0, fontSize: 10, marginBottom: 0 }}>
                                                                        By : {o.user.firstName + ' ' + o.user.lastName + ' - ' + moment(o.dateAdded).format("MMM DD, YYYY")}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )
                                                    })
                                                }
                                            </div>
                                        }
                                        {(task.Selected.isActive > 0 && task.Selected.status != "Completed") &&
                                            <div class="row" style={{ paddingLeft: 15 }}>
                                                <div class="col-md-12 pdr0">
                                                    {
                                                        ((task.Selected.assignedTo == loggedUser.data.id) || loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 || project.Selected.projectManagerId == loggedUser.data.id || loggedUser.data.userRole == 3) &&
                                                        <div>
                                                            <div class="form-group m0">
                                                                <label>Item</label>
                                                                <input type="text" name="checklist"
                                                                    class="form-control"
                                                                    placeholder="Add Item"
                                                                    onChange={this.handleChange}
                                                                    value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}

                                                                />
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        }

                                        {(typeof checklist.Selected.documents != "undefined" && checklist.Selected.documents != "" && checklist.Selected.documents != null) &&
                                            <div class="row" style={{ marginLeft: 7, marginTop: 5 }}>
                                                <div class="col-md-12 pdr0">
                                                    <div class="form-group">
                                                        <div style={{ position: "relative" }}>
                                                            <label>Attached Documents</label>
                                                            {
                                                                (typeof checklist.Selected.id != "undefined" && _.filter(checklist.Selected.types, (o) => { return o.value == "Document" }).length > 0) &&
                                                                <a class="task-action" onClick={this.openCheckListUploadModal}>Add</a>
                                                            }
                                                        </div>
                                                        {
                                                            checklist.Selected.documents.map((data, index) => {
                                                                return (
                                                                    <p key={index} style={{ marginLeft: 7, marginTop: 0, marginBottom: 0 }}>{data.origin}</p>
                                                                )
                                                            })
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        }

                                        {(typeof checklist.Selected.checklist != "undefined" && checklist.Selected.checklist != "") &&
                                            <div class="row" style={{ paddingLeft: 15 }}>
                                                <div class="col-md-12 pdr0">
                                                    <ul id="checklist-checkbox">
                                                        <li>
                                                            <input
                                                                id="mandatory-checkbox"
                                                                type="checkbox"
                                                                checked={(checklist.Selected.isMandatory || checklist.Selected.isDocument) ? true : false}
                                                                onChange={() => { }}
                                                                onClick={(f) => { this.handleCheckbox("isMandatory", (checklist.Selected.isMandatory) ? 0 : 1) }}
                                                                disabled={checklist.Selected.isDocument ? true : false}
                                                            />
                                                            <label for="mandatory-checkbox">Mandatory Item</label>
                                                        </li>
                                                        <li>
                                                            <input
                                                                id="document-checkbox"
                                                                type="checkbox"
                                                                checked={checklist.Selected.isDocument ? true : false}
                                                                onChange={() => { }}
                                                                onClick={(f) => { this.handleCheckbox("isDocument", (checklist.Selected.isDocument) ? 0 : 1) }}
                                                            />
                                                            <label for="document-checkbox">Document Item</label>
                                                        </li>
                                                    </ul>
                                                    {
                                                        (checklist.Action != "Edit") ?

                                                            <a href="javascript:void(0);" class="btn btn-primary" title="Add"
                                                                onClick={this.addChecklist}
                                                            >
                                                                Add
                                                </a>
                                                            :
                                                            <div>
                                                                <a href="javascript:void(0);" class="btn btn-primary mt5 mr5" title="Save"
                                                                    onClick={this.updateChecklist}
                                                                >
                                                                    Save
                                                    </a>
                                                                <a href="javascript:void(0);" class="btn btn-primary mt5" title="Add"
                                                                    onClick={() => {
                                                                        dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined })
                                                                        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: {} })
                                                                    }}
                                                                >
                                                                    Cancel
                                                    </a>
                                                            </div>
                                                    }

                                                </div>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </TabPanel>
                    <TabPanel>
                        <div style={{ position: "relative" }} class="mt10">
                            <h4 class="mt20 mb20">
                                {(taskStatus == 0) && <span class="fa fa-circle fa-lg" style={{ color: "#27ae60" }}></span>}
                                {(taskStatus == 1) && <span class="fa fa-circle fa-lg" style={{ color: "#f39c12" }}></span>}
                                {(taskStatus == 2) && <span class="fa fa-exclamation-circle fa-lg" style={{ color: "#c0392b" }}></span>}
                                &nbsp; &nbsp;{task.Selected.task} &nbsp;&nbsp;
                                        {(task.Selected.status == "Completed") && "( Completed )"}
                                {(!task.Selected.status || task.Selected.status == "In Progress") && "( In Progress )"}
                            </h4>
                        </div>
                        {
                            (typeof task.Selected.description != "undefined"
                                && task.Selected.description != ""
                                && task.Selected.description != null) && <p class="mt10 mb10">{task.Selected.description}</p>
                        }
                        {
                            (preceedingTask.length > 0) && <div>
                                <h5 class="mt10">Preceded by</h5>
                                <div class="pdl15">
                                    <table class="table responsive-table m0">
                                        <tbody>
                                            <tr>
                                                <th>Task</th>
                                                <th>Description</th>
                                                <th></th>
                                            </tr>
                                            {
                                                _.map(preceedingTask, (succTask, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td class="text-left">{succTask.task.task}</td>
                                                            <td class="description-td text-left">{succTask.task.description}</td>
                                                            <td>
                                                                <a class="btn btn-danger"
                                                                    onClick={() => this.deleteTaskDependency(succTask.id)}
                                                                >
                                                                    <span class="glyphicon glyphicon-trash"></span>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        }
                        {
                            (succedingTask.length > 0) && <div class="mb20">
                                <h5 class="mt10">Succeeding</h5>
                                <div class="pdl15">
                                    <table class="table responsive-table m0">
                                        <tbody>
                                            <tr>
                                                <th>Task</th>
                                                <th>Description</th>
                                                <th></th>
                                            </tr>
                                            {
                                                _.map(succedingTask, (succTask, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td class="text-left">{succTask.task.task}</td>
                                                            <td class="description-td text-left">{succTask.task.description}</td>
                                                            <td>
                                                                <a class="btn btn-danger"
                                                                    onClick={() => this.deleteTaskDependency(succTask.id)}
                                                                >
                                                                    <span class="glyphicon glyphicon-trash"></span>
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        }
                        {(task.Selected.isActive > 0) &&
                            <div class="row" style={{ marginLeft: 2 }}>
                                <div class="col-md-4 pdr0">
                                    <label>Dependency Type *</label>
                                    <DropDown multiple={false}
                                        required={true}
                                        options={_.map(['Preceded by', 'Succeeding'], (o) => { return { id: o, name: o } })}
                                        selected={(typeof task.Selected.dependency_type == "undefined") ? "" : task.Selected.dependency_type}
                                        onChange={(e) => {
                                            this.setDropDown("dependency_type", (e == null) ? "" : e.value);
                                        }}
                                        isClearable={true}
                                    />
                                    {
                                        (
                                            (typeof task.Selected.dependency_type != "undefined" &&
                                                typeof task.Selected.task_dependency != "undefined") &&
                                            (task.Selected.dependency_type != "" &&
                                                task.Selected.task_dependency != "")
                                        ) && <div>
                                            <a href="javascript:void(0);" class="btn btn-primary mt5" title="Add"
                                                onClick={this.addDependency}
                                            >
                                                Add
                                            </a>
                                        </div>
                                    }
                                </div>
                                <div class="col-md-8">
                                    <label>Dependent Tasks *</label>
                                    <DropDown multiple={true}
                                        required={typeof task.Selected.dependency_type != "undefined"
                                            && (task.Selected.dependency_type != "" &&
                                                task.Selected.dependency_type != null)}
                                        options={task.SelectList}
                                        onInputChange={this.getTaskList}
                                        selected={(typeof task.Selected.task_dependency == "undefined") ? [] : task.Selected.task_dependency}
                                        onChange={(e) => this.setDropDownMultiple("task_dependency", e)}
                                        placeholder={"Type to Search Task"}
                                    />
                                </div>
                            </div>
                        }
                    </TabPanel>
                </Tabs>
                {
                    (task.Loading != "FETCHING_DETAILS") && <Tabs>
                        <TabList>
                            <Tab>Comments</Tab>
                            <Tab>Activities</Tab>
                            <Tab>Time Logs</Tab>
                        </TabList>
                        <TabPanel>
                            <TaskComment />
                        </TabPanel>
                        <TabPanel>
                            <TaskActivities />
                        </TabPanel>
                        <TabPanel>
                            <TasklogTime />
                        </TabPanel>
                    </Tabs>
                }
                {
                    (task.Loading == "FETCHING_DETAILS") && <Loading />
                }
                <UploadModal />
                <ApprovalModal />
                <RejectMessageModal />
                <LogtimeModal />
                <DocumentViewerModal/>
            </div>
        )
    }
}