import React from "react";
import { setDatePicker } from '../../../globalFunction';
import { connect } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import UploadModal from "./uploadModal"
import moment from 'moment';
import _ from 'lodash';
import { DropDown } from "../../../globalComponents";


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
        checklist: store.checklist
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.setDropDownMultiple = this.setDropDownMultiple.bind(this);
        this.addChecklist = this.addChecklist.bind(this);
    }

    componentDidMount() {
        let { socket, task, workstream } = this.props

        $(".form-container").validator();
        setDatePicker(this.handleDate, "dueDate");

        if (typeof task.Selected.id != 'undefined') {
            socket.emit("GET_MEMBERS_LIST", { filter: { linkId: task.Selected.id, linkType: 'task' } });
            socket.emit("GET_CHECK_LIST", { filter: { taskId: task.Selected.id } });
        }

        if (typeof task.Selected.workstreamId != "undefined") {
            socket.emit("GET_DOCUMENT_LIST", { filter: { isDeleted: 0, linkId: workstream.Selected.id, linkType: 'project' } })
        }
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "dueDate");
    }


    followTask() {
        let { dispatch, socket, loggedUser, task, workstream } = this.props;
        socket.emit("SAVE_OR_UPDATE_MEMBERS", { data: { usersType: "users", userTypeLinkId: loggedUser.data.id, linkType: "task", linkId: task.Selected.id, memberType: "Follower" }, type: "workstream" })
        setTimeout(() => {
            socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: workstream.Selected.id }, type: "workstream" });
        }, 500)

    }

    unFollowTask(id) {
        let { dispatch, socket, loggedUser, task, workstream } = this.props;
        socket.emit("DELETE_MEMBERS", { filter: { userTypeLinkId: loggedUser.data.id, linkId: task.Selected.id, memberType: "Follower" }, type: "workstream" })
        setTimeout(() => {
            socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: workstream.Selected.id } });
        }, 500)
    }

    markTaskAsCompleted() {
        let { socket, task } = this.props;
        let status = "Completed"
        if (task.Selected.task_id && task.Selected.task_status != "Completed") {
            status = "For Approval"
        }
        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: task.Selected.id, status: status } })
    }

    handleChange(e) {
        let { checklist, dispatch } = this.props;
        let Selected = Object.assign({}, checklist.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected })
    }

    addChecklist() {
        const { checklist, task, socket } = this.props;
        const toBeSubmitted = {
            description: checklist.Selected.checklist,
            types: checklist.Selected.types,
            taskId: task.Selected.id
        };
        socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted })
    }

    handleCheckbox(name, value) {
        let { checklist, dispatch } = this.props
        let Selected = Object.assign({}, checklist.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected });
    }

    setDropDownMultiple(name, values) {
        let { checklist, dispatch } = this.props;
        let Selected = Object.assign({}, checklist.Selected);

        Selected[name] = values;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected })
    }

    render() {
        let { dispatch, task, status, global, loggedUser, document, workstream, checklist, socket } = this.props;
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

        return (
            <div class="pd20">
                <span class="pull-right" style={{ cursor: "pointer" }} onClick={() => { dispatch({ type: "SET_TASK_SELECTED", Selected: {} }); dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "List" }) }}><i class="fa fa-times-circle fa-lg"></i></span>
                <Tabs>
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
                        </h4>

                        <div class="form-group text-center mt20 mb20">
                            {(isVisible) &&
                                <a href="javascript:void(0);" class="btn btn-primary" style={{ margin: "5px" }} title="Mark Task as Completed" onClick={() => this.markTaskAsCompleted()}>Mark Task as Completed</a>
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
                        <table class="table responsive-table table-bordered mt10 mb10">
                            <tbody>
                                <tr>
                                    <td style={{ width: "10%" }}><span class="fa fa-calendar"></span></td>
                                    <td style={{ width: "10%" }}><span class=""></span>Start date:</td>
                                    <td style={{ width: "80%" }}><span class=""></span>{moment(task.Selected.startDate).format('ll')}</td>
                                </tr>
                                <tr>
                                    <td style={{ width: "10%" }}><span class="fa fa-calendar"></span></td>
                                    <td style={{ width: "10%" }}><span class=""></span>Due date:</td>
                                    <td style={{ width: "80%" }}><span class=""></span>{moment(task.Selected.dueDate).format('ll')}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table class="table responsive-table table-bordered mt10 mb10">
                            <tbody>
                                <tr>
                                    <td style={{ width: "10%" }}><span class="fa fa-user"></span></td>
                                    <td style={{ width: "10%" }}><span class=""></span>Follower</td>
                                    <td style={{ width: "80%" }}>
                                        {(task.Selected.followersName != null) &&
                                            task.Selected.followersName.split(",").map((user, index) => {
                                                return <span key={index}><i class="fa fa-user"> &nbsp;</i>{user}</span>
                                            })
                                        }
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ width: "10%" }}><span class="fa fa-user"></span></td>
                                    <td style={{ width: "10%" }}><span class=""></span>Approver</td>
                                    <td style={{ width: "80%" }}>{/* <span class="fa fa-user"></span> */}</td>
                                </tr>
                                {/* <tr>
                                            <td style={{width:"10%"}}><span class="fa fa-user"></span></td>
                                            <td style={{width:"10%"}}>Assignee</td>
                                            <td style={{width:"80%"}}>
                                                { (task.Selected.assignedBy != null) && 
                                                    <span><i class="fa fa-user"></i>{task.Selected.assignedby}</span>
                                                }
                                            </td>
                                        </tr> */}
                            </tbody>
                        </table>
                        <table class="table responsive-table table-bordered mt10 mb20">
                            <tbody>
                                <tr>
                                    <td style={{ width: "10%" }}><span class="fa fa-bell"></span></td>
                                    <td style={{ width: "10%" }}><span class=""></span>Reminders</td>
                                    <td style={{ width: "80%" }}>{ /*<span class="fa fa-user"></span>*/}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div>
                            <div style={{ position: 'relative' }}>
                                <h5 class="mt0">Checklist</h5>
                            </div>
                            <div id="checklist">
                                {
                                    _.map(checklist.List, (o, index) => {
                                        return (
                                            <div className={(o.completed == 1) ? "wrapper completed" : "wrapper"} key={index} onClick={() => {
                                                socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: { id: o.id, completed: (o.completed != 1) ? 1 : 0 } })
                                            }}>
                                                <p>{o.description}</p>
                                                {
                                                    _.map(o.types, (o, index) => {
                                                        return (
                                                            <span class="label label-success" key={index}>{o.value}</span>
                                                        )
                                                    })
                                                }
                                                <a class="btn btn-danger"
                                                    onClick={() => {
                                                        socket.emit("DELETE_CHECKLIST", { data: o.id })
                                                    }}
                                                >
                                                    <span class="glyphicon glyphicon-trash"></span>
                                                </a>
                                            </div>
                                        )
                                    })
                                }
                            </div>
                            <div class="row mt10" style={{ paddingLeft: 22 }}>
                                <div class="col-md-12">
                                    <div class="form-group" style={{ marginBottom: 0 }}>
                                        <input type="text" name="checklist"
                                            class="form-control"
                                            placeholder="Add Item"
                                            onChange={this.handleChange}
                                            value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}
                                        />
                                    </div>
                                    <div class="form-group" style={{ marginTop: 5, marginBottom: 0 }}>
                                        <label style={{ paddingRight: 20 }}>Checklist type</label>
                                        <DropDown multiple={true}
                                            required={false}
                                            options={_.map(['Mandatory', 'Document'], (o) => { return { id: o, name: o } })}
                                            selected={(typeof checklist.Selected.types == "undefined") ? [] : checklist.Selected.types}
                                            onChange={(e) => this.setDropDownMultiple("types", e)}
                                        />
                                    </div>
                                    {
                                        (typeof checklist.Selected.checklist != "undefined" && checklist.Selected.checklist != "") && <div>
                                            <a href="javascript:void(0);" class="btn btn-primary mt5" title="Add"
                                                onClick={this.addChecklist}
                                            >
                                                Add
                                            </a>
                                        </div>
                                    }
                                </div>
                            </div>
                        </div>
                        <div style={{ position: "relative" }}>
                            <h4>Documents</h4>
                            <a href="javascript:void(0)" class="task-action" data-toggle="modal" data-target="#uploadFileModal" >Add</a>
                        </div>
                        <table class="table responsive-table table-bordered mt10 mb10">
                            <tbody>
                                {(documentList.length > 0) &&
                                    documentList.map((data, index) => {
                                        return (
                                            <tr key={index}>
                                                <td><span class="fa fa-paperclip"></span></td>
                                                <td><span class="fa fa-file"></span></td>
                                                <td>{data.origin}</td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </TabPanel>
                    <TabPanel>
                        <h4 class="mt20 mb20">
                            {(taskStatus == 0) && <span class="fa fa-circle fa-lg" style={{ color: "#27ae60" }}></span>}
                            {(taskStatus == 1) && <span class="fa fa-circle fa-lg" style={{ color: "#f39c12" }}></span>}
                            {(taskStatus == 2) && <span class="fa fa-exclamation-circle fa-lg" style={{ color: "#c0392b" }}></span>}
                            &nbsp; &nbsp;{task.Selected.task} &nbsp;&nbsp;
                                    {(task.Selected.status == "Completed") && "( Completed )"}
                            {(!task.Selected.status || task.Selected.status == "In Progress") && "( In Progress )"}
                        </h4>
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
                                                        <td>{succTask.task.task}</td>
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
                        <div>
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
                    </TabPanel>
                </Tabs>
                <UploadModal />
            </div>
        )
    }
}