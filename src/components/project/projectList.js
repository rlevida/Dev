import React from "react";
import parallel from "async/parallel";
import moment from "moment";
import _ from "lodash";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import ReactTooltip from "react-tooltip";

import { Loading } from "../../globalComponents";
import { showToast, getData, putData } from "../../globalFunction";

import ProjectActionTab from "./projectActionTab";
import ArchiveModal from "./archiveModal";

let scrolled = false;
@connect(store => {
    return {
        project: store.project,
        loggedUser: store.loggedUser
    };
})
export default class ProjectList extends React.Component {
    constructor(props) {
        super(props);

        _.map(["getNextResult", "renderStatus", "handleEdit", "handleArchive", "fetchProject", "fetchFormField", "handleUnarchive"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_LIST", list: [], count: {} });
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
    }

    componentWillMount() {
        let self = this;
        this.fetchProject();
        this.fetchFormField();

        window.onscroll = function() {
            let element = document.getElementById("projectTable");
            if (element) {
                let actionTabElement = document.getElementById("projectActionTab");

                let tableElement = element.getBoundingClientRect();
                const actionTableBound = actionTabElement.getBoundingClientRect();

                const actionTabletop = actionTableBound.top;
                if (actionTabletop + actionTableBound.height > 0 && document.documentElement.scrollTop - 80 < 0) {
                    actionTabElement.style.position = "";
                    actionTabElement.style.width = `${tableElement.width + 40}px`;
                    scrolled = false;
                }
                if (actionTabletop + actionTableBound.height + 40 < 0 && document.documentElement.scrollTop > 0) {
                    actionTabElement.style.position = "fixed";
                    actionTabElement.style.zIndex = "1";
                    actionTabElement.style.top = "0";
                    scrolled = true;
                }

                if (scrolled) {
                    document.getElementById("thead2").style.position = "fixed";
                    document.getElementById("thead2").style.top = `${actionTableBound.height}px`;
                    document.getElementById("thead2").style.zIndex = 1;
                    document.getElementById("thead2").style.backgroundColor = "#fff";
                    const element = document.getElementById("thead1");
                    if (element) {
                        const tag = element.getElementsByTagName("th");
                        _.map(tag, (e, i) => {
                            const eleStyle = document.getElementsByClassName(`tdWidth${i + 1}`)[i].getBoundingClientRect();
                            document.getElementById(`th${i + 1}`).style.minWidth = `${eleStyle.width - 2}px`;
                        });
                    }
                } else {
                    document.getElementById("thead2").style.position = "";
                }
            }
        };
    }

    fetchProject() {
        const { dispatch, loggedUser, project } = this.props;
        let fetchUrl = `/api/project?page=${1}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&isActive=1&isDeleted=0&typeId=1&projectStatus=Active&hasMembers=1`;

        try {
            getData(fetchUrl, {}, c => {
                const list = c.data.result.map(e => {
                    const completionRate = (e.completion_rate.completed.count / e.numberOfTasks) * 100;
                    return { ...e, completionRate: isNaN(completionRate) ? 0 : completionRate };
                });
                dispatch({ type: "SET_PROJECT_LIST", list: list, count: c.data.count });
                dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            });
        } catch (err) {
            showToast("error", "Something went wrong. Please try again.");
        }
    }

    fetchFormField() {
        const { dispatch } = this.props;

        getData(`/api/type`, {}, c => {
            if (c.status == 200) {
                dispatch({ type: "SET_TYPE_LIST", list: c.data });
            }
        });
    }

    getNextResult() {
        const { project, dispatch, loggedUser } = { ...this.props };
        const { Count, List, Filter } = project;
        const { typeId, projectType, projectProgress } = { ...Filter };
        const dueDateMoment = moment().format("YYYY-MM-DD");
        let fetchUrl = `/api/project?page=${Count.current_page + 1}&userId=${loggedUser.data.id}&userRole=${loggedUser.data.userRole}&hasMembers=1&dueDate=${dueDateMoment}&typeId=${typeId}`;

        if (projectProgress) {
            fetchUrl += `&projectProgress=${projectProgress}`;
        }
        if (typeId === "Inactive") {
            fetchUrl += `&isActive=0&projectType=${projectType}`;
        } else {
            fetchUrl += `&isActive=1&isDeleted=0`;
        }

        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });

        getData(fetchUrl, {}, c => {
            const list = c.data.result.map(e => {
                const completionRate = (e.completion_rate.completed.count / e.numberOfTasks) * 100;
                return { ...e, completionRate: isNaN(completionRate) ? 0 : completionRate };
            });
            dispatch({ type: "SET_PROJECT_LIST", list: List.concat(list), count: c.data.count });
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
        });
    }

    renderStatus(status) {
        const color = status.delayed_task.count > 0 ? "text-red" : status.tasks_due_today.count > 0 ? "text-yellow" : "text-green";
        return <i class={`fa fa-circle mb0 mr5 ${color}`} />;
    }

    handleEdit(params) {
        const { dispatch } = { ...this.props };

        getData(`/api/project/detail/${params.id}?info=${1}&action=edit`, {}, c => {
            if (c.data) {
                dispatch({ type: "SET_PROJECT_SELECTED", Selected: { ...params, ...c.data } });
                dispatch({ type: "SET_PROJECT_MANAGER_ID", id: params.projectManagerId });
                dispatch({ type: "SET_PROJECT_FORM_ACTIVE", FormActive: "Form" });
            } else {
                window.location.href = "/account#/inactive-project";
            }
        });
    }

    handleArchive(data) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_PROJECT_SELECTED", Selected: data });
        $(`#archiveModal`).modal("show");
    }

    handleUnarchive(params) {
        const { dispatch } = { ...this.props };
        putData(`/api/project/archive/${params.id}`, { isDeleted: 0 }, c => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_PROJECT_LIST", UpdatedData: { ...params, isDeleted: 0 } });
                showToast("success", "Successfully Restored.");
            }
        });
    }

    render() {
        const { project, loggedUser } = this.props;
        const { Filter } = { ...project };
        const currentPage = typeof project.Count.current_page != "undefined" ? project.Count.current_page : 1;
        const lastPage = typeof project.Count.last_page != "undefined" ? project.Count.last_page : 1;
        let projectList = project.List;
        if (Filter.sort) {
            const sort = Filter.sort.split("-");
            projectList = _.orderBy(project.List, [sort[0]], [sort[1]]);
        }
        return (
            <div class="row">
                {project.FormActive == "List" && (
                    <div class="col-lg-12">
                        <div id="projectActionTab">
                            <ProjectActionTab />
                        </div>
                        <div id="projectList" class="pd20">
                            <div class={(project.Loading == "RETRIEVING" && projectList.length == 0) || _.isEmpty(project.Count) ? "linear-background" : ""}>
                                {projectList.length > 0 && (
                                    <table id="projectTable">
                                        <thead>
                                            <tr id="thead2">
                                                <th id="th1" class="td-left">
                                                    Project Name
                                                </th>
                                                <th id="th2">Workstreams</th>
                                                <th id="th3">Completion</th>
                                                <th id="th4">Members</th>
                                                <th id="th5">Actions</th>
                                            </tr>
                                            <tr id="thead1" style={{ display: "none" }}>
                                                <th class="td-left">Project Name</th>
                                                <th id="test123">Workstreams</th>
                                                <th>Completion</th>
                                                <th>Members</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {_.map(projectList, (projectElem, index) => {
                                                const { id, project, workstream, members, numberOfTasks, completion_rate, type, isDeleted, team, completionRate } = { ...projectElem };
                                                const memberList = [
                                                    ..._.map(members, ({ firstName, lastName, avatar }) => {
                                                        return {
                                                            name: firstName + " " + lastName,
                                                            avatar
                                                        };
                                                    }),
                                                    ..._.flatten(
                                                        _.map(team, ({ team }) => {
                                                            return _.map(team.users_team, ({ user }) => {
                                                                return {
                                                                    name: user.firstName + " " + user.lastName,
                                                                    avatar: user.avatar
                                                                };
                                                            });
                                                        })
                                                    )
                                                ];
                                                return (
                                                    <tr key={index}>
                                                        <td data-label="Project Name" class={`td-left table-name tdWidth${index}`}>
                                                            <p class="mb0">
                                                                <span>{this.renderStatus(completion_rate)}</span>
                                                                {/* {numberOfTasks > 0 && isDeleted == 0 && <span>{this.renderStatus({ workstream, render_type: "icon" })}</span>} */}
                                                                <Link to={`/projects/${id}`}>{project}</Link>
                                                            </p>
                                                        </td>
                                                        {/* <td data-label="Status">
                                                                {numberOfTasks > 0 && isDeleted == 0 && <div>{this.renderStatus({ workstream, render_type: "text" })}</div>}
                                                                {isDeleted == 1 && <p class="m0 text-red">Archived</p>}
                                                            </td> */}
                                                        {/* <td data-label="Type">
                                                                {typeof updates != "undefined" && updates.count > 0 && (
                                                                    <a data-tip data-for={`update-${index}`}>
                                                                        <p class="mb0 text-blue">
                                                                            {updates.count} update{updates.count > 1 ? "s" : ""}
                                                                        </p>
                                                                    </a>
                                                                )}
                                                                <ReactTooltip id={`update-${index}`} aria-haspopup="true" type={"light"} class="updates-tooltip">
                                                                    <div class="wrapper">
                                                                        {_.map(
                                                                            _.groupBy(updates.list, ({ type }) => {
                                                                                return type;
                                                                            }),
                                                                            (o, key) => {
                                                                                return (
                                                                                    <div key={key}>
                                                                                        <div class="header">
                                                                                            <p class="text-left m0">
                                                                                                <strong>{key}</strong>
                                                                                            </p>
                                                                                        </div>
                                                                                        <div class="list">
                                                                                            {_.map(o, ({ title, sub_title = "", image = "", date = "" }, key) => {
                                                                                                return (
                                                                                                    <div class="tooltip-details display-flex vh-center" key={key}>
                                                                                                        {image != "" && (
                                                                                                            <div class="thumbnail-profile mr5" key={index}>
                                                                                                                <img src={image} alt="Profile Picture" class="img-responsive" />
                                                                                                            </div>
                                                                                                        )}
                                                                                                        <div>
                                                                                                            <p class="m0 text-left title">
                                                                                                                {title.substring(0, 30)}
                                                                                                                {title.length > 30 ? "..." : ""}
                                                                                                            </p>
                                                                                                            {sub_title != "" && <p class="m0 text-left sub-title">{sub_title}</p>}
                                                                                                        </div>
                                                                                                        {date != "" && <p class="m0 flex-right note">{moment(date).format("MMM DD, YYYY")}</p>}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            }
                                                                        )}
                                                                    </div>
                                                                </ReactTooltip>
                                                            </td> */}
                                                        <td className={`tdWidth${index + 2}`} data-label="Workstreams">
                                                            {workstream.length}
                                                        </td>
                                                        <td className={`tdWidth${index + 3}`} data-label="Completion">
                                                            {completionRate > 0 && <p class={`m0 ${completionRate == 100 ? "text-green" : ""}`}>{completionRate.toFixed(2) + "%"}</p>}
                                                        </td>
                                                        <td className={`tdWidth${index + 4}`} data-label="Members">
                                                            <div class="display-flex">
                                                                {_.map(_.take(memberList, 2), ({ name, avatar }, index) => {
                                                                    return (
                                                                        <div class="thumbnail-profile" key={index}>
                                                                            <span title={name}>
                                                                                <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                                {memberList.length > 2 && (
                                                                    <span
                                                                        class="thumbnail-count"
                                                                        title={_(memberList)
                                                                            .filter((o, index) => {
                                                                                return index > 1;
                                                                            })
                                                                            .map(({ name }) => {
                                                                                return name;
                                                                            })
                                                                            .value()
                                                                            .join("\r\n")}
                                                                    >
                                                                        +{memberList.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td
                                                            data-label="Actions"
                                                            class={loggedUser.data.userRole <= 3 || (loggedUser.data.userRole == 4 && (type.type == "Private" || type.type == "Internal")) ? `tdWidth${index + 5}` : `tdWidth${index + 5}`}
                                                        >
                                                            {isDeleted == 0 && (
                                                                <div>
                                                                    <a href="javascript:void(0);" onClick={() => this.handleEdit(projectElem)} class="btn btn-action">
                                                                        <span class="glyphicon glyphicon-pencil" title="EDIT" />
                                                                    </a>
                                                                    {/* <a href="javascript:void(0);" onClick={e => this.handleArchive(projectElem)} class={projectElem.allowedDelete == 0 ? "hide" : "btn btn-action"}>
                                                                            <span class="fa fa-trash" title="DELETE" />
                                                                        </a> */}
                                                                </div>
                                                            )}
                                                            {/* {isDeleted == 1 && (
                                                                    <a href="javascript:void(0);" onClick={() => this.handleUnarchive(projectElem)} class="btn btn-action">
                                                                        <span class="fa fa-window-restore" title="RESTORE" />
                                                                    </a>
                                                                )} */}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                                {project.Loading == "RETRIEVING" && projectList.length > 0 && <Loading />}
                                {currentPage != lastPage && project.Loading != "RETRIEVING" && (
                                    <p class="mb0 text-center">
                                        <a onClick={() => this.getNextResult()}>Load More Projects</a>
                                    </p>
                                )}
                                {projectList.length == 0 && project.Loading != "RETRIEVING" && !_.isEmpty(project.Count) && (
                                    <p class="mb0 text-center">
                                        <strong>No Records Found</strong>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* Modals */}
                <ArchiveModal />
            </div>
        );
    }
}
