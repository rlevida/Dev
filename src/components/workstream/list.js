import React from "react";
import { HeaderButtonContainer, Loading } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";
import WorkstreamStatus from "./workstreamStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        global: store.global,
        projectData: store.project
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this);
        this.updateActiveStatus = this.updateActiveStatus.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.getNextResult = this.getNextResult.bind(this);
    }

    componentDidMount() {
        const { workstream, socket, dispatch } = this.props;
        const { Count } = workstream;


        if (workstreamId != "") {
            const dataToGet = { params: { id: workstreamId } }
            getData(`/api/workstream/getWorkstreamDetail`, dataToGet, (c) => {
                dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: c.data })
                dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })
                dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "task" });
            })
        } else {
            if (_.isEmpty(Count)) {
                this.fetchData(1);
            }
        }
    }

    fetchData(page) {
        const { dispatch, loggedUser } = this.props;

        getData(`/api/workstream?projectId=${project}&page=${page}&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
                showToast("success", "Workstream successfully retrieved.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        })
    }

    getNextResult() {
        const { workstream } = { ...this.props };
        const { Count } = workstream
        this.fetchData(Count.current_page + 1);
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
        const { issues, dueToday } = { ...data };
        let className = "fa fa-circle";
        let statusColor = "#000";

        if (issues.length > 0) {
            className = "fa fa-exclamation-circle";
            statusColor = "#c0392b"
        } else if (dueToday.length > 0) {
            statusColor = "#f39c12"
        } else {
            statusColor = "#27ae60"
        }

        return (
            <span className={className} style={{ color: statusColor }}></span>
        );
    }

    render() {
        const { workstream, dispatch, socket, loggedUser, global, projectData } = this.props;
        const currentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const lastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;

        return (
            <div class="pd20">
                <h3 class="mt10 mb10">
                    <a href={"/project/" + project} style={{ color: "#000", textDecortion: "none" }}>{projectData.Selected.project}</a>
                </h3>
                <div class="row mb10">
                    <div class="col-lg-8" style={{ float: "right" }}>
                        <WorkstreamStatus />
                    </div>
                </div>
                <HeaderButtonContainer withMargin={true}>
                    {(loggedUser.data.userRole < 4) &&
                        <li class="btn btn-info" onClick={(e) => {
                            dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "" });
                            dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })
                            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} })
                        }}
                        >
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
                                || loggedUser.data.userRole == 3) &&
                                <th></th>
                            }
                        </tr>
                        {
                            _.map(workstream.List, (workstreamObj, index) => {
                                return (
                                    <tr key={index}>
                                        <td>
                                            {(workstreamObj.task.length > 0) && this.renderStatus(workstreamObj)}
                                        </td>
                                        <td class="text-left" style={{ cursor: "pointer" }}>
                                            <a href={`/project/${workstreamObj.projectId}/workstream/${workstreamObj.id}`} >
                                                {workstreamObj.workstream}
                                            </a>
                                        </td>
                                        <td class="text-center">{(workstreamObj.pending).length}</td>
                                        <td class="text-center">{(workstreamObj.completed).length}</td>
                                        <td class="text-center">{(workstreamObj.issues).length}</td>
                                        <td class="text-center">{(workstreamObj.new_documents).length}</td>
                                        <td class="text-center">{(workstreamObj.members.length > 0) && <span title={`${_.map(workstreamObj.members, (o) => { return o.user.firstName + " " + o.user.lastName }).join("\r\n")}`}><i class="fa fa-users fa-lg"></i></span>}</td>
                                        <td class="text-center"><span title={`${workstreamObj.type.type}`} class={workstreamObj.type.type == "Output based" ? "fa fa-calendar" : "glyphicon glyphicon-time"}></span></td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);"
                                                data-tip="EDIT"
                                                class="btn btn-info btn-sm"
                                                onClick={(e) => {
                                                    socket.emit("GET_WORKSTREAM_DETAIL", { id: workstreamObj.id });
                                                    dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "" });
                                                }}
                                            >
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(workstreamObj.id)}
                                                class="btn btn-danger btn-sm ml10">
                                                <span class="glyphicon glyphicon-trash"></span>
                                            </a>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                {
                    (workstream.Loading == "RETRIEVING") && <Loading />
                }
                <div class="text-center">
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Workstream</a>
                    }
                    {
                        ((workstream.List).length == 0 && workstream.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}