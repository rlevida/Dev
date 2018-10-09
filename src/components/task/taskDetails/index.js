import React from "react";
import { setDatePicker, showToast } from '../../../globalFunction';
import { connect } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import UploadModal from "./uploadModal";
import ApprovalModal from "./approvalModal";
import RejectMessageModal from "./rejectMessageModal";
import moment from 'moment';
import _ from 'lodash';
import { HeaderButtonContainer , DropDown } from "../../../globalComponents";
import TaskComment from "./comment";

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
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

export default class ReminderTask extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
        this.addChecklist = this.addChecklist.bind(this);
        this.addDependency = this.addDependency.bind(this);
        this.saveChecklist = this.saveChecklist.bind(this);
        this.openCheckListUploadModal = this.openCheckListUploadModal.bind(this);
    }

    componentWillReceiveProps(props) {
        let { socket, task } = props;

        if (this.props.task.Selected.id != task.Selected.id) {
            socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
            socket.emit("GET_CHECK_LIST", { filter: { taskId: task.Selected.id } });
            socket.emit("GET_COMMENT_LIST", { filter: { linkType: "task", linkId: task.Selected.id } })
        }
    }

    componentDidMount() {
        let { socket, task, workstream } = this.props
        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");
        if (typeof task.Selected.id != 'undefined') {
            socket.emit("GET_CHECK_LIST", { filter: { taskId: task.Selected.id } });
            socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
            socket.emit("GET_COMMENT_LIST", { filter: { linkType: "task", linkId: task.Selected.id } })
        }
        if (typeof task.Selected.workstreamId != "undefined") {
            socket.emit("GET_DOCUMENT_LIST", { filter: { isDeleted: 0, linkId: project, linkType: 'project' } })
        }
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
        let { socket, task, checklist } = this.props;
        let checklistToBeComplete = []
        if (task.Selected.approvalRequired) {
            $(`#approvalModal`).modal("show");
        } else {
            checklist.List.map((e, index) => {
                if (e.types.length > 0) {
                    let isMandatory = e.types.filter(t => { return t.value == "Mandatory" }).length > 0 ? 1 : 0
                    if (isMandatory) {
                        if (e.completed) {
                        } else {
                            checklistToBeComplete.push(e)
                        }
                    }
                }
            });

            if (checklistToBeComplete.length == 0) {
                let status = "Completed"
                if (task.Selected.task_id && task.Selected.task_status != "Completed") {
                    status = "For Approval"
                    socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
                } else {
                    socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, periodTask: task.Selected.periodTask, status: "Completed", action: "complete" } })
                }
            } else {
                showToast("error", "There are items to be completed in the checklist before completing the task.")
            }
        }
    }

    approveTask() {
        let { socket, task, checklist , loggedUser} = this.props;
        let checklistToBeComplete = []
        if (checklistToBeComplete.length == 0) {
            let status = "Completed"
            if (task.Selected.task_id && task.Selected.task_status != "Completed") {
                status = "For Approval"
                socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
            } else {
                let reminderDetails = {
                    seen : 0,
                    usersId : task.Selected.assignedById,
                    projectId : task.Selected.projectId,
                    linkType : "task",
                    linkId : task.Selected.id,
                    type: "Task Completed",
                    createdBy : loggedUser.data.id,
                    reminderDetail : "Task Completed"
                }
                
                socket.emit("SAVE_OR_UPDATE_TASK", { 
                    data: { id: task.Selected.id, periodTask: task.Selected.periodTask, status: "Completed", action: "complete" }, 
                    reminder : reminderDetails
                })
            }
        } else {
            showToast("error", "There are items to be completed in the checklist before completing the task.")
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
        const { checklist, task, socket, loggedUser } = this.props;
        const toBeSubmitted = {
            description: checklist.Selected.checklist,
            types: (typeof checklist.Selected.types != "undefined") ? checklist.Selected.types : "",
            taskId: task.Selected.id,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            createdBy: loggedUser.data.id,
            isDocument: (typeof checklist.Selected.isDocument != "undefined" && checklist.Selected.isDocument != "") ? checklist.Selected.isDocument : 0
        };

        if (toBeSubmitted.isDocument == 1) {
            if (checklist.Selected.documents.length > 0) {
                socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted, documents: checklist.Selected.documents, project: project })
            } else {
                showToast("error", "One or more documents are missing.")
            }
        } else {
            socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted })
        }
    }

    addDependency() {
        const { task, socket } = this.props;
        const toBeSubmitted = {
            type: task.Selected.dependencyType,
            task_id: task.Selected.id,
            task_dependencies: task.Selected.linkTaskIds
        };
        socket.emit("ADD_TASK_DEPENDENCY", { data: toBeSubmitted })
    }

    saveChecklist() {
        const { checklist, task, socket, loggedUser } = this.props;
        const toBeSubmitted = {
            id: checklist.Selected.id,
            description: checklist.Selected.checklist,
            types: checklist.Selected.types,
            taskId: task.Selected.id,
            periodChecklist: checklist.Selected.periodChecklist,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            createdBy: loggedUser.data.id
        };
        if (_.filter(checklist.Selected.types, (e) => { return e.value == "Document" }).length > 0 && checklist.Selected.documents.length > 0) {
            socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted, documents: checklist.Selected.documents, project: project })
        } else {
            socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted })
        }
    }

    handleCheckbox(name, value) {
        let { checklist, dispatch } = this.props
        let Selected = Object.assign({}, checklist.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected });

        if (name == "isDocument" && value == 1) {
            dispatch({ type: "SET_TASK_MODAL_TYPE", ModalType: "checklist" })
            $('#uploadFileModal').modal({
                backdrop: 'static',
                keyboard: false
            })
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

        if (name == "linkTaskIds") {
            dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, [name]: values } })
        } else {
            dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...checklist.Selected, [name]: values } })
        }
    }

    setDropDown(name, value) {
        let { socket, dispatch, task } = this.props
        let Selected = Object.assign({}, task.Selected)
        Selected[name] = value;

        if (name == "dependencyType" && value == "") {
            Selected["linkTaskIds"] = [];
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

    openCheckListUploadModal() {
        let { dispatch } = this.props;

        dispatch({ type: "SET_TASK_MODAL_TYPE", ModalType: "checklist" })
        $('#uploadFileModal').modal({
            backdrop: 'static',
            keyboard: false
        })
    }

    render() {
        let { dispatch, task, status, global, loggedUser, document, workstream, checklist, socket, project } = { ...this.props };
        let statusList = [], taskList = [{ id: "", name: "Select..." }], projectUserList = [], isVisible = false, documentList = [];

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

        if ((task.Selected.status != "Completed" && task.Selected.assignedUserType != "Internal" && task.Selected.isActive == 1)) {
            isVisible = true
        } else if ((task.Selected.status != "Completed" && task.Selected.assignedUserType == "Internal" && task.Selected.isActive == 1)) {
            let userData = loggedUser.data
            if (loggedUser.data.userType == "Internal" && (userData.userRole == 1 || userData.userRole == 2 || userData.userRole == 3 || task.Selected.assignedById == userData.id)) {
                isVisible = true;
            }
        }
        if (typeof global.SelectList.tagList != "undefined") {
            let tempTagList = [];
            global.SelectList.tagList.map(tag => {
                if (tag.linkType == "workstream" && tag.linkId == workstream.Selected.id) {
                    tempTagList.push(tag)
                }

                if (tag.linkType == "task") {
                    task.List.map(t => {
                        if (t.id == tag.linkId && t.workstreamId == workstream.Selected.id) {
                            tempTagList.push(tag)
                        }
                    })
                }
            })
            if (tempTagList.length) {
                tempTagList.map(temp => {
                    document.List.map(e => { if (e.id == temp.tagTypeId) { documentList.push(e) } })
                })
            }
        }

        let preceedingTask = _(task.Selected.dependencies)
            .filter((o) => { return o.dependencyType == "Preceding" })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();
        let succedingTask = _(task.Selected.dependencies)
            .filter((o) => { return o.dependencyType == "Succeeding" })
            .map((o) => {
                let depencyTask = _.filter(task.List, (c) => { return c.id == o.linkTaskId });
                return { ...o, task: (depencyTask.length > 0) ? depencyTask[0] : '' }
            })
            .value();

        let dependentTaskList = _(task.List)
            .filter((o) => {
                let alreadyPreceedingTask = _.findIndex(preceedingTask, (succId) => {
                    return succId.linkTaskId == o.id
                });
                let alreadySuccedingTask = _.findIndex(succedingTask, (succId) => {
                    return succId.linkTaskId == o.id
                });
                return alreadyPreceedingTask < 0 && alreadySuccedingTask < 0 && task.Selected.id != o.id;
            })
            .map((e) => {
                return { id: e.id, name: e.task }
            })
            .value();

        let allowToComplete = true;

        if ((task.Selected).periodic == 1 && (task.Selected).periodTask != null) {
            const prevDueDate = moment((task.Selected).dueDate).subtract((task.Selected).periodType, (task.Selected).period).format('YYYY-MM-DD');
            let taskBefore = _.filter((task.List), (e) => {
                return moment(e.dueDate).format('YYYY-MM-DD') == prevDueDate && (e.periodTask == (task.Selected).periodTask || e.periodTask == null) && (task.Selected).status != "Completed"
            });

            if (taskBefore.length > 0) {
                allowToComplete = (taskBefore[0].status == "Completed") ? true : false;
            }
        }

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type : "SET_TASK_FORM_ACTIVE" , FormActive : "List" })
                        dispatch({ type : "SET_TASK_FORM_ACTION" , FormAction : "" })
                        dispatch({ type : "SET_TASK_SELECTED" , Selected : {} })
                    }} >
                    <span>Back</span>
                </li>
                </HeaderButtonContainer>
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h3 class="panel-title">Task {(task.Selected.id) ? " > ID: " + task.Selected.id : ""}</h3>
                    </div>
                    <div class="panel-body">
                    <Tabs class="mb40">
                        <TabList>
                            <Tab>Overview</Tab>
                            <Tab>Dependents</Tab>
                        </TabList>
                        <TabPanel>
                            <h4 class="mt20 mb20">
                                {(taskStatus == 0) && <span class="fa fa-circle fa-lg" style={{ color: "#27ae60" }}></span>}
                                {(taskStatus == 1) && <span class="fa fa-circle fa-lg" style={{ color: "#f39c12" }}></span>}
                                {(taskStatus == 2) && <span class="fa fa-exclamation-circle fa-lg" style={{ color: "#c0392b" }}></span>}
                                &nbsp; &nbsp;{task.Selected.task} &nbsp;&nbsp;
                                {(task.Selected.status == "Completed") && "( Completed )"}
                                {(!task.Selected.status || task.Selected.status == "In Progress") && "( In Progress )"}
                                {(task.Selected.status == "For Approval") && "( For Approval )"}
                            </h4>

                            <div class="form-group text-center mt20 mb20">
                                {(isVisible && allowToComplete && task.Selected.status != "For Approval") &&
                                    <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Mark Task as Completed" onClick={() => this.markTaskAsCompleted()}>Complete Task</a>
                                }
                                {(task.Selected.status == "For Approval" && task.Selected.approverId == loggedUser.data.id) &&
                                    <span>
                                        <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Mark Task as Completed" onClick={() => this.approveTask()}>Approve</a>
                                        <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Reject Task" onClick={() => this.rejectTask()}>Reject</a>
                                    </span>
                                }
                                {(task.Selected.followersName != null && task.Selected.followersIds.split(",").filter(e => { return e == loggedUser.data.id }).length > 0)
                                    ? <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Unfollow task" onClick={() => this.unFollowTask()}>Unfollow Task</a>
                                    : <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Follow task" onClick={() => this.followTask()}>Follow Task</a>
                                }
                            </div>

                            {
                                (typeof task.Selected.description != "undefined"
                                    && task.Selected.description != ""
                                    && task.Selected.description != null) && <p class="mt10 mb10">{task.Selected.description}</p>
                            }
                            <div class="row">
                                <div className={(task.Selected.periodic == 1) ? "col-md-6" : "col-md-12"}>
                                    <div class="details">
                                        <span class="fa fa-calendar"></span>
                                        <p>Start date: {moment(task.Selected.startDate).format('ll')}</p>
                                    </div>
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
                                        <span class="fa fa-calendar"></span>
                                        <p>Due date: {moment(task.Selected.dueDate).format('ll')}</p>
                                    </div>
                                </div>
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
                                                let isEditable = (loggedUser.data.id == o.createdBy)
                                                    || loggedUser.data.userRole == 1
                                                    || loggedUser.data.userRole == 2
                                                    || project.Selected.projectManagerId == loggedUser.data.id 
                                                        ? true : false
                                                return (
                                                    <div className={(isEditable || task.Selected.assignedById == loggedUser.data.id) ? (o.completed == 1) ? "wrapper completed" : "wrapper" : "wrapper-disabled"} key={index}
                                                    >
                                                        <p>{o.description}</p>
                                                        <div id="checklist-action">
                                                            {
                                                                _.map(o.types, (o, index) => {
                                                                    return (
                                                                        <p class="m0" key={index}><span class="label label-success">{o.value}</span></p>
                                                                    )
                                                                })
                                                            }
                                                            {
                                                                (o.documents != null) &&
                                                                _.map(o.documents, (o, index) => {
                                                                    return (
                                                                        <p class="m0" key={index}><span class="label label-primary">{o.origin}</span></p>
                                                                    )
                                                                })
                                                            }
                                                            <p style={{ marginTop: 5, fontSize: 10 }}>
                                                                <span>By : {o.users_firstName + ' ' + o.users_lastName + ' - ' + moment(o.dateAdded).format("MMM DD, YYYY")}</span>
                                                            </p>
                                                            
                                                            { (isEditable || (task.Selected.assignedById == loggedUser.data.id)) &&
                                                                <div class="checklist-actions">
                                                                    <a class="btn btn-success"
                                                                        onClick={() => {
                                                                            socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: { id: o.id, completed: (o.completed != 1) ? 1 : 0 } })
                                                                        }}
                                                                    >
                                                                        {
                                                                            o.completed ? <span class="glyphicon glyphicon-unchecked"></span> : <span class="glyphicon glyphicon-check"></span>
                                                                        }
                                                                    </a>
                                                                    {(o.createdBy == loggedUser.data.id || loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) &&
                                                                        <a class="btn btn-primary" onClick={() => { this.editChecklist(o)}} >
                                                                            <span class="glyphicon glyphicon-pencil"></span>
                                                                        </a>
                                                                    }
                                                                    {(o.createdBy == loggedUser.data.id || loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) &&
                                                                        <a class="btn btn-danger" onClick={() => { socket.emit("DELETE_CHECKLIST", { data: o.id }) }} >
                                                                            <span class="glyphicon glyphicon-trash"></span>
                                                                        </a>
                                                                    }
                                                                </div>
                                                            }
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                }
                                {(task.Selected.isActive > 0) &&
                                    <div class="row" style={{ paddingLeft: 15 }}>
                                        <div class="col-md-12 pdr0">
                                            {
                                                ((task.Selected.assignedById == loggedUser.data.id) || loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 || project.Selected.projectManagerId == loggedUser.data.id) &&
                                                <div class="form-group" style={{ marginBottom: 10 }}>
                                                    <label>Item</label>
                                                    <input type="text" name="checklist"
                                                        class="form-control"
                                                        placeholder="Add Item"
                                                        onChange={this.handleChange}
                                                        value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}

                                                    />
                                                    <label class="checkbox-inline pd0" style={{ fontWeight: "bold" }}>
                                                        Document ?
                                                        <input type="checkbox"
                                                            checked={checklist.Selected.isDocument ? true : false}
                                                            onChange={() => { }}
                                                            onClick={(f) => { this.handleCheckbox("isDocument", (checklist.Selected.isDocument) ? 0 : 1) }}
                                                        />
                                                    </label>
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
                                    <div class="row" style={{ paddingLeft: 22 }}>
                                        <div class="col-md-12 pdr0">
                                            {
                                                (checklist.Action != "Edit") ?

                                                    <a href="javascript:void(0);" class="btn btn-primary" title="Add"
                                                        onClick={this.addChecklist}
                                                    >
                                                        Add
                                                        </a>
                                                    :
                                                    <div class="checklist-actions">
                                                        <a href="javascript:void(0);" class="btn btn-primary mt5" title="Save"
                                                            onClick={this.saveChecklist}
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

                            {(task.Selected.isActive > 0) &&
                                <div style={{ position: "relative" }} class="mt20">
                                    <h5 class="mb0">Documents</h5>
                                    {((task.Selected.assignedById == loggedUser.data.id) || loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) &&
                                        <a href="javascript:void(0)" class="task-action" data-toggle="modal" data-target="#uploadFileModal" onClick={() => dispatch({ type: "SET_TASK_MODAL_TYPE", ModalType: "task" })}>Add</a>
                                    }
                                </div>
                            }

                            <div id="documentList">
                                {(documentList.length > 0) &&
                                    (documentList).map((data, index) => {
                                        return (
                                            <div class="details pt10" key={index}>
                                                <span class="fa fa-paperclip"></span>
                                                <span class="fa fa-file"></span>
                                                <p class="m0">{data.origin}</p>
                                            </div>
                                        )
                                    })
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
                            <div>
                                <h5 class="mt10">Precedes</h5>
                                <div class="pdl15 pdr15">
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
                                                            <td></td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                    {
                                        (preceedingTask.length == 0) && <p class="text-center m0">No Record Found!</p>
                                    }
                                </div>
                            </div>
                            <div class="mb20">
                                <h5 class="mt10">Depends On</h5>
                                <div class="pdl15 pdr15">
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
                                                            <td></td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                    {
                                        (succedingTask.length == 0) && <p class="text-center m0">No Record Found!</p>
                                    }
                                </div>
                            </div>
                            {(task.Selected.isActive > 0) &&
                                <div class="row" style={{ marginLeft: 7 }}>
                                    <div class="col-md-4 pdr0">
                                        <label>Dependency Type</label>
                                        <DropDown multiple={false}
                                            required={false}
                                            options={_.map(['Preceding', 'Succeeding'], (o) => { return { id: o, name: o } })}
                                            selected={(typeof task.Selected.dependencyType == "undefined") ? "" : task.Selected.dependencyType}
                                            onChange={(e) => {
                                                this.setDropDown("dependencyType", (e == null) ? "" : e.value);
                                            }}
                                            isClearable={true}
                                        />
                                        {
                                            (
                                                (typeof task.Selected.dependencyType != "undefined" &&
                                                    typeof task.Selected.linkTaskIds != "undefined") &&
                                                (task.Selected.dependencyType != "" &&
                                                    task.Selected.linkTaskIds != "")
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
                                            required={typeof task.Selected.dependencyType != "undefined"
                                                && (task.Selected.dependencyType != "" &&
                                                    task.Selected.dependencyType != null)}
                                            options={dependentTaskList}
                                            selected={(typeof task.Selected.linkTaskIds == "undefined") ? [] : task.Selected.linkTaskIds}
                                            onChange={(e) => this.setDropDownMultiple("linkTaskIds", e)}
                                        />
                                    </div>
                                </div>
                            }
                        </TabPanel>
                    </Tabs>
                    <Tabs>
                        <TabList>
                            <Tab>Comments</Tab>
                            <Tab>Activities</Tab>
                        </TabList>
                        <TabPanel>
                            <TaskComment />
                        </TabPanel>
                        <TabPanel>
                        </TabPanel>
                    </Tabs>
                    <UploadModal />
                    <ApprovalModal />
                    <RejectMessageModal />
                </div>
            </div>
        </div>
        )
    }
}