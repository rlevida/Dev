import React from "react";
import { connect } from "react-redux";
import _ from 'lodash';

import { DropDown } from "../../../globalComponents";
import { showToast, postData, putData, getData } from '../../../globalFunction';

let keyTimer = "";
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
        users: store.users,
        teams: store.teams

    }
})
export default class UserForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            'handleChange',
            'handleChangePassword',
            'handleDate',
            'handleSubmit',
            'setDropDown',
            'setTeamList',
            'fetchTeamList'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidMount() {
        this.fetchTeamList();
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
        const { users, dispatch, profileEdit = false, loggedUser } = this.props;
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
                lastName: users.Selected.lastName.trim(),
                dateAdded: moment().format('YYYY-MM-DD HH:mm:ss')
            } : {}
        };

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        }

        if (typeof dataToBeSubmitted.avatar == "undefined" || !dataToBeSubmitted.avatar) {
            dataToBeSubmitted.avatar = "https://s3-ap-southeast-1.amazonaws.com/cloud-cfo/production/profile_pictures/default.png";
        }

        if (typeof dataToBeSubmitted.id == 'undefined') {
            postData(`/api/user`, dataToBeSubmitted, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message);
                } else {
                    dispatch({ type: 'ADD_USER_LIST', List: c.data });
                    dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "List" });
                    showToast('success', 'User successfully added.');
                }

                $("#user-form").validator('destroy');
            });
        } else {
            let dataToSubmit = (profileEdit == false) ? users.Selected : _.pick(users.Selected, ['id', 'firstName', 'lastName', 'phoneNumber', 'emailAddress', 'username']);

            putData(`/api/user/${dataToSubmit.id}`, dataToSubmit, (c) => {
                if (c.data.error) {
                    showToast(`error`, c.data.message)
                } else {
                    dispatch({ type: 'UPDATE_DATA_USER_LIST', UpdatedData: c.data })
                    showToast('success', 'User successfully updated.');
                }

                if (profileEdit) {
                    dispatch({
                        type: "SET_LOGGED_USER_DATA",
                        data: _.merge(loggedUser.data, dataToSubmit)
                    });
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
        const { new_password, confirmPassword, id } = users.Selected;
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

        if (new_password != confirmPassword) {
            showToast('error', 'Password and confirm password must be the same.');
        } else if (new_password.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
        } else {
            const data = {
                password: new_password,
                confirmPassword,
                id
            };

            putData(`/api/user/changePassword/${id}`, data, (c) => {
                if (c.status == 200) {
                    showToast('success', 'Password successfully changed.');
                    dispatch({ type: "SET_USER_SELECTED", Selected: _.omit(users.Selected, ['new_password', 'confirmPassword']) });
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
            });
        }
    }

    setTeamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchTeamList(options);
        }, 1500);
    }

    fetchTeamList(options) {
        const { dispatch, users, profileEdit = false } = this.props;
        let fetchUrl = `/api/teams?page=1`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&name=${options}`;
        }
        getData(fetchUrl, {}, (c) => {
            const teamOptions = _(c.data.result)
                .map((e) => {
                    return {
                        id: e.id,
                        name: e.team,
                        teamLeader: e.teamLeader
                    }
                })
                .value();

            const teamSelectList = (profileEdit == false) ? _.uniqBy([...teamOptions, ..._.map(users.Selected.team, (o) => {
                return {
                    id: o.value,
                    name: o.label,
                    teamLeader: o.teamLeader
                }
            })], 'id') : teamOptions;

            dispatch({
                type: "SET_TEAM_SELECT_LIST",
                List: teamSelectList
            });
        });
    }

    render() {
        const { users, loggedUser, global, teams, profileEdit = false } = this.props;
        const { team = [] } = users.Selected;
        const userType = [{ id: "External", name: "External" }];
        const userRole = _(global.SelectList.roleList)
            .filter((o) => {
                if (loggedUser.data.userRole == 1) {
                    return o.id > 0 && o.roleType == users.Selected.userType;
                } else if (loggedUser.data.userRole == 2) {
                    return o.id > 1 && o.roleType == users.Selected.userType;
                } else if (loggedUser.data.userRole == 3) {
                    return o.id > 3 && o.roleType == users.Selected.userType;
                }
            })
            .map((e) => {
                return { id: e.id, name: e.role }
            })
            .value();
        const surpervisorSelectList = _(teams.SelectList)
            .map(({ teamLeader, id }) => { return { id: teamLeader.id, name: teamLeader.firstName + " " + teamLeader.lastName, teamId: id, image: teamLeader.avatar } })
            .filter((p) => {
                return _.includes(_.map(users.Selected.team, ({ value }) => { return value }), p.teamId);
            })
            .value();
        let teamList = [...teams.SelectList, ..._.map(team, ({ value: id, label: name, teamLeader }) => { return { id, name, teamLeader } })];

        if (loggedUser.data.user_role[0].roleId <= 3) {
            userType.push({ id: "Internal", name: "Internal" });
        }

        return <div class="row content-row">
            <div class="col-md-6" id={(typeof users.Selected.id != "undefined" && users.Selected.id != "") ? "user-form-wrapper" : ""}>
                <div>
                    <form id="user-form">
                        <div class="mb20">
                            <p class="form-header mb0">
                                {
                                    (profileEdit == false) ? "Users" : "Profile Information"
                                }
                            </p>
                            <p>All with <span class="text-red">*</span> are required.</p>
                        </div>
                        {
                            (profileEdit) && <div class="form-group">
                                <div class="profile-wrapper">
                                    <img src={users.Selected.avatar} alt="Profile Picture" class="img-responsive" />
                                    <a onClick={() => { $('#upload-picture').modal('show'); }}>
                                        <i class="fa fa-camera"></i>
                                    </a>
                                </div>
                            </div>
                        }
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

                        </div>
                        {
                            (profileEdit == false) &&
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

                            </div>
                        }
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

                        </div>
                        <div class="form-group">
                            <label>Last name: <span class="text-red">*</span></label>
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={(typeof users.Selected.lastName != "undefined" && users.Selected.lastName) ? users.Selected.lastName : ""}
                                class="form-control"
                                placeholder="Enter last name"
                                onChange={this.handleChange}
                            />

                        </div>
                        <div class="form-group">
                            <label>Phone Number: </label>
                            <input type="number" name="phoneNumber" value={(typeof users.Selected.phoneNumber != "undefined" && users.Selected.phoneNumber) ? users.Selected.phoneNumber : ""} class="form-control" placeholder="Enter phone number" onChange={this.handleChange} />
                        </div>
                        {

                            (profileEdit == false) && <div>
                                <div class="form-group">
                                    <label>User Type: <span class="text-red">*</span></label>
                                    <DropDown multiple={false}
                                        required={true}
                                        options={userType}
                                        selected={(typeof users.Selected.userType == "undefined") ? "" : users.Selected.userType}
                                        onChange={(e) => {
                                            this.setDropDown("userType", e.value);
                                        }} />

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

                                    </div>
                                }
                                {
                                    (users.Selected.userType == 'Internal') && <div class="form-group">
                                        <label>Team/s:</label>
                                        <DropDown
                                            multiple={true}
                                            required={false}
                                            options={teamList}
                                            onInputChange={this.setTeamList}
                                            placeholder={'Search or select team'}
                                            onChange={(e) => this.setDropDownMultiple("team", e)}
                                            selected={
                                                (typeof users.Selected.team == "undefined") ? [] : users.Selected.team.map((e) => { return typeof e.value != "undefined" ? { value: e.value } : { value: e.id } })
                                            }
                                            isClearable={((users.SelectList).length > 0)}
                                        />
                                    </div>
                                }
                                {
                                    (users.Selected.userType == 'Internal') && <div class="form-group pointer-none">
                                        <label class="m0">Supervisor/s:</label>
                                        <p class="note">Generated based on selected team</p>
                                        <DropDown
                                            multiple={true}
                                            required={false}
                                            options={surpervisorSelectList}
                                            selected={_.map(surpervisorSelectList, (o) => { return { value: o.id } })}
                                            customSelected={({ value: o }) => {
                                                return (
                                                    <div class="drop-profile">
                                                        {
                                                            (o.image != "") && <img src={o.image} alt="Profile Picture" class="img-responsive" />
                                                        }
                                                        <p class="m0">{o.label}</p>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                }
                            </div>
                        }
                        <a class="btn btn-violet" onClick={this.handleSubmit}>
                            <span>{`${(typeof users.Selected.id != "undefined" && users.Selected.id != "") ? 'Update' : 'Add'} ${(profileEdit) ? 'Profile' : 'User'}`}</span>
                        </a>
                    </form>
                </div>
            </div>
            {
                (typeof users.Selected.id != "undefined" && users.Selected.id != "") &&
                <div class="col-md-6">
                    <div>
                        <form id="user-password">
                            <p class="form-header mb0">Change Password</p>
                            <p>All with <span class="text-red">*</span> are required.</p>
                            <div class="form-group">
                                <label class="m0">New Password: <span class="text-red">*</span></label>
                                <p class="note">Passwords at least 6 characters.</p>
                                <input
                                    type="password"
                                    name="new_password"
                                    required
                                    value={(typeof users.Selected.new_password == "undefined") ? "" : users.Selected.new_password}
                                    class="form-control"
                                    placeholder="Enter new password"
                                    onChange={this.handleChange}
                                />
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

                            </div>
                            <a class="btn btn-violet" onClick={this.handleChangePassword}>
                                <span>Change Password</span>
                            </a>
                        </form>
                    </div>
                </div>
            }
        </div>
    }
}