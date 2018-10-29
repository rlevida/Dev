import React from "react";
import Tooltip from "react-tooltip";
import parallel from 'async/parallel';

import { Loading } from "../../globalComponents";
import { getData } from "../../globalFunction";
import ProjectFilter from "./projectFilter"
import ProjectStatus from "./projectStatus"
import ArchiveModal from "./archiveModal"

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

    componentDidMount() {
        let { dispatch, loggedUser } = this.props;
        parallel({
            projects: (parallelCallback) => {
                getData(`/api/project`, {}, (c) => {
                    dispatch({ type: "SET_PROJECT_LIST", list: c.data })
                    parallelCallback(null, c.data)
                })
            },
            status: (parallelCallback) => {
                getData(`/api/status`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_STATUS_LIST", list: c.data })
                        parallelCallback(null, c.data)
                    } else {
                        parallelCallback(null, "")
                    }
                })
            },
            types: (parallelCallback) => {
                getData(`/api/type`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_TYPE_LIST", list: c.data })
                        parallelCallback(null, c.data)
                    } else {
                        parallelCallback(null, "")
                    }
                })
            },
            user: (parallelCallback) => {
                getData(`/api/user`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "SET_USER_LIST", list: c.data })
                        parallelCallback(null, c.data)
                    } else {
                        parallelCallback(null, "")
                    }
                })
            },
            teams: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=teamList`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'teamList' })
                    parallelCallback(null, "")
                })
            },
            roles: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=roleList`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'roleList' })
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {

        })
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

    archive(data) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: data })
        $(`#archiveModal`).modal("show");
    }

    render() {
        let { project, loggedUser, dispatch } = this.props;
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
                            <th>Projects</th>
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
                            project.List.map((data, index) => {
                                if ((data.typeId == 2 || data.typeId == 3) && (loggedUser.data.userRole != 1 && loggedUser.data.userRole != 2 && loggedUser.data.userRole != 3 && loggedUser.data.userRole != 4 && loggedUser.data.userRole != 5 && loggedUser.data.userRole != 6)) {
                                    // if user is client the he can only see client project
                                } else {
                                    let lateWorkstream = 0;
                                    let workstreamTaskDueToday = 0
                                    data.workstream.map((e) => {
                                        if (e.taskOverDue.length) {
                                            lateWorkstream++;
                                        }
                                        if (e.taskDueToday.length) {
                                            workstreamTaskDueToday++
                                        }
                                    })

                                    return <tr key={index}>
                                        <td>
                                            {(data.isActive == 0) && <span class="fa fa-circle"></span>}
                                            {(data.isActive == 1) ? <span className={(lateWorkstream > 0) ? "fa fa-exclamation-circle fa-lg" : "fa fa-circle fa-lg"} style={{ color: (lateWorkstream > 0) ? "#c0392b" : (workstreamTaskDueToday > 0) ? "#f39c12" : "#27ae60" }}></span> : ""}
                                        </td>
                                        <td class="text-left"><a href={"/project/" + data.id} target="_blank">{data.project + ((data.projectNameCount > 0) ? " (" + data.projectNameCount + ")" : "")}</a></td>
                                        <td class="text-center"><span class={(data.type == "Client") ? "fa fa-users" : (data.type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></span></td>
                                        <td class="text-center">{(data.newDocCount > 0) ? <span class="fa fa-file"></span> : ""} {data.newDocCount}</td>
                                        <td class="text-center"><span><i class="fa fa-file-alt"></i></span></td>
                                        <td class="text-center">{data.workstream.length ? data.workstream.length : ""}</td>
                                        <td class="text-center">{lateWorkstream ? lateWorkstream : ""}</td>
                                        {(loggedUser.data.userRole == 1
                                            || loggedUser.data.userRole == 2
                                            || loggedUser.data.userRole == 3) &&
                                            <td class="text-center">
                                                <a href="javascript:void(0);" data-tip="EDIT"
                                                    onClick={(e) => {
                                                        dispatch({ type: "SET_PROJECT_SELECTED", Selected: data }),
                                                            dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })
                                                        dispatch({ type: "SET_PROJECT_MANAGER_ID", id: data.projectManagerId })
                                                    }
                                                    }
                                                    class="btn btn-info btn-sm">
                                                    <span class="glyphicon glyphicon-pencil"></span></a>
                                                <a href="javascript:void(0);" data-tip="ARCHIVE"
                                                    onClick={(e) => this.archive(data)}
                                                    class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                    <span class="fa fa-archive"></span></a>
                                                <Tooltip />
                                            </td>
                                        }
                                    </tr>
                                }
                            })
                        }
                    </tbody>
                </table>
                {
                    (project.Loading) && <Loading />
                }
                {
                    (project.List.length == 0 && project.Loading == false) && <p class="text-center">No Record Found!</p>
                }
                <ArchiveModal />
            </div>
        )
    }
}