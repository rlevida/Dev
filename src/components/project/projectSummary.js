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
        const { dispatch, project } = { ...this.props };
        const { typeId, projectStatus } = project.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");

        getData(`/api/project?page=${page}&typeId=${typeId}&projectStatus=${projectStatus}&dueDate=${dueDateMoment}`, {}, (c) => {
            dispatch({ type: "SET_PROJECT_LIST", list: [...project.List, ...c.data.result], count: c.data.count });
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

    renderStatus({ lateWorkstream, workstreamTaskDueToday, render_type }) {
        const status = (lateWorkstream > 0) ? `${lateWorkstream} stream(s) delayed` : (workstreamTaskDueToday > 0) ? `${workstreamTaskDueToday} stream(s) due today` : `On track`;
        const color = (lateWorkstream > 0) ? "text-red" : (workstreamTaskDueToday > 0) ? "text-yellow" : "text-green";
        const component = (render_type == "text") ? <p class={`mb0 ${color}`}>
            {status}
        </p> : <span class={`fa fa-circle mb0 mr5 ${color}`}></span>
        return (component);
    }

    getLateTasks(projectId) {
        const { dispatch } = { ...this.props };
        const fromDate = moment().startOf('month').format("YYYY-MM-DD");
        const toDate = moment().endOf('month').format("YYYY-MM-DD");
        const today = moment().format("YYYY-MM-DD");

        let fetchUrl = `/api/task?projectId=${projectId}&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;

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
        const requestUrl = `/api/workstream?projectId=${id}`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result });
                showToast("success", "Workstream successfully retrieved.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    render() {
        const { project, type } = { ...this.props };
        const currentPage = (typeof project.Count.current_page != "undefined") ? project.Count.current_page : 1;
        const lastPage = (typeof project.Count.last_page != "undefined") ? project.Count.last_page : 1;
        const projectTypes = [...[{ id: "", name: "All" }], ..._(type.List).filter((o) => { return o.linkType == "project" }).map((o) => { return { id: o.id, name: o.type } }).value()];

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
                                    _.map(project.List, (projectElem, index) => {
                                        const { id, project, type, newDocuments, dateUpdated, completion_rate, numberOfTasks, workstream } = { ...projectElem };
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
                                        const taskDueTodayCount = _.find(completionRate, (o) => { return o.label == "tasks due today" }).count;
                                        const forApprovalCount = _.find(completionRate, (o) => { return o.label == "tasks for approval" }).count;
                                        const delayedTaskCount = _.find(completionRate, (o) => { return o.label == "delayed task" }).count;
                                        const completedCount = _.find(completionRate, (o) => { return o.label == "completed" }).count;
                                            
                                        console.log(moment(dateUpdated).format('LLL'))
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
                                                        {project}
                                                    </p>
                                                </td>
                                                <td data-label="Type">
                                                    <p class="mb0">
                                                        <span title={type.type}>
                                                            <i class={(type.type == "Client") ? "fa fa-users" : (type.type == "Private") ? "fa fa-lock" : "fa fa-cloud"}></i>
                                                        </span>
                                                    </p>
                                                </td>
                                                <td data-label="New Files">
                                                    <p class="mb0">
                                                        {newDocuments}
                                                    </p>
                                                </td>
                                                <td data-label="Last Update">
                                                    <p class="mb0">
                                                        {moment(dateUpdated).from(new Date())}
                                                    </p>
                                                </td>
                                                <td data-label="Active Month Completion Rate">
                                                    <a data-tip data-for={`task-${index}`} onClick={() => this.getLateTasks(id)}>
                                                        <ProgressBar data={completionRate} />
                                                        <p class="mb0">{completionValue}%</p>
                                                    </a>
                                                    <ReactTooltip id={`task-${index}`} aria-haspopup='true' type={'light'}>
                                                        <div class="wrapper">
                                                            <div class="display-flex mb5">
                                                                <p class={`count ${(taskDueTodayCount > 0) ? "text-yellow" : "text-light-grey"}`}>
                                                                    <strong>{taskDueTodayCount}</strong>
                                                                </p>
                                                                <p class={`tooltip-label ${(taskDueTodayCount > 0) ? "" : "text-light-grey"}`}>
                                                                    Task due today
                                                            </p>
                                                            </div>
                                                            <div class="display-flex mb5">
                                                                <p
                                                                    class={`count ${(forApprovalCount > 0) ? "text-orange" : "text-light-grey"}`}
                                                                >
                                                                    <strong>{forApprovalCount}</strong>
                                                                </p>
                                                                <p class={`tooltip-label ${(forApprovalCount > 0) ? "" : "text-light-grey"}`}>
                                                                    Task for approval
                                                            </p>
                                                            </div>
                                                            <div class="display-flex">
                                                                <p
                                                                    class={`count ${(delayedTaskCount > 0) ? "text-red" : "text-light-grey"}`}>
                                                                    <strong>{delayedTaskCount}</strong>
                                                                </p>
                                                                <p
                                                                    class={`tooltip-label ${(delayedTaskCount > 0) ? "" : "text-light-grey"}`}>
                                                                    Delayed tasks
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div class="sep"></div>
                                                        <div class="wrapper">
                                                            <div class="display-flex">
                                                                <p>Completed <strong><span class="text-green">{completedCount}</span></strong> out of <strong>{numberOfTasks}</strong> tasks</p>
                                                            </div>
                                                        </div>
                                                    </ReactTooltip>
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
        )
    }
}