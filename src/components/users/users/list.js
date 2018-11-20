import React from "react";
import _ from "lodash";
import Tooltip from "react-tooltip";
import { getData, putData, deleteData, showToast } from '../../../globalFunction';
import { OnOffSwitch, Loading } from "../../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        teams: store.teams,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
        this.renderArrayTd = this.renderArrayTd.bind(this)
        this.getNextResult = this.getNextResult.bind(this)
    }

    componentDidMount() {
        const { users } = this.props;

        if (_.isEmpty(users.Count)) {
            this.fetchData(1);
        }
    }

    deleteData(id) {
        const { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/user/deleteUser/${id}`, { isDeleted: 1 }, (c) => {
                if (c.data.error) {
                    showToast('error', c.data.message);
                } else {
                    dispatch({ type: 'REMOVE_DELETED_USER_LIST', Id: id });
                    showToast('success', 'Successfully Deleted.');
                }
            })
        }
    }

    getNextResult() {
        const { users } = this.props;
        this.fetchData(users.Count.current_page + 1)
    }

    fetchData(page) {
        const { dispatch, users } = this.props;
        getData(`/api/user?page=${page}&isDeleted=0`, {}, (c) => {
            dispatch({ type: 'SET_USER_LIST', List: users.List.concat(c.data.result), Count: c.data.count });
            dispatch({ type: 'SET_USER_LOADING', Loading: '' });
        })
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
        dispatch({ type: 'SET_USER_SELECTED', Selected: { ...data, team: data.team.map((e) => { return { value: e.id, label: e.team } }) } });
        dispatch({ type: 'SET_CURRENT_DATA_SELECTED', Selected: { ...data, team: data.team.map((e) => { return { value: e.id, label: e.team } }) } })
        $(`#usersModal`).modal('show');
    }

    handleChangePassword(id) {
        const { dispatch } = this.props;
        dispatch({ type: "SET_USER_ID", SelectedId: id });
        $(`#changePasswordModal`).modal('show');
    }

    render() {
        const { users, loggedUser } = this.props;
        const currentPage = (typeof users.Count.current_page != "undefined") ? users.Count.current_page : 1;
        const lastPage = (typeof users.Count.last_page != "undefined") ? users.Count.last_page : 1;

        let userList = _.filter(users.List, (o) => {
            if (loggedUser.data.userRole == 1) {
                return o.id > 0;
            } else if (loggedUser.data.userRole == 2) {
                return _.filter(o.user_role, (r) => { return r.roleId > 1 }).length > 0;
            } else if (loggedUser.data.userRole == 3) {
                return _.filter(o.user_role, (r) => { return r.roleId > 2 }).length > 0
                // return (_.filter(o.projects, (project) => { return project.projectManagerId == loggedUser.data.id })).length > 0 && o.userType == "External"
            }
        });

        let projectsAsManager = _.filter(loggedUser.data.user_projects, (o) => {
            return o.memberType == 'project manager'
        })
        return (
            <div>
                <table id="dataTable" class="table responsive-table m0">
                    <tbody>
                        <tr>
                            <th class="text-center">Id</th>
                            <th class="text-left">User Id</th>
                            <th class="text-left">First Name</th>
                            <th class="text-left">Last Name</th>
                            <th class="text-left">Email Address</th>
                            <th class="text-center">Type</th>
                            <th class="text-left">Role/s</th>
                            <th class="text-left">Team/s</th>
                            <th class="text-center"></th>
                        </tr>
                        {(userList.length > 0) &&
                            userList.map((user, index) => {
                                let toBeEditedByAdmin = user.user_role.filter(e => e.roleId == 2 || e.roleId == 3 || e.roleId == 4 || e.roleId == 5 || e.roleId == 6);
                                let toBeEditedByManager = user.user_role.filter(e => e.roleId == 4 || e.roleId == 5 || e.roleId == 6);
                                let toBeEditedByProjectManager = (projectsAsManager.length) ? _.filter(projectsAsManager, (o) => { return user.projectId.indexOf(o.linkId) == -1 }).length : 1

                                if (user.userType == 'External' && toBeEditedByProjectManager) {
                                    return
                                }

                                return (
                                    <tr key={index}>
                                        <td class="text-center">{user.id}</td>
                                        <td class="text-left">{user.username}</td>
                                        <td class="text-left">{user.firstName}</td>
                                        <td class="text-left">{user.lastName}</td>
                                        <td class="text-left">{user.emailAddress}</td>
                                        <td class="text-center">{user.userType}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(user.user_role, (el) => { return el.role.role }))}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(user.team, (el) => { return el.team }))}</td>
                                        <td class="text-center">
                                            {
                                                (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 && toBeEditedByAdmin.length > 0 || loggedUser.data.userRole == 3 && toBeEditedByManager.length > 0) && <div>
                                                    <a href="javascript:void(0);" data-tip="EDIT"
                                                        onClick={(e) => this.handleEdit(user)}
                                                        class="btn btn-info btn-sm">
                                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                                    <a href="javascript:void(0);" data-tip="DELETE"
                                                        onClick={e => this.deleteData(user.id)}
                                                        class={user.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                        <span class="glyphicon glyphicon-trash"></span></a>
                                                    <a href="javascript:void(0);"
                                                        data-tip='CHANGE PASSWORD'
                                                        onClick={(e) => this.handleChangePassword(user.id)
                                                        } class="btn btn-info btn-sm ml10">
                                                        <span class="glyphicon glyphicon-lock"></span>
                                                    </a>
                                                    <OnOffSwitch Active={user.isActive} Action={() => this.updateActiveStatus(user.id, user.isActive)} />
                                                </div>
                                            }
                                            <Tooltip />
                                        </td>
                                    </tr>
                                )
                            })
                        }

                    </tbody>
                </table>

                <div class="text-center">
                    {
                        ((currentPage != lastPage) && users.List.length > 0 && users.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Users</a>
                    }
                    {
                        (users.List == 0 && users.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (users.Loading == "RETRIEVING") && <Loading />
                }
            </div>
        )
    }
}