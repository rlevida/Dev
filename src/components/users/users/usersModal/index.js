import React from "react";
import { DropDown } from "../../../../globalComponents";
import { showToast, postData, putData, setDatePicker } from '../../../../globalFunction';
import _ from 'lodash'
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        project: store.project,
        folder: store.folder,
        users: store.users

    }
})
export default class UsersModal extends React.Component {
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
    componentDidMount() {
        const { dispatch } = this.props;
        $(".form-container").validator();
        setDatePicker(this.handleDate, "birthday");
        $('#usersModal').on('hidden.bs.modal', function (e) {
            dispatch({ type: 'SET_USER_SELECTED', Selected: {} })
            dispatch({ type: 'SET_CURRENT_DATA_SELECTED', Selected: {} })
        })
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
        $('.form-container users-modal *').validator('validate');
        $('.form-container users-modal .form-group').each(function () {
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

        if (typeof users.Selected.id == 'undefined') {
            postData(`/api/user`, users.Selected, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message)
                } else {
                    dispatch({ type: 'ADD_USER_LIST', List: c.data });
                    showToast('success', 'Successfully Added.');
                    $(`#usersModal`).modal('hide');
                }
            })
        } else {
            let dataToSubmit = { id: users.CurrentData.id, emailAddress: users.Selected.emailAddress, username: users.Selected.username }
            _.keys(users.CurrentData).map((e) => {
                if (JSON.stringify(users.CurrentData[e]) !== JSON.stringify(users.Selected[e])) {
                    dataToSubmit = { ...dataToSubmit, [e]: users.Selected[e] }
                }
            })

            putData(`/api/user/${users.Selected.id}`, dataToSubmit, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message)
                } else {
                    dispatch({ type: 'UPDATE_DATA_USER_LIST', UpdatedData: c.data })
                    showToast('success', 'Successfully Updated.');
                    $(`#usersModal`).modal('hide');
                }
            })
        }
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
        let { users, loggedUser, global, project } = this.props
        let userType = [{ id: "External", name: "External" }];

        if (loggedUser.data.user_role[0].roleId == 1 || loggedUser.data.user_role[0].roleId == 2) {
            userType.push({ id: "Internal", name: "Internal" });
        }

        let teamList = (typeof global.SelectList.teamList != "undefined") ? global.SelectList.teamList.map((e, i) => {
            return { id: e.id, name: e.team }
        }) : [];

        let userRole = _(global.SelectList.roleList)
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
            <div class="modal fade" id="usersModal" tabIndex="-1" role="dialog" aria-labelledby="usersModalLabel" aria-hidden="true" data-keyboard="false" data-backdrop="static">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5 class="modal-title" id="usersModalLabel">
                                User
                            </h5>
                        </div>
                        <div class="modal-body">
                            <form class="form-horizontal form-container users-modal">
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
                                                selected={
                                                    (typeof users.Selected.team == "undefined") ? [] : users.Selected.team.map((e) => { return typeof e.value != "undefined" ? { value: e.value } : { value: e.id } })}
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
                                                selected={(typeof users.Selected.project == "undefined") ? [] : users.Selected.project}
                                                onChange={(e) => this.setDropDownMultiple("project", e)}
                                            />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            {!(_.isEqual(users.Selected, users.CurrentData)) &&
                                <button type="button" class="btn btn-primary" onClick={() => this.handleSubmit()}>Save</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}