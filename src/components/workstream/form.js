import React from "react"
import { showToast, putData, postData, getData } from '../../globalFunction'
import { DropDown, HeaderButtonContainer } from "../../globalComponents";
import { connect } from "react-redux";
import _ from "lodash";

import Document from "./document"
import Task from "./task"
import Member from "./member"

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

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.deleteData = this.deleteData.bind(this)
        this.handleCheckbox = this.handleCheckbox.bind(this)
        this.resetData = this.resetData.bind(this)
    }

    componentDidMount() {
        const { dispatch, document, workstream, task, loggedUser } = this.props;
        $(".form-container").validator();

        getData(`/api/globalORM/selectList?selectName=projectMemberList&linkId=${project}&linkType=project`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'projectMemberList' });
        });

        getData(`/api/globalORM/selectList?selectName=type`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'typeList' });
        });

        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstream=${workstream.Selected.id}&tagType=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
        });

        getData(`/api/document/getTaggedDocument?isDeleted=0&projectId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&workstream=${workstream.Selected.id}&tagType=document`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_LIST", List: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
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
        const { workstream, dispatch } = this.props;
        const dataToBeSubmitted = {
            ..._.pick(workstream.Selected, ["workstream", "description", "typeId"]),
            projectId: project,
            numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0,
            isActive: (typeof workstream.Selected.isActive == 'undefined') ? 1 : workstream.Selected.isActive,
            responsible: workstream.Selected.responsible
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
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        } else {
            postData(`/api/workstream`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
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
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    resetData() {
        let { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
        dispatch({ type: "SET_MEMBERS_LIST", list: [] });
        dispatch({ type: "SET_TASK_LIST", list: [] });
        dispatch({ type: "SET_WORKSTREAM_LOADING" });
        dispatch({ type: "SET_TASK_SELECTED", Selected: {} })
        dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "" })
        window.history.replaceState({}, document.title, "/project/" + `${project}/workstream/${workstreamId}`);
    }

    render() {
        const { workstream, global } = this.props
        const typeList = (typeof global.SelectList.typeList != "undefined") ? _(global.SelectList.typeList)
            .filter((e, i) => {
                return e.linkType == "workstream";
            })
            .map((o, i) => { return { id: o.id, name: o.type } })
            .value()
            : [];
        const projectUserList = (typeof global.SelectList.projectMemberList != "undefined") ?
            _(global.SelectList.projectMemberList)
                .filter((e, i) => {
                    const roleIndex = _.filter(e.user_role, (userRoleObj) => { return userRoleObj.roleId <= 4 });
                    return roleIndex.length > 0;
                })
                .map((o, i) => { return { id: o.id, name: o.firstName + " " + o.lastName } })
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
                            {(workstream.SelectedLink == "") &&
                                <form class="form-horizontal form-container">
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Active?</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="checkbox"
                                                style={{ width: "15px", marginTop: "10px" }}
                                                checked={(workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? true : false}
                                                onChange={() => { }}
                                                onClick={(f) => { this.handleCheckbox("isActive", (workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? 0 : 1) }}
                                            />
                                        </div>
                                    </div>
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
                                            <DropDown multiple={false}
                                                required={true}
                                                options={_.orderBy(projectUserList, ["name"], ["asc"])}
                                                selected={(typeof workstream.Selected.responsible == "undefined") ? "" : workstream.Selected.responsible}
                                                onChange={(e) => {
                                                    this.setDropDown("responsible", e.value);
                                                }} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                </form>
                            }
                            {(workstream.SelectedLink) == "task" &&
                                <Task />
                            }
                            {(workstream.SelectedLink == "document") &&
                                <Document />
                            }
                            {(workstream.SelectedLink == "member") &&
                                <Member />
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}