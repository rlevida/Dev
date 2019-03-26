import React from 'react';
import parallel from 'async/parallel';
import moment from 'moment';
import _ from 'lodash';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';

import { Loading } from "../../globalComponents";
import { showToast, getData } from "../../globalFunction";

import ProjectActionTab from "./projectActionTab";
import ArchiveModal from "./archiveModal";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class ProjectList extends React.Component {
    constructor(props) {
        super(props)

        _.map([
            "getNextResult",
            "renderStatus",
            "handleEdit",
            "handleArchive"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_LIST", list: [], count: {} })
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
    }

    componentDidMount() {
        const { dispatch, loggedUser } = this.props;
        parallel({
            projects: (parallelCallback) => {
                let requestUrl = `/api/project?page=${1}`;
                if(loggedUser.data.userType === "External"){
                    requestUrl += `&id=${loggedUser.data.projectId}`
                }
                getData(requestUrl, {}, (c) => {
                    dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count })
                    dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
                    showToast("success", "Project successfully retrieved.");
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
                        dispatch({ type: "SET_USER_LIST", list: c.data.result })
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
            }, usersList: (parallelCallback) => {
                getData(`/api/globalORM/selectList?selectName=usersList`, {}, (c) => {
                    dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'usersList' })
                    parallelCallback(null, "")
                })
            }
        }, (error, result) => {

        })
    }

    getNextResult() {
        const { project, dispatch } = { ...this.props };
        const { Count, List, Filter } = project;
        const { typeId, projectStatus } = Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");

        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });

        getData(`/api/project?page=${Count.current_page + 1}&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: List.concat(c.data.result), count: c.data.count })
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            showToast("success", "Project successfully retrieved.");
        })
    }

    renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type }) {
        const status = (lateWorkstream > 0) ? `${lateWorkstream} stream(s) delayed` : (workstreamTaskDueToday > 0) ? `${workstreamTaskDueToday} stream(s) due today` : `On track`;
        const color = (lateWorkstream > 0) ? "text-red" : (workstreamTaskDueToday > 0) ? "text-yellow" : "text-green";
        const component = (render_type == "text") ? <p class={`mb0 ${color}`}>
            {status}
        </p> : <span class={`fa fa-circle mb0 mr5 ${color}`}></span>
        return (component);
    }

    handleEdit(params) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: params });
        dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_PROJECT_MANAGER_ID", id: params.projectManagerId });
    }

    handleArchive(data) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: data })
        $(`#archiveModal`).modal("show");
    }

    render() {
        const { project, loggedUser } = this.props;
        const currentPage = (typeof project.Count.current_page != "undefined") ? project.Count.current_page : 1;
        const lastPage = (typeof project.Count.last_page != "undefined") ? project.Count.last_page : 1;

        return (
            <div>
                <div class="row">
                    {
                        (project.FormActive == "List") && <div class="col-lg-12">
                            <div class="card">
                                <div class="mb20 bb">
                                    <ProjectActionTab />
                                </div>
                                <div class={(project.Loading == "RETRIEVING" && (project.List).length == 0) ? "linear-background" : ""}>
                                    {
                                        ((project.List).length > 0) && <table>
                                            <thead>
                                                <tr>
                                                    <th scope="col" class="td-left">Project Name</th>
                                                    <th scope="col">Type</th>
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Workstreams</th>
                                                    <th scope="col">Members</th>
                                                    <th scope="col">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    _.map(project.List, (projectElem, index) => {
                                                        const { id, project, workstream, members, type } = { ...projectElem };
                                                        let lateWorkstream = 0;
                                                        let workstreamTaskDueToday = 0;

                                                        workstream.map((e) => {
                                                            if (e.taskOverDue.length) {
                                                                lateWorkstream++;
                                                            }
                                                            if (e.taskDueToday.length) {
                                                                workstreamTaskDueToday++;
                                                            }
                                                        });

                                                        return (
                                                            <tr key={index}>
                                                                <td data-label="Project Name" class="td-left">
                                                                    <p class="mb0">
                                                                        {this.renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type: "icon" })}
                                                                        <Link to={`/projects/${id}`}>{project}</Link>
                                                                    </p>
                                                                </td>
                                                                <td data-label="Type">
                                                                    <p class="mb0">
                                                                        <span title={type.type}>
                                                                            <i class={(type.type == "Client") ? "fa fa-users" : (type.type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></i>
                                                                        </span>
                                                                    </p>
                                                                </td>
                                                                <td data-label="Status">
                                                                    {this.renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type: "text" })}
                                                                </td>
                                                                <td data-label="Workstreams">
                                                                    {workstream.length}
                                                                </td>
                                                                <td data-label="Members">
                                                                    {members.length}
                                                                </td>
                                                                <td data-label="Actions" class={(loggedUser.data.userRole <= 3) ? "" : "hide"}>
                                                                    <a href="javascript:void(0);"
                                                                        onClick={() => this.handleEdit(projectElem)}
                                                                        class="btn btn-action">
                                                                        <span class="glyphicon glyphicon-pencil" title="EDIT"></span>
                                                                    </a>
                                                                    <a href="javascript:void(0);"
                                                                        onClick={(e) => this.handleArchive(projectElem)}
                                                                        class={projectElem.allowedDelete == 0 ? 'hide' : 'btn btn-action'}>
                                                                        <span class="fa fa-trash"></span></a>
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    }
                                    {
                                        (project.Loading == "RETRIEVING" && (project.List).length > 0) && <Loading />
                                    }
                                    {
                                        (currentPage != lastPage && project.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Projects</a></p>
                                    }
                                    {
                                        ((project.List).length == 0 && project.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                    }
                                </div>
                            </div>
                        </div>
                    }
                    {/* Modals */}
                    <ArchiveModal />
                </div>
            </div>
        )
    }
}