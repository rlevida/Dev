import React from "react";
import _ from "lodash";

import { getData, postData, putData, showToast } from "../../../globalFunction";
import { OnOffSwitch, Loading, DeleteModal } from "../../../globalComponents";

import { connect } from "react-redux";
@connect(store => {
    return {
        users: store.users,
        teams: store.teams,
        loggedUser: store.loggedUser,
        settings: store.settings
    };
})
export default class UserList extends React.Component {
    constructor(props) {
        super(props);

        _.map(["deleteData", "confirmDelete", "updateActiveStatus", "renderArrayTd", "getNext"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidUpdate(prevProps) {
        const { users, dispatch } = this.props;

        if (_.isEqual(prevProps.users.Filter, users.Filter) == false) {
            this.fetchData(1);
            dispatch({ type: "SET_USER_LIST", list: [] });
        }
    }

    componentDidMount() {
        const { users } = this.props;
        if (_.isEmpty(users.Count)) {
            this.fetchData(1);
        }
    }

    deleteData(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_USER_SELECTED", Selected: value });
        $(`#delete-user`).modal("show");
    }

    confirmDelete() {
        const { dispatch, users } = this.props;
        const userId = users.Selected.id;

        putData(`/api/user/deleteUser/${userId}`, { isDeleted: 1 }, c => {
            $(`#delete-user`).modal("hide");
            dispatch({ type: "SET_USER_SELECTED", Selected: "" });

            if (c.status == 200) {
                dispatch({ type: "REMOVE_DELETED_USER_LIST", Id: userId });
                showToast("success", "Successfully Deleted.");
            } else {
                showToast("error", c.data.message, 360000);
            }
        });
    }

    getNext() {
        const { users, dispatch } = this.props;
        dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });

        this.fetchData(users.Count.current_page + 1);
    }

    fetchData(page) {
        const { dispatch, users, loggedUser } = this.props;
        let fetchUrl = `/api/user?page=${page}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}`;

        if (users.Filter.name != "") {
            fetchUrl += `&name=${users.Filter.name}`;
        }

        dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });

        getData(fetchUrl, {}, c => {
            const userList = page == 1 ? c.data.result : users.List.concat(c.data.result);
            dispatch({ type: "SET_USER_LIST", list: userList, Count: c.data.count });
            dispatch({ type: "SET_USER_LOADING", Loading: "" });
        });
    }

    renderArrayTd(arr) {
        return arr.join("\r\n");
    }

    updateActiveStatus(id, active) {
        const { dispatch } = this.props;
        putData(`/api/user/${id}`, { id: id, isActive: active == 1 ? 0 : 1 }, c => {
            dispatch({ type: "UPDATE_DATA_USER_LIST", UpdatedData: c.data });
            showToast("success", "Successfully Updated.");
        });
    }

    handleEdit(data) {
        const { dispatch } = this.props;
        getData(`/api/user/detail/${data.id}`, {}, c => {
            dispatch({
                type: "SET_USER_SELECTED",
                Selected: {
                    ...c.data,
                    team: c.data.team.map(e => {
                        return {
                            value: e.id,
                            label: e.team,
                            teamLeader: e.teamLeader
                        };
                    })
                }
            });
            dispatch({
                type: "SET_CURRENT_DATA_SELECTED",
                Selected: {
                    ...c.data,
                    team: c.data.team.map(e => {
                        return {
                            value: e.id,
                            label: e.team,
                            teamLeader: e.teamLeader
                        };
                    })
                }
            });
            dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" });
        });
    }

    sendActivationLink(data) {
        const dataToBeSubmitted = {
            id: data.id,
            username: data.username,
            firstName: data.firstName,
            emailAddress: data.emailAddress,
        }
        postData(`/api/createPassword`, dataToBeSubmitted, (c) => {
            if (!c.error) {
                showToast("success", "Activation link successfully sent.");
            } else {
                showToast("error", c.error);
            }
        })
    }

    render() {
        const { users, loggedUser, settings } = this.props;
        const currentPage = typeof users.Count != "undefined" && _.isEmpty(users.Count) == false ? users.Count.current_page : 1;
        const lastPage = typeof users.Count != "undefined" && _.isEmpty(users.Count) == false ? users.Count.last_page : 1;
        const typeValue = typeof users.Selected.firstName != "undefined" && _.isEmpty(users.Selected) == false ? users.Selected.firstName + " " + users.Selected.lastName : "";
        const userList = users.List;
        return (
            <div>
                {userList.length > 0 && (
                    <table id="user-list">
                        <thead>
                            <tr>
                                <th scope="col" class="td-left">
                                    Username
                                </th>
                                <th scope="col">First Name</th>
                                <th scope="col">Last Name</th>
                                <th scope="col">Email Address</th>
                                <th scope="col">Type</th>
                                <th scope="col">Roles</th>
                                <th scope="col" class={loggedUser.data.userRole > 4 ? "hide" : ""}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {_.map(userList, (user, index) => {
                                return (
                                    <tr key={index}>
                                        <td data-label="Username" class="td-left">
                                            <div class="profile-div">
                                                <div class="thumbnail-profile">
                                                    <img src={`${settings.site_url}api/file/profile_pictures/${user.avatar}`} alt="Profile Picture" class="img-responsive" />
                                                </div>
                                                <p class="m0">{user.username}</p>
                                            </div>
                                        </td>
                                        <td data-label="First Name">{user.firstName}</td>
                                        <td data-label="Last Name">{user.lastName}</td>
                                        <td data-label="Email Address">{user.emailAddress}</td>
                                        <td data-label="Type">{user.userType}</td>
                                        <td data-label="Roles">
                                            {this.renderArrayTd(
                                                _.map(user.user_role, el => {
                                                    return el.role.role;
                                                })
                                            )}
                                        </td>
                                        <td data-label="Actions" class={loggedUser.data.userRole > 4 ? "hide" : "actions"}>
                                            <div
                                                class={
                                                    loggedUser.data.userRole > user.user_role[0].role.id ||
                                                        (user.user_role[0].role.id == 4 && user.id != loggedUser.data.id && loggedUser.data.userRole == 4) ||
                                                        (loggedUser.data.userRole < user.user_role[0].role.id && loggedUser.data.userRole == 4) ||
                                                        (loggedUser.data.userRole == user.user_role[0].role.id && loggedUser.data.userRole > 1)
                                                        ? "hide"
                                                        : "actions"
                                                }
                                            >
                                                <OnOffSwitch Active={user.isActive} Action={() => this.updateActiveStatus(user.id, user.isActive)} />
                                                <a href="javascript:void(0);" class="btn btn-action dropdown-toggle" type="button" data-toggle="dropdown">
                                                    <span class="fa fa-ellipsis-v" title="MORE" />
                                                </a>
                                                <ul class="dropdown-menu">
                                                    <li>
                                                        <a onClick={() => this.handleEdit(user)}>Edit</a>
                                                        {!user.isActive && <a onClick={() => this.sendActivationLink(user)}>Send Activation Link</a>}
                                                    </li>
                                                    {/* <li><a onClick={() => this.deleteData(user)}>Delete</a></li> */}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
                {userList.length == 0 && users.Loading != "RETRIEVING" && (
                    <p class="mb0 mt10 text-center">
                        <strong>No Records Found</strong>
                    </p>
                )}
                {users.Loading == "RETRIEVING" && userList.length > 0 && <Loading />}
                {_.isEmpty(users) == false && currentPage != lastPage && users.Loading != "RETRIEVING" && (
                    <p class="mb0 text-center">
                        <a onClick={() => this.getNext()}>Load More Users</a>
                    </p>
                )}
                {/* Modals */}
                <DeleteModal id="delete-user" type={"user"} type_value={typeValue} delete_function={this.confirmDelete} />
            </div>
        );
    }
}
