import React from "react";
import _ from "lodash";
import Tooltip from "react-tooltip";
import { showToast, displayDate, numberFormat } from '../../../globalFunction';
import { HeaderButtonContainer, HeaderButton, DropDown, OnOffSwitch } from "../../../globalComponents";

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
    }

    componentWillMount() {
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_ROLE_LIST", {});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_USER_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_USER", { data: { id: id, isActive: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_USER", { id: id })
        }
    }

    renderArrayTd(arr) {
        return (
            arr.join("\r\n")
        );
    }

    render() {
        let { users, dispatch, socket, loggedUser, teams } = this.props;


        return (
            <div>
                <table id="dataTable" class="table responsive-table m0">
                    <tbody>
                        <tr>
                            <th class="text-left">Id</th>
                            <th class="text-left">User Id</th>
                            <th class="text-left">First Name</th>
                            <th class="text-left">Last Name</th>
                            <th class="text-left">Email Address</th>
                            <th class="text-center">Type</th>
                            <th class="text-left">Role/s</th>
                            <th class="text-left">Team/s</th>
                            <th class="text-center"></th>
                        </tr>
                        {
                            users.List.map((user, index) => {
                                let toBeEditedByAdmin = user.role.filter(e => e.roleId == 2 || e.roleId == 3 || e.roleId == 4 || e.roleId == 5 || e.roleId == 6);
                                let toBeEditedByManager = user.role.filter(e => e.roleId == 4 || e.roleId == 5 || e.roleId == 6);

                                return (
                                    <tr key={index}>
                                        <td class="text-left">{user.id}</td>
                                        <td class="text-left">{user.username}</td>
                                        <td class="text-left">{user.firstName}</td>
                                        <td class="text-left">{user.lastName}</td>
                                        <td class="text-left">{user.emailAddress}</td>
                                        <td class="text-center">{user.userType}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(user.role, (el) => { return el.role_role }))}</td>
                                        <td class="text-left">{this.renderArrayTd(_.map(user.team, (el) => { return el.team_team }))}</td>
                                        <td class="text-center">
                                            {
                                                (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 && toBeEditedByAdmin.length > 0 || loggedUser.data.userRole == 3 && toBeEditedByManager.length > 0) && <div>
                                                    <a href="javascript:void(0);" data-tip="EDIT"
                                                        onClick={(e) => socket.emit("GET_USER_DETAIL", { id: user.id })}
                                                        class="btn btn-info btn-sm">
                                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                                    <a href="javascript:void(0);" data-tip="DELETE"
                                                        onClick={e => this.deleteData(user.id)}
                                                        class={user.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                        <span class="glyphicon glyphicon-trash"></span></a>
                                                    <a href="javascript:void(0);"
                                                        data-tip='CHANGE PASSWORD'
                                                        onClick={e => {
                                                            dispatch({ type: "SET_USER_ID", SelectedId: user.id })
                                                            dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "ChangePassword" })
                                                        }} class="btn btn-info btn-sm ml10">
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
            </div>
        )
    }
}