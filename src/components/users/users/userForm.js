import React from "react";
import { DropDown } from "../../../globalComponents";
import { showToast, postData, putData } from '../../../globalFunction';
import _ from 'lodash';
import { connect } from "react-redux";
@connect((store) => {
    return {
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
export default class UserForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            'handleChange',
            'handleSubmit',
            'setDropDown',
            'handleDate',
            'handleChangePassword'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidMount() {
        $(".users-modal").validator();
    }

    handleDate(e) {
        let { dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    handleChange(e) {
        let { dispatch, users } = this.props
        let Selected = Object.assign({}, users.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        const { users, dispatch } = this.props;
        let result = true;

        $('#user-form *').validator('validate');
        $('#user-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        const dataToBeSubmitted = {
            ...users.Selected,
            ...(typeof users.Selected.firstName != "undefined" && typeof users.Selected.lastName != "undefined") ? {
                firstName: users.Selected.firstName.trim(),
                lastName: users.Selected.lastName.trim()
            } : {}
        };

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        }

        if (typeof dataToBeSubmitted.avatar == "undefined" || !dataToBeSubmitted.avatar) {
            dataToBeSubmitted.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }

        if (typeof dataToBeSubmitted.id == 'undefined') {
            postData(`/api/user`, dataToBeSubmitted, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message)
                } else {
                    dispatch({ type: 'ADD_USER_LIST', List: c.data });
                    showToast('success', 'User successfully added.');
                }

                $("#user-form").validator('destroy');
                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
            });
        } else {
            let dataToSubmit = { id: users.CurrentData.id, emailAddress: dataToBeSubmitted.emailAddress, username: dataToBeSubmitted.username }
            _.keys(users.CurrentData).map((e) => {
                if (JSON.stringify(users.CurrentData[e]) !== JSON.stringify(users.Selected[e])) {
                    dataToSubmit = { ...dataToSubmit, [e]: users.Selected[e] }
                }
            })

            putData(`/api/user/${dataToBeSubmitted.id}`, dataToSubmit, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message)
                } else {
                    dispatch({ type: 'UPDATE_DATA_USER_LIST', UpdatedData: c.data })
                    showToast('success', 'User successfully updated.');
                }

                $("#user-form").validator('destroy');
                dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
            })
        }
    }

    setDropDown(name, value) {
        const { dispatch, users } = this.props;
        let Selected = Object.assign({}, users.Selected);
        Selected[name] = value;

        if (name == "userType") {
            Selected["userRole"] = ""
            Selected["team"] = []
        }

        dispatch({ type: "SET_USER_SELECTED", Selected: Selected });
    }

    setDropDownMultiple(name, values) {
        const { dispatch, users } = this.props;
        let Selected = Object.assign({}, users.Selected);
        Selected[name] = values;
        dispatch({ type: "SET_USER_SELECTED", Selected: Selected });
    }

    handleChangePassword() {
        const { dispatch, users } = { ...this.props };
        const { password, confirmPassword, id } = users.Selected;
        let result = true;

        $('#user-password *').validator('validate');
        $('#user-password .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        }

        if (password != confirmPassword) {
            showToast('error', 'Password and confirm password must be the same.');
        } else if (password.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
        } else {
            const data = {
                password,
                confirmPassword,
                id
            };

            putData(`/api/user/changePassword/${id}`, data, (c) => {
                if (c.status == 200) {
                    showToast('success', 'Password successfully changed.');
                    dispatch({ type: "SET_USER_SELECTED", Selected: _.omit(users.Selected, ['password', 'confirmPassword']) });
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            });
        }
    }

    render() {
        const { users, loggedUser, global, project } = this.props;
        const userType = [{ id: "External", name: "External" }];
        const teamList = (typeof global.SelectList.teamList != "undefined") ? global.SelectList.teamList.map((e) => {
            return { id: e.id, name: e.team }
        }) : [];
        const userRole = _(global.SelectList.roleList)
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
        const projectList = _.filter(project.List, (o) => {
            return o.projectManagerId == loggedUser.data.id
        });

        if (loggedUser.data.user_role[0].roleId <= 2) {
            userType.push({ id: "Internal", name: "Internal" });
        }

        return <div>
            <div class="mb20">
                <form id="user-form">
                    <div class="mb20">
                        <p class="form-header mb0">Users</p>
                        <p>All with <span class="text-red">*</span> are required.</p>
                    </div>
                    <div class="form-group">
                        <label>Username: <span class="text-red">*</span></label>
                        <input
                            type="text"
                            name="username"
                            required
                            value={(typeof users.Selected.username == "undefined") ? "" : users.Selected.username}
                            class="form-control"
                            placeholder="Enter username"
                            onChange={this.handleChange} />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>Email Address: <span class="text-red">*</span></label>
                        <input
                            type="email"
                            name="emailAddress"
                            required
                            value={(typeof users.Selected.emailAddress == "undefined") ? "" : users.Selected.emailAddress}
                            class="form-control"
                            placeholder="Enter valid email address"
                            onChange={this.handleChange}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>First name: <span class="text-red">*</span></label>
                        <input type="text"
                            name="firstName"
                            required
                            value={(typeof users.Selected.firstName != "undefined" && users.Selected.firstName) ? users.Selected.firstName : ""}
                            class="form-control"
                            placeholder="Enter first name"
                            onChange={this.handleChange}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>Last name: <span class="text-red">*</span></label>
                        <input
                            type="text"
                            name="lastName"
                            required
                            value={(typeof users.Selected.lastName != "undefined" && users.Selected.lastName) ? users.Selected.lastName : ""}
                            class="form-control"
                            placeholder="Enter last Name"
                            onChange={this.handleChange}
                        />
                        <div class="help-block with-errors"></div>
                    </div>
                    <div class="form-group">
                        <label>Phone Number: </label>
                        <input type="number" name="phoneNumber" value={(typeof users.Selected.phoneNumber != "undefined" && users.Selected.phoneNumber) ? users.Selected.phoneNumber : ""} class="form-control" placeholder="Enter phone number" onChange={this.handleChange} />
                    </div>
                    <div class="form-group">
                        <label>User Type: <span class="text-red">*</span></label>
                        <DropDown multiple={false}
                            required={true}
                            options={userType}
                            selected={(typeof users.Selected.userType == "undefined") ? "" : users.Selected.userType}
                            onChange={(e) => {
                                this.setDropDown("userType", e.value);
                            }} />
                        <div class="help-block with-errors"></div>
                    </div>
                    {
                        (typeof users.Selected.userType != "undefined" && users.Selected.userType != "") && <div class="form-group">
                            <label>User Role: <span class="text-red">*</span></label>
                            <DropDown multiple={false}
                                required={true}
                                options={userRole}
                                selected={(typeof users.Selected.userRole == "undefined") ? "" : users.Selected.userRole}
                                onChange={(e) => this.setDropDown("userRole", e.value)}
                                placeholder={"Select user role"}
                            />
                            <div class="help-block with-errors"></div>
                        </div>
                    }
                    {
                        (users.Selected.userType == "External") && <div class="form-group">
                            <label>Company:</label>
                            <input
                                type="text"
                                name="company"
                                value={(typeof users.Selected.company == "undefined") ? "" : users.Selected.company}
                                class="form-control"
                                placeholder="Enter company"
                                onChange={this.handleChange}
                            />
                            <div class="help-block with-errors"></div>
                        </div>
                    }
                    {
                        (users.Selected.userType == 'Internal') && <div class="form-group">
                            <label>Team:</label>
                            <DropDown multiple={true}
                                required={false}
                                options={teamList}
                                selected={
                                    (typeof users.Selected.team == "undefined") ? [] : users.Selected.team.map((e) => { return typeof e.value != "undefined" ? { value: e.value } : { value: e.id } })
                                }
                                onChange={(e) => this.setDropDownMultiple("team", e)}
                                placeholder={'Search or select team'}
                            />
                            <div class="help-block with-errors"></div>
                        </div>
                    }
                    {
                        (loggedUser.data.userRole == 3 && users.Selected.userType == "External") && <div class="form-group">
                            <label>Project:</label>
                            <DropDown multiple={true}
                                required={false}
                                options={(projectList).map((o) => { return { id: o.id, name: o.project } })}
                                selected={(typeof users.Selected.user_projects == "undefined") ? [] : users.Selected.user_projects}
                                onChange={(e) => this.setDropDownMultiple("user_projects", e)}
                            />
                        </div>
                    }
                    <a class="btn btn-violet" onClick={this.handleSubmit}>
                        <span>Add user</span>
                    </a>
                </form>
            </div>
            {
                (typeof users.Selected.id != "undefined" && users.Selected.id != "") && <div class="bt">
                    <form id="user-password">
                        <div class="mt20 mb20">
                            <p class="form-header mb0">Change Password</p>
                            <p>All with <span class="text-red">*</span> are required.</p>
                        </div>
                        <div class="form-group">
                            <label>New Password: <span class="text-red">*</span></label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={(typeof users.Selected.password == "undefined") ? "" : users.Selected.password}
                                class="form-control"
                                placeholder="Enter new password"
                                onChange={this.handleChange}
                            />
                            <div class="help-block with-errors"></div>
                        </div>
                        <div class="form-group">
                            <label>Confirm Password: <span class="text-red">*</span></label>
                            <input
                                type="password"
                                name="confirmPassword"
                                required
                                value={(typeof users.Selected.confirmPassword == "undefined") ? "" : users.Selected.confirmPassword}
                                class="form-control"
                                placeholder="Confirm password"
                                onChange={this.handleChange}
                            />
                            <div class="help-block with-errors"></div>
                        </div>
                        <a class="btn btn-violet" onClick={this.handleChangePassword}>
                            <span>Change user password</span>
                        </a>
                    </form>
                </div>
            }
        </div>
    }
}