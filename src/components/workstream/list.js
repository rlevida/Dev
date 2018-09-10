import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import WorkstreamStatus from "./workstreamStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        global: store.global
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST", {});
        this.props.socket.emit("GET_TEAM_LIST", {});
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "tagList", filter: { tagType: "document" } })
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "ProjectMemberList", filter: { linkId: project, linkType: "project" } })
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "workstreamDocumentList", filter: { isDeleted: 0, linkId: project, linkType: "project", status: "new" } });
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_WORKSTREAM", { id: id, projectId: project })
        }
    }

    renderStatus(data) {
        const { isActive, taskStatus } = { ...data };
        let className = "";
        let statusColor = "#000";

        if (data.status == "Completed") {
            className = "fa fa-circle"
            statusColor = "#27ae60"
        } else if (isActive == 0) {
            className = "fa fa-circle";
        } else if (taskStatus == 0) {
            className = "fa fa-circle";
            statusColor = "#27ae60"
        } else if (taskStatus == 1) {
            className = "fa fa-circle";
            statusColor = "#f39c12"
        } else if (taskStatus == 2) {
            className = "fa fa-circle";
            statusColor = "#c0392b"
        }

        return (
            <span className={className} style={{ color: statusColor }}></span>
        );
    }

    render() {
        let { workstream, dispatch, socket, loggedUser, global } = this.props;
        return <div>

            <WorkstreamStatus style={{ float: "right", padding: "20px" }} />
            <HeaderButtonContainer withMargin={true}>
                {(loggedUser.data.userRole == 1
                    || loggedUser.data.userRole == 2
                    || loggedUser.data.userRole == 3
                    || loggedUser.data.userRole == 4) &&
                    <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Workstream</span>
                    </li>
                }
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th class="text-left">Workstream</th>
                        <th class="text-center">Pending</th>
                        <th class="text-center">Completed</th>
                        <th class="text-center">Issues</th>
                        <th class="text-center">New Docs</th>
                        <th class="text-center">Members</th>
                        <th class="text-center">Type</th>
                        {(loggedUser.data.userRole == 1
                            || loggedUser.data.userRole == 2
                            || loggedUser.data.userRole == 3
                            || loggedUser.data.userRole == 4) &&
                            <th></th>
                        }
                    </tr>
                    {
                        (workstream.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        workstream.List.map((data, index) => {
                            let workStreamStatus = (data.Issues > 0) ? 2 : (data.OnDue > 0) ? 1 : (data.Completed == data.TasksNumber || data.OnTrack > 0) ? 0 : '';

                            return (
                                <tr key={index}>
                                    <td>
                                        {(data.isActive == 1) && <span className={(workStreamStatus == 2) ? "fa fa-exclamation-circle" : "fa fa-circle"} style={{ color: (workStreamStatus == 2) ? '#c0392b' : (workStreamStatus == 1) ? '#f39c12' : (workStreamStatus == 0) ? '#27ae60' : '' }}></span>}
                                        {(data.isActive == 0) && <span className={"fa fa-circle"}></span>}
                                    </td>
                                    <td class="text-left" style={{ cursor: "pointer" }}>

                                        <a href="javascript:void(0);" onClick={(e) => {
                                            socket.emit("GET_WORKSTREAM_DETAIL", { id: data.id })
                                            dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "task" })
                                        }} >
                                            {data.workstream}
                                        </a>
                                    </td>
                                    <td class="text-center">{data.OnTrack}</td>
                                    <td class="text-center">{data.Completed}</td>
                                    <td class="text-center">{data.Issues}</td>
                                    <td class="text-center">
                                        {(typeof global.SelectList.workstreamDocumentList != "undefined") &&
                                            global.SelectList.workstreamDocumentList.filter(t => { return t.workstreamId == data.id && t.linkType == "workstream" }).length
                                        }
                                    </td>
                                    <td class="text-center">{(data.memberNames) ? <span style={{ color: "#46b8da" }} title={data.memberNames}><i class="fa fa-user fa-lg"></i></span> : ""}   {/*&nbsp;&nbsp;<span style={{color:"#006400"}}><i class="fa fa-user fa-lg"></i></span>*/}</td>
                                    <td class="text-center"><span class={data.type_type == "Output based" ? "fa fa-calendar" : "glyphicon glyphicon-time"}></span></td>
                                    <td class="text-center"><span><i class="fa fa-users fa-lg"></i></span></td>
                                    {(loggedUser.data.userRole == 1
                                        || loggedUser.data.userRole == 2
                                        || loggedUser.data.userRole == 3
                                        || loggedUser.data.userRole == 4) &&
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT"
                                                onClick={(e) => socket.emit("GET_WORKSTREAM_DETAIL", { id: data.id })}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            <Tooltip />
                                        </td>
                                    }
                                </tr>
                            )
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}