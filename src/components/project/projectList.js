import React from 'react';
import parallel from 'async/parallel';
import moment from 'moment';
import _ from 'lodash';
import { connect } from "react-redux";
import { Link } from 'react-router-dom';
import ReactTooltip from 'react-tooltip';

import { Loading } from "../../globalComponents";
import { showToast, getData, putData } from "../../globalFunction";

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
            "handleArchive",
            "fetchProject",
            "fetchFormField",
            "handleUnarchive"
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
        this.fetchProject();
        this.fetchFormField();
    }

    fetchProject() {
        const { dispatch, loggedUser } = this.props;
        let requestUrl = `/api/project?page=${1}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&isActive=1&isDeleted=0`;

        getData(requestUrl, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count })
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            showToast("success", "Project successfully retrieved.");
        })
    }

    fetchFormField() {
        const { dispatch } = this.props;

        getData(`/api/type`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TYPE_LIST", list: c.data })
            }
        });

        getData(`/api/user`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_USER_LIST", list: c.data.result })
            }
        });

        getData(`/api/globalORM/selectList?selectName=teamList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'teamList' });
        });

        getData(`/api/globalORM/selectList?selectName=roleList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'roleList' });
        });

        getData(`/api/globalORM/selectList?selectName=usersList`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'usersList' });
        });
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

    renderStatus({ workstream, render_type }) {
        const lateWorkstream = _.filter(workstream, ({ taskOverDue }) => { return taskOverDue.length > 0 }).length;
        const workstreamTaskDueToday = _.filter(workstream, ({ taskDueToday }) => { return taskDueToday.length > 0 }).length;
        const status = (lateWorkstream > 0) ? `${lateWorkstream} stream${(lateWorkstream > 1) ? 's' : ''} delayed` : (workstreamTaskDueToday > 0) ? `${workstreamTaskDueToday} stream${(workstreamTaskDueToday > 1) ? 's' : ''} due today` : `On track`;
        const color = (lateWorkstream > 0) ? "text-red" : (workstreamTaskDueToday > 0) ? "text-yellow" : "text-green";
        const component = (render_type == "text") ? <p class={`mb0 ${color}`}>
            {status}
        </p> : <i class={`fa fa-circle mb0 mr5 ${color}`}></i>
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

    handleUnarchive(params) {
        const { dispatch } = { ...this.props };
        putData(`/api/project/archive/${params.id}`, { isDeleted: 0 }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_PROJECT_LIST", UpdatedData: { ...params, isDeleted: 0 } });
                showToast("success", "Successfully Restored.");
            }
        })
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
                                                    <th scope="col">Status</th>
                                                    <th scope="col">Updates</th>
                                                    <th scope="col">Workstreams</th>
                                                    <th scope="col">Completion</th>
                                                    <th scope="col">Members</th>
                                                    <th
                                                        scope="col"
                                                    >Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    _.map(project.List, (projectElem, index) => {
                                                        const { id, project, workstream, members, updates, numberOfTasks, completion_rate, type, isDeleted } = { ...projectElem };
                                                        const completionRate = (completion_rate.completed.count / numberOfTasks) * 100;
                                                        return (
                                                            <tr key={index}>
                                                                <td data-label="Project Name" class="td-left table-name">
                                                                    <p class="mb0">
                                                                        {
                                                                            (numberOfTasks > 0 && isDeleted == 0) && <span>
                                                                                {this.renderStatus({ workstream, render_type: "icon" })}
                                                                            </span>
                                                                        }
                                                                        <Link to={`/projects/${id}`}>{project}</Link>
                                                                    </p>
                                                                </td>
                                                                <td data-label="Status">
                                                                    {
                                                                        (numberOfTasks > 0 && isDeleted == 0) && <div>
                                                                            {this.renderStatus({ workstream, render_type: "text" })}
                                                                        </div>
                                                                    }
                                                                    {
                                                                        (isDeleted == 1) && <p class="m0 text-red">Archived</p>
                                                                    }
                                                                </td>
                                                                <td data-label="Type">
                                                                    {
                                                                        (updates.count > 0) && <a data-tip data-for={`update-${index}`}>
                                                                            <p class="mb0 text-blue">
                                                                                {updates.count} update{(updates.count > 1) ? 's' : ''}
                                                                            </p>
                                                                        </a>
                                                                    }
                                                                    <ReactTooltip id={`update-${index}`} aria-haspopup='true' type={'light'} class="updates-tooltip">
                                                                        <div class="wrapper">
                                                                            {
                                                                                _.map(_.groupBy(updates.list, ({ type }) => { return type }), (o, key) => {
                                                                                    return (
                                                                                        <div key={key}>
                                                                                            <div class="header">
                                                                                                <p class="text-left m0"><strong>{key}</strong></p>
                                                                                            </div>
                                                                                            <div class="list">
                                                                                                {
                                                                                                    _.map(o, ({ title, sub_title = "", image = "", date = "" }, key) => {
                                                                                                        return (
                                                                                                            <div class="tooltip-details display-flex vh-center" key={key}>
                                                                                                                {
                                                                                                                    (image != "") && <div class="thumbnail-profile mr5" key={index}>
                                                                                                                        <img src={image} alt="Profile Picture" class="img-responsive" />
                                                                                                                    </div>
                                                                                                                }
                                                                                                                <div>
                                                                                                                    <p class="m0 text-left title">{title.substring(0, 30)}{(title.length > 30) ? "..." : ""}</p>
                                                                                                                    {
                                                                                                                        (sub_title != "") && <p class="m0 text-left sub-title">{sub_title}</p>
                                                                                                                    }
                                                                                                                </div>
                                                                                                                {
                                                                                                                    (date != "") && <p class="m0 flex-right note">{moment(date).format("MMM DD, YYYY")}</p>
                                                                                                                }
                                                                                                            </div>
                                                                                                        )
                                                                                                    })
                                                                                                }
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })
                                                                            }
                                                                        </div>
                                                                    </ReactTooltip>
                                                                </td>
                                                                <td data-label="Workstreams">
                                                                    {workstream.length}
                                                                </td>
                                                                <td data-label="Completion">
                                                                    {
                                                                        (completionRate > 0) && <p class={`m0 ${(completionRate == 100) ? 'text-green' : ''}`}>
                                                                            {(completionRate).toFixed(2) + "%"}
                                                                        </p>
                                                                    }
                                                                </td>
                                                                <td data-label="Members">
                                                                    <div class="display-flex">
                                                                        {
                                                                            _.map(_.take(members, 2), ({ firstName, lastName, avatar }, index) => {
                                                                                return (
                                                                                    <div class="thumbnail-profile" key={index}>
                                                                                        <span title={firstName + " " + lastName}>
                                                                                            <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                                                                        </span>
                                                                                    </div>
                                                                                )
                                                                            })
                                                                        }
                                                                        {
                                                                            (members.length > 2) && <span
                                                                                class="thumbnail-count"
                                                                                title={
                                                                                    _(members)
                                                                                        .filter((o, index) => { return index > 1 })
                                                                                        .map(({ firstName, lastName }) => { return firstName + " " + lastName })
                                                                                        .value()
                                                                                        .join("\r\n")
                                                                                }
                                                                            >
                                                                                +{members.length - 2}
                                                                            </span>
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td
                                                                    data-label="Actions"
                                                                    class={(loggedUser.data.userRole <= 3 || (loggedUser.data.userRole == 4 && (type.type == "Private" || type.type == "Internal"))) ? "" : "hide"}
                                                                >
                                                                    {
                                                                        (isDeleted == 0) && <div>
                                                                            <a href="javascript:void(0);"
                                                                                onClick={() => this.handleEdit(projectElem)}
                                                                                class="btn btn-action">
                                                                                <span class="glyphicon glyphicon-pencil" title="EDIT"></span>
                                                                            </a>
                                                                            <a href="javascript:void(0);"
                                                                                onClick={(e) => this.handleArchive(projectElem)}
                                                                                class={projectElem.allowedDelete == 0 ? 'hide' : 'btn btn-action'}>
                                                                                <span class="fa fa-trash" title="DELETE"></span></a>
                                                                        </div>
                                                                    }
                                                                    {
                                                                        (isDeleted == 1) && <a href="javascript:void(0);"
                                                                            onClick={() => this.handleUnarchive(projectElem)}
                                                                            class="btn btn-action">
                                                                            <span class="fa fa-window-restore" title="RESTORE"></span>
                                                                        </a>
                                                                    }
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