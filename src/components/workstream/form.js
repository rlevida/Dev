import React from "react";
import { showToast, putData, postData, getData } from '../../globalFunction';
import { DropDown, HeaderButtonContainer, Loading } from "../../globalComponents";
import { connect } from "react-redux";
import _ from "lodash";


import TaskFilter from "../task/taskFilter";
import Document from "./document";
import Task from "./task";
import Member from "./member";
import Timeline from "../task/timeline";
import Calendar from "../task/calendar";
import Conversation from "./conversations"

let keyTimer = "";

@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        users: store.users,
        status: store.status,
        members: store.members,
        teams: store.teams,
        type: store.type,
        global: store.global,
        document: store.document
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.setDropDown = this.setDropDown.bind(this);
        this.deleteData = this.deleteData.bind(this);
        this.handleCheckbox = this.handleCheckbox.bind(this);
        this.resetData = this.resetData.bind(this);
        this.getMemberList = this.getMemberList.bind(this);
        this.getWorkstreamTemplateList = this.getWorkstreamTemplateList.bind(this);
    }

    componentDidMount() {
        const { dispatch, workstream } = this.props;
        $(".form-container").validator();

        if ((workstream.SelectedId).length > 0) {
            getData(`/api/workstream/detail/${workstream.SelectedId[0]}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: _.map([...c.data.responsible], (responsibleObj) => { return { ...responsibleObj.user, name: responsibleObj.user.firstName + " " + responsibleObj.user.lastName } }) });
                    dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ...c.data, responsible: ((c.data.responsible).length > 0) ? c.data.responsible[0].user.id : "" } });
                } else {
                    showToast("error", "Error retrieving workstream. Please try again later.");
                }
            });
        }

        getData(`/api/globalORM/selectList?selectName=type`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'typeList' });
        });


        getData(`/api/member/selectList?linkType=project&linkId=${project}&page=1`, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
        });

        getData(`/api/workstream?page=1&isActive=1&isTemplate=1`, {}, (c) => {
            if (c.status == 200) {
                dispatch({
                    type: "SET_WORKSTREAM_SELECT_LIST", List: _.map(c.data.result, (workstreamObj) => {
                        return {
                            ..._.pick(workstreamObj, ["id", "workstream", "type", "description"]),
                            name: workstreamObj.workstream + " - " + workstreamObj.project.project,
                            typeId: workstreamObj.type.id
                        }
                    })
                });
            }
        });
    }

    handleChange(e) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleCheckbox(name, value) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleSubmit() {
        const { workstream, dispatch, loggedUser } = this.props;
        const dataToBeSubmitted = {
            ..._.pick(workstream.Selected, ["workstream", "description", "typeId"]),
            projectId: project,
            numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0,
            isActive: (typeof workstream.Selected.isActive == 'undefined') ? 1 : workstream.Selected.isActive,
            isTemplate: (typeof workstream.Selected.isTemplate == 'undefined') ? 0 : workstream.Selected.isTemplate,
            responsible: workstream.Selected.responsible,
            workstreamTemplate: workstream.Selected.workstreamTemplate,
            userId: loggedUser.data.id
        }

        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }


        if (typeof workstream.Selected.id != "undefined" && workstream.Selected.id != "") {
            putData(`/api/workstream/${workstream.Selected.id}`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
                    this.resetData();
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        } else {
            postData(`/api/workstream`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
                    this.resetData();
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }

    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    setDropDown(name, value) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;

        if (name == "workstreamTemplate") {
            const selectedWorkstreamTemplate = _.find(workstream.SelectList, (o) => { return o.id == value; });
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ..._.omit(selectedWorkstreamTemplate, ["id"]), [name]: value } });
        } else {
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
        }
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    resetData() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
        dispatch({ type: "SET_MEMBERS_LIST", list: [] });
        dispatch({ type: "SET_MEMBER_SELECT_LIST", List: [] });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_WORKSTREAM_LOADING" });
        dispatch({ type: "SET_TASK_SELECTED", Selected: {} });
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" });
        dispatch({ type: "SET_WORKSTREAM_ID", SelectedId: [] });
        window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
    }

    getMemberList(options) {
        const { dispatch } = this.props;

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member?linkType=project&linkId=${project}&page=1&memberName=${options}`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
                });
            }, 500)
        } else {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member/selectList?linkType=project&linkId=${project}&page=1`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
                });
            }, 500)
        }
    }

    getWorkstreamTemplateList(options) {
        const { dispatch } = this.props;

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/workstream?page=1&isActive=1&isTemplate=1&workstream=${options}`, {}, (c) => {
                    const workstreamOptions = (c.status == 200) ? _.map(c.data.result, (workstreamObj) => { return { ..._.pick(workstreamObj, ["id", "workstream", "type", "description"]), name: workstreamObj.workstream, typeId: workstreamObj.type.id } }) : [];
                    dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
                });
            }, 1500)
        }
    }

    render() {
        const { workstream, global, members } = this.props;
        const typeList = (typeof global.SelectList.typeList != "undefined") ? _(global.SelectList.typeList)
            .filter((e, i) => {
                return e.linkType == "workstream";
            })
            .map((o, i) => { return { id: o.id, name: o.type } })
            .value()
            : [];
        return <div>
            <HeaderButtonContainer withMargin={true}>
                {
                    (typeof workstream.SelectedLink == "undefined" || workstream.SelectedLink == "") && <li class="btn btn-info" style={{ marginRight: "2px" }}
                        onClick={(e) => this.resetData()} >
                        <span>Back</span>
                    </li>
                }
                {
                    (typeof workstream.SelectedLink == "undefined" || workstream.SelectedLink == "") &&
                    <li class="btn btn-info" onClick={() => this.handleSubmit()} >
                        <span>Save</span>
                    </li>
                }
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            {(workstream.SelectedLink == "") && <div>
                                {
                                    (workstream.Loading == "RETRIEVING") && <Loading />
                                }
                                {
                                    (workstream.Loading != "RETRIEVING") && <form class="form-horizontal form-container">
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Active</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="checkbox"
                                                    style={{ width: "15px", marginTop: "10px" }}
                                                    checked={(workstream.Selected.isActive == 1 || typeof workstream.Selected.isActive == 'undefined') ? true : false}
                                                    onChange={() => { }}
                                                    onClick={(f) => { this.handleCheckbox("isActive", (workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? 0 : 1) }}
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Workstream Template</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="checkbox"
                                                    style={{ width: "15px", marginTop: "10px" }}
                                                    checked={(workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? false : true}
                                                    onClick={(f) => { this.handleCheckbox("isTemplate", (workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? 1 : 0) }}
                                                />
                                            </div>
                                        </div>
                                        {
                                            (typeof workstream.Selected.id == 'undefined' || workstream.Selected.id == "") && <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Copy Template</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <DropDown
                                                        required={false}
                                                        options={workstream.SelectList}
                                                        onInputChange={this.getWorkstreamTemplateList}
                                                        selected={(typeof workstream.Selected.workstreamTemplate == "undefined") ? "" : workstream.Selected.workstreamTemplate}
                                                        placeholder={"Type to search Workstream"}
                                                        onChange={(e) => {
                                                            this.setDropDown("workstreamTemplate", (e == null) ? "" : e.value);
                                                        }}
                                                        isClearable={true}
                                                    />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                        }
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Workstream *</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="text" name="workstream" required value={(typeof workstream.Selected.workstream == "undefined") ? "" : workstream.Selected.workstream} class="form-control" placeholder="Workstream" onChange={this.handleChange} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Type</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown multiple={false}
                                                    required={false}
                                                    options={typeList}
                                                    selected={(typeof workstream.Selected.typeId == "undefined") ? "" : workstream.Selected.typeId}
                                                    onChange={(e) => {
                                                        this.setDropDown("typeId", e.value);
                                                    }} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        {
                                            (typeof workstream.Selected.typeId != "undefined" && workstream.Selected.typeId == 5) && <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Number of Hours</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="number" name="numberOfHours" required value={(typeof workstream.Selected.numberOfHours == "undefined") ? "" : workstream.Selected.numberOfHours} class="form-control" placeholder="Number of Hours" onChange={this.handleChange} />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                        }
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Description</label>
                                            <div class="col-md-7 col-xs-12">
                                                <textarea name="description" value={(typeof workstream.Selected.description == "undefined" || workstream.Selected.description == null) ? "" : workstream.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label pt0">Responsible *</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown
                                                    required={true}
                                                    options={members.SelectList}
                                                    onInputChange={this.getMemberList}
                                                    selected={(typeof workstream.Selected.responsible == "undefined") ? "" : workstream.Selected.responsible}
                                                    placeholder={"Type to Search Member"}
                                                    onChange={(e) => {
                                                        this.setDropDown("responsible", (e == null) ? "" : e.value);
                                                    }}
                                                    isClearable={true}
                                                />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                    </form>
                                }
                            </div>
                            }
                            {
                                (workstream.SelectedLink != "" && (workstream.SelectedLink == "task" || workstream.SelectedLink == "timeline" || workstream.SelectedLink == "calendar")) &&
                                <div class="row mb10 mt10">
                                    <div class="col-lg-12">
                                        <TaskFilter />
                                    </div>
                                </div>
                            }
                            {
                                (workstream.SelectedLink == "task") && <div>
                                    <h3 class="m0">Tasks</h3>
                                    <Task />
                                </div>
                            }
                            {
                                (workstream.SelectedLink == "timeline") && <Timeline />
                            }
                            {
                                (workstream.SelectedLink == "calendar") && <Calendar />
                            }
                            {
                                (workstream.SelectedLink == "document") && <Document />
                            }
                            {
                                (workstream.SelectedLink == "member") && <Member />
                            }
                            {
                                (workstream.SelectedLink == "conversation") && <Conversation />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}