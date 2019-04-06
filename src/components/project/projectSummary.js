import React from "react";
import moment from 'moment';
import _ from 'lodash';
import { connect } from "react-redux";
import ReactTooltip from 'react-tooltip';

import { Loading, ProgressBar } from "../../globalComponents";
import { showToast, getData } from "../../globalFunction";

let keyTimer = "";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        type: store.type
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        _.map([
            "getNextResult",
            "setFilter",
            "fetchProject",
            "fetchType",
            "renderStatus",
            "getLateTasks",
            "getWorkstreams"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        this.fetchProject(1);
        this.fetchType();
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_LIST", list: [] });
        dispatch({ type: "SET_WORKSTREAM_LIST", list: [] });
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
    }

    componentDidUpdate(prevProps) {
        const { dispatch, project } = { ...this.props };

        if (_.isEqual(prevProps.project.Filter, project.Filter) == false) {
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_PROJECT_LIST", list: [] });

            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                this.fetchProject(1);
            }, 1000);
        }
    }

    fetchType() {
        const { dispatch } = this.props;

        getData(`/api/type`, {}, (c) => {
            dispatch({ type: "SET_TYPE_LIST", list: c.data })
        });
    }

    fetchProject(page) {
        const { dispatch, project, loggedUser } = { ...this.props };
        const { typeId, projectStatus } = project.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");
        let requestUrl = `/api/project?page=${page}&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`;

        if (loggedUser.data.userRole >= 3) {
            requestUrl += `&id=${loggedUser.data.projectId}`
        }

        getData(requestUrl, {}, (c) => {
            const projectList = (page == 1) ? c.data.result : [...project.List, ...c.data.result];
            dispatch({ type: "SET_PROJECT_LIST", list: projectList, count: c.data.count });
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
            showToast("success", "Project successfully retrieved.");
        });
    }

    getNextResult() {
        const { project, dispatch } = { ...this.props };
        const { Count } = project;
        dispatch({ type: "SET_PROJECT_LOADING", Loading: "RETRIEVING" });
        this.fetchProject(Count.current_page + 1);
    }

    setFilter(name, e) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_PROJECT_FILTER", filter: { [name]: e } });
    }

    renderStatus({ delayed_task, tasks_due_today, completed }) {
        const color = (delayed_task.count > 0) ? "text-red" : (tasks_due_today.count > 0) ? "text-yellow" : (completed.count > 0) ? "text-green" : "hide";
        return <span class={`fa fa-circle mb0 mr5 ${color}`}></span>;
    }

    getLateTasks({ id, type }) {
        const { dispatch } = { ...this.props };
        const fromDate = moment().startOf('month').format("YYYY-MM-DD");
        const toDate = moment().endOf('month').format("YYYY-MM-DD");
        const today = moment().format("YYYY-MM-DD");
        let fetchUrl = `/api/task?dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;

        if (type == "project") {
            fetchUrl += `&projectId=${id}`
        }

        if (type == "workstream") {
            fetchUrl += `&workstreamId=${id}`
        }

        getData(fetchUrl, {}, (c) => {
            const result = c.data.result;
            const delayedTasks = _.filter(result, (o) => {
                return o.status == "In Progress" && moment(o.dueDate).isBefore(today)
            });
            const remainingTasks = _.filter(result, (o) => {
                const indexChecker = _.findIndex(delayedTasks, function (delayedTask) { return delayedTask.id == o.id });
                return indexChecker < 0;
            });
            const taskList = [...delayedTasks, ...remainingTasks];

            dispatch({ type: "SET_TASK_LIST", list: taskList });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
        });

        $('#completion-tasks').modal("show");
    }

    getWorkstreams(id) {
        const { dispatch, workstream } = { ...this.props };
        const dueDateMoment = moment().format("YYYY-MM-DD");
        const requestUrl = `/api/workstream?projectId=${id}&dueDate=${dueDateMoment}`;
        const projectWorkstream = _.filter(workstream.List, (o) => { return o.projectId == id });

        if (projectWorkstream.length > 0) {
            dispatch({
                type: "SET_WORKSTREAM_LIST", list: _.remove(workstream.List, (listObj) => {
                    return listObj.projectId != id;
                })
            });
        } else {
            getData(requestUrl, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result });
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }
    }

    renderRow({ id, name, type, entity_type, new_files, dateUpdated, completion_rate, numberOfTasks }, index) {
        const completionRate = (completion_rate != "") ? _(completion_rate)
            .mapValues(({ value, color, count }, key) => {
                return {
                    label: `${key.replace(/[_-]/g, " ")}`,
                    value: value.toFixed(2),
                    color: color,
                    count
                }
            })
            .values()
            .value() : [];
        const completionValue = _.find(completionRate, (o) => { return o.label == "completed" }).value;
        return (
            <tr key={index}>
                <td data-label="Project Name" class={(entity_type == "project") ? "td-left" : ""}>
                    {
                        (entity_type == "project") ? <a class="text-violet" onClick={() => this.getWorkstreams(id)}>
                            {this.renderStatus(completion_rate)}
                            <strong>{name}</strong>
                        </a> : <p class="mb0 text-italic">{name}</p>
                    }

                </td>
                <td data-label="Type">
                    <p class={`m0 ${(entity_type == "workstream") ? "text-italic" : ""}`}>
                        <span title={type}>
                            <i class={(type == "Client") ? "fa fa-users" : (type == "Private") ? "fa fa-lock" : (type == "Internal") ? "fa fa-cloud" : (type == "Output based") ? "fa fa-upload" : "fa fa-clock-o"}></i>
                        </span>
                    </p>
                </td>
                <td data-label="New Files">
                    <p class={`m0 ${(entity_type == "workstream") ? "text-italic" : ""}`}>
                        {new_files}
                    </p>
                </td>
                <td data-label="Last Update">
                    <p class={`m0 ${(entity_type == "workstream") ? "text-italic" : ""}`}>
                        {moment(dateUpdated).from(new Date())}
                    </p>
                </td>
                <td data-label="Active Month Completion Rate">
                    <a data-tip data-for={`task-${index}`}>
                        <ProgressBar data={completionRate} />
                        <p class={`m0 ${(entity_type == "workstream") ? "text-italic" : ""}`}>{completionValue}%</p>
                    </a>
                    <ReactTooltip id={`task-${index}`} aria-haspopup='true' type={'light'}>
                        <div class="wrapper">
                            <div class="display-flex mb5">
                                <p class={`count ${(completion_rate.tasks_due_today.count > 0) ? "text-yellow" : "text-light-grey"}`}>
                                    <strong>{completion_rate.tasks_due_today.count}</strong>
                                </p>
                                <p class={`tooltip-label ${(completion_rate.tasks_due_today.count > 0) ? "" : "text-light-grey"}`}>
                                    Task due today
                                </p>
                            </div>
                            <div class="display-flex mb5">
                                <p
                                    class={`count ${(completion_rate.tasks_for_approval.count > 0) ? "text-orange" : "text-light-grey"}`}
                                >
                                    <strong>{completion_rate.tasks_for_approval.count}</strong>
                                </p>
                                <p class={`tooltip-label ${(completion_rate.tasks_for_approval.count > 0) ? "" : "text-light-grey"}`}>
                                    Task for approval
                                </p>
                            </div>
                            <div class="display-flex">
                                <p
                                    class={`count ${(completion_rate.delayed_task.count > 0) ? "text-red" : "text-light-grey"}`}>
                                    <strong>{completion_rate.delayed_task.count}</strong>
                                </p>
                                <p
                                    class={`tooltip-label ${(completion_rate.delayed_task.count > 0) ? "" : "text-light-grey"}`}>
                                    Delayed tasks
                                </p>
                            </div>
                        </div>
                        <div class="sep"></div>
                        <div class="wrapper">
                            <div class="display-flex">
                                <p>Completed <strong><span class="text-green">{completion_rate.completed.count}</span></strong> out of <strong>{numberOfTasks}</strong> tasks</p>
                            </div>
                        </div>
                    </ReactTooltip>
                </td>
            </tr>
        )
    }


    render() {
        const { project, type, workstream } = { ...this.props };
        const currentPage = (typeof project.Count.current_page != "undefined") ? project.Count.current_page : 1;
        const lastPage = (typeof project.Count.last_page != "undefined") ? project.Count.last_page : 1;
        const projectTypes = [...[{ id: "", name: "All" }], ..._(type.List).filter((o) => { return o.linkType == "project" }).map((o) => { return { id: o.id, name: o.type } }).value()];
        const projectList = _.map(project.List, ({ id, project, type, newDocuments, dateUpdated, completion_rate, numberOfTasks }) => {
            return {
                id,
                name: project,
                type: type.type,
                new_files: newDocuments,
                dateUpdated,
                completion_rate,
                entity_type: "project",
                numberOfTasks,
                workstream: _(workstream.List)
                    .map(({ id, workstream, type, new_documents, dateUpdated, completion_rate, projectId, numberOfTasks }) => {
                        return {
                            id,
                            name: workstream,
                            type: (type != null) ? type.type : "",
                            new_files: new_documents,
                            dateUpdated,
                            completion_rate,
                            projectId,
                            entity_type: "workstream",
                            numberOfTasks
                        }
                    })
                    .filter((o) => { return o.projectId == id })
                    .value()
            }
        });
        const resultList = _.flatMap(projectList, function (o) {
            return [o, ..._.map(o.workstream, function (o) {
                return o;
            })]
        });

        return (
            <div>
                <div class="flex-row tab-row">
                    {
                        _.map(projectTypes, (projectType, index) => {
                            return (<div class="flex-col" key={index}>
                                <a class={(projectType.id == project.Filter.typeId) ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setFilter("typeId", projectType.id)}>{projectType.name}</a>
                            </div>)
                        })
                    }
                </div>
                <div class={(project.Loading == "RETRIEVING" && (project.List).length == 0) ? "linear-background" : ""}>
                    {
                        ((project.List).length > 0) && <table id="project_summary">
                            <thead>
                                <tr>
                                    <th scope="col" class="td-left">Project Name</th>
                                    <th scope="col">Type</th>
                                    <th scope="col">New Files</th>
                                    <th scope="col">Last Update</th>
                                    <th scope="col">Active Month Completion Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.map(resultList, (o, index) => {
                                        return (
                                            this.renderRow(o, index)
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
        )
    }
}