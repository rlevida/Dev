import React from "react";
import Tooltip from "react-tooltip";
import { showToast, displayDate, numberFormat } from '../../globalFunction';
import { HeaderButtonContainer, HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";
import ProjectFilter from "./projectFilter"
import ProjectStatus from "./projectStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        let intervalLoggedUser = setInterval(() => {
            if (typeof this.props.loggedUser.data.id != "undefined") {
                let filter = {}
                if (this.props.loggedUser.data.userRole != "1" && this.props.loggedUser.data.userRole != "2") {
                    filter = { filter: { id: { name: "id", value: this.props.loggedUser.data.projectIds, condition: " IN " } } }
                }
                this.props.socket.emit("GET_PROJECT_LIST", filter);
                clearInterval(intervalLoggedUser)
            }
        }, 1000)

        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_PROJECT", { data: { id: id, isActive: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_PROJECT", { id: id })
        }
    }

    render() {
        let { project, socket, loggedUser } = this.props;
        return (
            <div>
                <ProjectStatus style={{ float: "right", padding: "20px" }} />
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th colSpan={8}> <ProjectFilter /> </th>
                        </tr>
                        <tr>
                            <th></th>
                            <th>Project</th>
                            <th class="text-center">Type</th>
                            <th class="text-center">New Docs</th>
                            <th class="text-center">Notifications</th>
                            <th class="text-center">Active Workstreams</th>
                            <th class="text-center">Late Workstreams</th>
                            {(loggedUser.data.userRole == 1
                                || loggedUser.data.userRole == 2
                                || loggedUser.data.userRole == 3
                                || loggedUser.data.userRole == 4) &&
                                <th></th>
                            }
                        </tr>
                        {
                            (project.List.length == 0) &&
                            <tr>
                                <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            project.List.map((data, index) => {
                                if ((data.typeId == 2 || data.typeId == 3) && (loggedUser.data.userRole != 1 && loggedUser.data.userRole != 2 && loggedUser.data.userRole != 3 && loggedUser.data.userRole != 4  && loggedUser.data.userRole != 5 && loggedUser.data.userRole != 6)) {
                                    // if user is client the he can only see client project
                                } else {
                                    return <tr key={index}>
                                        <td>{(data.isActive == 0) && <span class="fa fa-circle" style={{ color: "#000" }}></span>}{(data.isActive == 1) ? <span className={(data.Issues > 0) ? "fa fa-exclamation-circle fa-lg" : "fa fa-circle fa-lg"} style={{ color: (data.Issues > 0) ? "#c0392b" : (data.OnDue > 0) ? "#f39c12" : "#27ae60" }}></span> : ""}</td>
                                        <td class="text-left"><a href={"/project/" + data.id}>{data.project}</a></td>
                                        <td class="text-center"><span class={(data.type_type == "Client") ? "fa fa-users" : (data.type_type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></span></td>
                                        <td class="text-center">{(data.newDocCount > 0) ? <span class="fa fa-file"></span> : ""} {data.newDocCount}</td>
                                        <td class="text-center"><span><i class="fa fa-file-alt"></i></span></td>
                                        <td class="text-center">{(!data.Active) ? "" : data.Active}</td>
                                        <td class="text-center">{(!data.Issues) ? "" : data.Issues}</td>
                                        {(loggedUser.data.userRole == 1
                                            || loggedUser.data.userRole == 2
                                            || loggedUser.data.userRole == 3) &&
                                            <td class="text-center">
                                                <a href="javascript:void(0);" data-tip="EDIT"
                                                    onClick={(e) => socket.emit("GET_PROJECT_DETAIL", { id: data.id })}
                                                    class="btn btn-info btn-sm">
                                                    <span class="glyphicon glyphicon-pencil"></span></a>
                                                <a href="javascript:void(0);" data-tip="DELETE"
                                                    onClick={e => this.deleteData(data.id)}
                                                    class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                    <span class="glyphicon glyphicon-trash"></span></a>
                                                {/*<OnOffSwitch Active={data.isActive} Action={()=>this.updateActiveStatus(data.id,data.isActive)} />*/}
                                                <Tooltip />
                                            </td>
                                        }
                                    </tr>
                                }
                            })
                        }
                    </tbody>
                </table>
            </div>
        )
    }
}