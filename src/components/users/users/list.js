import React from "react";
import Tooltip from "react-tooltip";
import { showToast, displayDate, numberFormat } from '../../../globalFunction';
import { HeaderButtonContainer, HeaderButton, DropDown, OnOffSwitch } from "../../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.handleSelectCompany = this.handleSelectCompany.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
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

    handleSelectCompany(e) {
        let { socket, users, dispatch } = this.props;
    }

    render() {
        let { users, dispatch, socket, loggedUser } = this.props;

        return <div>
            <a class="btn btn-primary" style={{ float: "right", cursor: "pointer", margin: "10px" }} onClick={(e) => dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "Form" })} ><span>New Users</span></a>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th class="text-center">ID</th>
                        <th class="text-left">User Id</th>
                        <th class="text-left">Email Address</th>
                        <th class="text-center">Type</th>
                        <th class="text-center"></th>
                    </tr>
                    {
                        (users.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={5}>No Record Found!</td>
                        </tr>
                    }
                    {
                        users.List.map((data, index) => {
                            let toBeEditedByAdmin = data.role.filter(e => e.roleId == 2 || e.roleId == 3 || e.roleId == 4 || e.roleId == 5 || e.roleId == 6);
                            let toBeEditedByManager = data.role.filter(e => e.roleId == 4 || e.roleId == 5 || e.roleId == 6);

                            return <tr key={index}>
                                <td class="text-center">{data.id}</td>
                                <td class="text-left">{data.username}</td>
                                <td class="text-left">{data.emailAddress}</td>
                                <td class="text-center">{data.userType}</td>
                                <td class="text-center">
                                    {
                                        (loggedUser.data.userRole == 1 || loggedUser.data.userRole == 2 && toBeEditedByAdmin.length > 0 || loggedUser.data.userRole == 3 && toBeEditedByManager.length > 0) && <div>
                                            <a href="javascript:void(0);" data-tip="EDIT"
                                                onClick={(e) => socket.emit("GET_USER_DETAIL", { id: data.id })}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            <a href="javascript:void(0);"
                                                data-tip='CHANGE PASSWORD'
                                                onClick={e => {
                                                    dispatch({ type: "SET_USER_ID", SelectedId: data.id })
                                                    dispatch({ type: "SET_USER_FORM_ACTIVE", FormActive: "ChangePassword" })
                                                }} class="btn btn-info btn-sm ml10">
                                                <span class="glyphicon glyphicon-lock"></span>
                                            </a>
                                            <OnOffSwitch Active={data.isActive} Action={() => this.updateActiveStatus(data.id, data.isActive)} />
                                        </div>
                                    }
                                    <Tooltip />
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}