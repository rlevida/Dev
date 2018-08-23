import React from "react"
import Tooltip from "react-tooltip";
import { showToast } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents";
import MembersForm from "../global/members/membersForm";
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
        global: store.global
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
    }

    componentDidMount() {
        $(".form-container").validator();
        let { workstream } = this.props

        if (typeof workstream.Selected.id != 'undefined') {
            this.props.socket.emit("GET_MEMBERS_LIST", { filter: { linkId: workstream.Selected.id, linkType: 'workstream' } });
        }
    }

    handleChange(e) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleCheckbox(name,value) {
        let { socket, dispatch, workstream } = this.props
        let Selected = Object.assign({},workstream.Selected)
        Selected[name] = value;
        dispatch({type:"SET_WORKSTREAM_SELECTED",Selected:Selected})
    }

    handleSubmit() {
        let { socket, workstream } = this.props

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
        
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { ...workstream.Selected, projectId: project, numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0 } });
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

    render() {
        let { dispatch, workstream, status, type, global , users } = this.props
        let statusList = [], typeList = [], projectUserList = [];

        status.List.map((e, i) => { if (e.linkType == "workstream") { statusList.push({ id: e.id, name: e.status }) } })
        type.List.map((e, i) => { if (e.linkType == "workstream") { typeList.push({ id: e.id, name: e.type }) } })
        if(typeof global.SelectList.ProjectMemberList != "undefined"){
            global.SelectList.ProjectMemberList.map((e, i) => { 
                let roleId = users.List.filter(u => { return u.id == e.id })[0].role[0].role_id;
                    if( roleId == 1 || roleId == 2 || roleId == 3 || roleId == 4){
                        projectUserList.push({ id: e.id, name: e.username + " - " + e.firstName })  
                    }
            })
        }
        
        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
                        dispatch({ type: "SET_MEMBERS_LIST", list: [] });
                        dispatch({ type: "SET_SELECTED_WORKSTREAM_LINK", SelectedLink: "" });
                    }} >
                    <span>Back</span>
                </li>
                <li class="btn btn-info" onClick={()=>this.handleSubmit()} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Workstream {(workstream.Selected.id) ? " > Edit > ID: " + workstream.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            { ( workstream.SelectedLink == "") && 
                                <form class="form-horizontal form-container">
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Is Active?</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="checkbox" 
                                                style={{ width: "15px", marginTop: "10px" }}
                                                checked={ workstream.Selected.isActive?true:false  }
                                                onChange={()=>{}}
                                                onClick={(f)=>{ this.handleCheckbox("isActive",(workstream.Selected.isActive)?0:1) }}
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
                                        <label class="col-md-3 col-xs-12 control-label">Project Name *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="projectName" required value={(typeof workstream.Selected.projectName == "undefined") ? "" : workstream.Selected.projectName} class="form-control" placeholder="Project Name" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Project Description</label>
                                        <div class="col-md-7 col-xs-12">
                                            <textarea name="projectDescription" value={(typeof workstream.Selected.projectDescription == "undefined") ? "" : workstream.Selected.projectDescription} class="form-control" placeholder="Project Description" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label pt0">Responsible *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown multiple={false}
                                                required={true}
                                                options={projectUserList}
                                                selected={(typeof workstream.Selected.responsible == "undefined") ? "" : workstream.Selected.responsible}
                                                onChange={(e) => {
                                                    this.setDropDown("responsible", e.value);
                                                }} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                </form>
                            }

                            { ( workstream.SelectedLink == "" || workstream.SelectedLink == "task") &&
                                <Task />
                            }
                            { ( workstream.SelectedLink == "" || workstream.SelectedLink == "document") &&
                                <Document/>
                            }

                            { ( workstream.SelectedLink == "" || workstream.SelectedLink == "member") &&
                                <Member/>
                            }
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}