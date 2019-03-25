import React from "react";
import _ from "lodash";

import { getData, putData, showToast } from '../../../globalFunction';
import { OnOffSwitch, Loading, DeleteModal } from "../../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        users: store.users,
        teams: store.teams,
        loggedUser: store.loggedUser
    }
})
export default class UserList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            'deleteData',
            'confirmDelete',
            'updateActiveStatus',
            'renderArrayTd',
            'getNext'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        })
    }

    componentDidUpdate(prevProps) {
        const { users } = this.props;
        if (_.isEqual(prevProps.users.Filter, users.Filter) == false) {
            this.fetchData(1);
        }
    }

    deleteData(value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: 'SET_USER_SELECTED', Selected: value });
        $(`#delete-user`).modal("show");
    }

    confirmDelete() {
        const { dispatch, users } = this.props;
        const userId = users.Selected.id;

        putData(`/api/user/deleteUser/${userId}`, { isDeleted: 1 }, (c) => {
            if (c.data.error) {
                showToast('error', c.data.message);
            } else {
                dispatch({ type: 'REMOVE_DELETED_USER_LIST', Id: userId });
                dispatch({ type: 'SET_USER_SELECTED', Selected: "" });
                showToast('success', 'Successfully Deleted.');
                $(`#delete-user`).modal("hide");
            }
        });
    }

    getNext() {
        const { users, dispatch } = this.props;
        dispatch({ type: "SET_USER_LOADING", Loading: "RETRIEVING" });

        this.fetchData(users.Count.current_page + 1)
    }

    fetchData(page) {
        const { dispatch, users } = this.props;
        let fetchUrl = `/api/user?page=${page}&isDeleted=0`;
        if (users.Filter.name != "") {
            fetchUrl += `&name=${users.Filter.name}`;
        }

        getData(fetchUrl, {}, (c) => {
            dispatch({ type: 'SET_USER_LIST', list: users.List.concat(c.data.result), Count: c.data.count });
            dispatch({ type: 'SET_USER_LOADING', Loading: '' });
            showToast("success", "Users successfully retrieved.");
        });
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    updateActiveStatus(id, active) {
        const { dispatch } = this.props;
        putData(`/api/user/${id}`, { id: id, isActive: (active == 1) ? 0 : 1 }, (c) => {
            dispatch({ type: 'UPDATE_DATA_USER_LIST', UpdatedData: c.data })
            showToast('success', 'Successfully Updated.');
        })
    }

    handleEdit(data) {
        const { dispatch } = this.props;
        dispatch({
            type: 'SET_USER_SELECTED', Selected: {
                ...data, team: data.team.map((e) => {
                    return {
                        value: e.id,
                        label: e.team,
                        teamLeader: e.teamLeader
                    }
                })
            }
        });
        dispatch({
            type: 'SET_CURRENT_DATA_SELECTED', Selected: {
                ...data, team: data.team.map((e) => {

                    return {
                        value: e.id,
                        label: e.team,
                        teamLeader: e.teamLeader
                    }
                })
            }
        });
        dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" });
    }

    render() {
        const { users, loggedUser } = this.props;
        const currentPage = (typeof users.Count != "undefined" && _.isEmpty(users.Count) == false) ? users.Count.current_page : 1;
        const lastPage = (typeof users.Count != "undefined" && _.isEmpty(users.Count) == false) ? users.Count.last_page : 1;
        const typeValue = (typeof users.Selected.firstName != "undefined" && _.isEmpty(users.Selected) == false) ? users.Selected.firstName + " " + users.Selected.lastName : "";

        let userList = _.filter(users.List, (o) => {
            if (loggedUser.data.userRole == 1) {
                return o.id > 0;
            } else if (loggedUser.data.userRole == 2) {
                return _.filter(o.user_role, (r) => { return r.roleId > 1 }).length > 0;
            } else if (loggedUser.data.userRole == 3) {
                return _.filter(o.user_role, (r) => { return r.roleId > 2 }).length > 0
            }
        });

        return (
            <div>
                {
                    ((userList).length > 0) &&
                    <table id="user-list">
                        <thead>
                            <tr>
                                <th scope="col">Username</th>
                                <th scope="col">First Name</th>
                                <th scope="col">Last Name</th>
                                <th scope="col">Email Address</th>
                                <th scope="col">Type</th>
                                <th scope="col">Roles</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                _.map(userList, (user, index) => {
                                    return (
                                        <tr key={index}>
                                            <td data-label="User ID">
                                                {user.username}
                                            </td>
                                            <td data-label="First Name">{user.firstName}</td>
                                            <td data-label="Last Name">{user.lastName}</td>
                                            <td data-label="Email Address">{user.emailAddress}</td>
                                            <td data-label="Type">{user.userType}</td>
                                            <td data-label="Roles">{this.renderArrayTd(_.map(user.user_role, (el) => { return el.role.role }))}</td>
                                            <td data-label="Actions" class="actions">
                                                <OnOffSwitch Active={user.isActive} Action={() => this.updateActiveStatus(user.id, user.isActive)} />
                                                <a href="javascript:void(0);" class="btn btn-action dropdown-toggle" type="button" data-toggle="dropdown"><span class="fa fa-ellipsis-v" title="MORE"></span></a>
                                                <ul class="dropdown-menu">
                                                    <li><a onClick={() => this.handleEdit(user)}>Edit</a></li>
                                                    <li><a onClick={() => this.deleteData(user)}>Delete</a></li>
                                                </ul>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                }
                {
                    (userList.length == 0 && users.Loading != "RETRIEVING") && <p class="mb0 mt10 text-center"><strong>No Records Found</strong></p>
                }
                {
                    (users.Loading == "RETRIEVING" && (userList).length > 0) && <Loading />
                }
                {
                    (_.isEmpty(users) == false && (currentPage != lastPage) && users.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Users</a></p>
                }
                {/* Modals */}
                <DeleteModal
                    id="delete-user"
                    type={'user'}
                    type_value={typeValue}
                    delete_function={this.confirmDelete}
                />
            </div>
        )
    }
}