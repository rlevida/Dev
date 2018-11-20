import React from "react";
import _ from 'lodash';
import { connect } from "react-redux";

import { showToast, setDatePicker } from '../../../globalFunction';
import { DropDown } from "../../../globalComponents";

@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        loggedUser: store.loggedUser,
        role: store.role,
        global: store.global,
        project: store.project
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            nationalityList: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentWillMount() {
        // this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "teamList" });
    }

    componentDidMount() {
        $(".form-container").validator();
        setDatePicker(this.handleDate, "birthday");
    }

    componentDidUpdate() {
        setDatePicker(this.handleDate, "birthday");
    }

    handleDate(e) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { socket, users, dispatch } = this.props

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

        if (typeof users.Selected.avatar == "undefined" || !users.Selected.avatar) {
            users.Selected.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }
        users.Selected.firstName = users.Selected.firstName.trim()
        users.Selected.lastName = (typeof users.Selected.lastName != 'undefined') ? users.Selected.lastName.trim() : '';
        socket.emit("SAVE_OR_UPDATE_USER", { data: users.Selected });

        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_USER_SELECTED", Selected: {} });
    }

    setDropDown(name, value) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[name] = value;

        if (name == "userType") {
            Selected["userRole"] = ""
            Selected["team"] = []
        }

        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[name] = values;
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    render() {
        let { dispatch, users, loggedUser, role, global, project } = this.props
        let userType = [{ id: "External", name: "External" }];

        if (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2) {
            userType.push({ id: "Internal", name: "Internal" });
        }

        let teamList = (typeof global.SelectList["teamList"] != "undefined") ? global.SelectList["teamList"].map((e, i) => {
            return { id: e.id, name: e.team }
        }) : [];
        let userRole = _(role.List)
            .filter((o) => {
                if (loggedUser.data.userRole == 1) {
                    return o.id > 0 && o.roleType == users.Selected.userType;
                } else if (loggedUser.data.userRole == 2) {
                    return o.id > 1 && o.roleType == users.Selected.userType;
                } else if (loggedUser.data.userRole == 3) {
                    return o.roleType == "External";
                }
            })
            .map((e) => {
                return { id: e.id, name: e.role }
            })
            .value();
        let projectList = _.filter(project.List, (o) => {
            return o.projectManagerId == loggedUser.data.id
        });

        return <div>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">User {(users.Selected.id) ? " > Edit > ID: " + users.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">User Id *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="username" required value={(typeof users.Selected.username == "undefined") ? "" : users.Selected.username} class="form-control" placeholder="User Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Email Address *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="email" name="emailAddress" required value={(typeof users.Selected.emailAddress == "undefined") ? "" : users.Selected.emailAddress} class="form-control" placeholder="email Address" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">First Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="firstName" required value={(typeof users.Selected.firstName != "undefined" && users.Selected.firstName) ? users.Selected.firstName : ""} class="form-control" placeholder="First Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Last Name</label>
                                    <div class="col-md-7 col-xs-text">
                                        <input type="text" name="lastName" value={(typeof users.Selected.lastName != "undefined" && users.Selected.lastName) ? users.Selected.lastName : ""} class="form-control" placeholder="Last Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Phone No.</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="number" name="phoneNumber" value={(typeof users.Selected.phoneNumber != "undefined" && users.Selected.phoneNumber) ? users.Selected.phoneNumber : ""} class="form-control" placeholder="Phone Number" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">User Type *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false}
                                            required={true}
                                            options={userType}
                                            selected={(typeof users.Selected.userType == "undefined") ? "" : users.Selected.userType}
                                            onChange={(e) => {
                                                this.setDropDown("userType", e.value);
                                            }} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                {
                                    (typeof users.Selected.userType != "undefined" && users.Selected.userType != "") && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">User Role *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown multiple={false}
                                                required={true}
                                                options={userRole}
                                                selected={(typeof users.Selected.userRole == "undefined") ? "" : users.Selected.userRole}
                                                onChange={(e) => this.setDropDown("userRole", e.value)} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                {
                                    (users.Selected.userType == "External") &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Company</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="company" value={(typeof users.Selected.company == "undefined") ? "" : users.Selected.company} class="form-control" placeholder="Company" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                {
                                    (users.Selected.userType == 'Internal') && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Team</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown multiple={true}
                                                required={false}
                                                options={teamList}
                                                selected={(typeof users.Selected.team == "undefined") ? [] : users.Selected.team}
                                                onChange={(e) => this.setDropDownMultiple("team", e)} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                {
                                    (loggedUser.data.userRole == 3 && users.Selected.userType == "External") && <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Project</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown multiple={true}
                                                required={true}
                                                options={(projectList).map((o) => { return { id: o.id, name: o.project } })}
                                                selected={(typeof users.Selected.user_projects == "undefined") ? [] : users.Selected.user_projects}
                                                onChange={(e) => this.setDropDownMultiple("user_projects", e)}
                                            />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                            </form>

                            <a class="btn btn-primary" style={{ float: "left", cursor: "pointer", margin: "10px" }} onClick={(e) => {
                                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
                                dispatch({ type: "SET_USER_SELECTED", Selected: {} });
                            }} ><span>Back</span>
                            </a>
                            <a class="btn btn-primary" style={{ float: "right", cursor: "pointer", margin: "10px" }} onClick={this.handleSubmit}  >
                                <span>Save</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    }
}