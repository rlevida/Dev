import React from "react";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, putData, showToast, getParameterByName, textColor } from "../../globalFunction";
let currentTaskId = "";

@connect(store => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        project: store.project
    };
})
export default class TaskListCategory extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            count: {},
            loading: ""
        };

        _.map(["getList", "getNext", "groupList", "renderRow", "openTaskDetails", "completeTask"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };
        const taskId = getParameterByName("task-id");

        dispatch({ type: "SET_TASK_LIST", list: [] });
        this.setState({ loading: "RETRIEVING" }, () => this.getList(1));

        if (taskId != null) {
            setTimeout(() => {
                this.openTaskDetails(taskId);
            }, 500);
        }
    }

    componentDidUpdate(prevProps) {
        const { task } = this.props;
        const taskId = getParameterByName("task-id");

        if (_.isEqual(prevProps.task.Filter, task.Filter) == false) {
            this.setState({ loading: "RETRIEVING" }, () => {
                this.getList(1);
            });
        }
    }

    completeTask(selectedTask) {
        const { id, status, periodic, periodTask, approvalRequired } = { ...selectedTask };
        const { dispatch, loggedUser, task } = { ...this.props };
        const taskStatus = status == "Completed" && approvalRequired == 0 ? "In Progress" : status == "Completed" && approvalRequired == 1 ? "For Approval" : "Completed";

        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: taskStatus, date: moment().format("YYYY-MM-DD HH:mm:ss") }, c => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                showToast("success", "Task successfully updated.");
                if (taskStatus === "Completed") {
                    dispatch({ type: "DELETE_TASK_TIMELINE", id: selectedTask.id });
                } else if (taskStatus === "In Progress") {
                    const taskTimeline = task.Timeline.concat([{ ...selectedTask, status: taskStatus }]);
                    dispatch({ type: "SET_TASK_TIMELINE", list: _.orderBy(taskTimeline, ["dueDate"], ["asc"]) });
                }
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    getList(page) {
        const { dispatch, date, task, workstream_id = "", user_id = "" } = this.props;
        const { Filter } = task;
        let fromDate = "";
        let toDate = "";

        let fetchUrl = `/api/task?page=${page}`;

        switch (date) {
            case "Today":
                fromDate = moment()
                    .startOf("year")
                    .format("YYYY-MM-DD");
                toDate = moment().format("YYYY-MM-DD");
                break;
            case "This week":
                fromDate = moment()
                    .add("days", 1)
                    .format("YYYY-MM-DD");
                toDate = moment()
                    .endOf("week")
                    .format("YYYY-MM-DD");
                break;
            case "This month":
                fromDate = moment()
                    .endOf("week")
                    .add("days", 1)
                    .format("YYYY-MM-DD");
                toDate = moment()
                    .endOf("month")
                    .format("YYYY-MM-DD");
                break;
            case "Succeeding month":
                fromDate = moment()
                    .endOf("month")
                    .add("days", 1)
                    .format("YYYY-MM-DD");
                toDate = moment()
                    .endOf("year")
                    .format("YYYY-MM-DD");
                break;
            default:
        }
        if (typeof date != "undefined" && date != "" && date != null) {
            fetchUrl += `&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;
        } else {
            fetchUrl += `&dueDate=null`;
        }

        if (user_id != "") {
            fetchUrl += `&userId=${user_id}`;
        }

        if (Filter.task != "") {
            fetchUrl += `&task=${Filter.task}`;
        }

        if (workstream_id != "") {
            fetchUrl += `&workstreamId=${workstream_id}`;
        }

        if (Filter.type != "") {
            fetchUrl += `&type=${Filter.type}`;
        }

        if (Filter.taskStatus != "") {
            if (Filter.taskStatus === "Active") {
                fetchUrl += `&status=${JSON.stringify({ opt: "not", value: "Completed" })}&isActive=1`;
            } else {
                fetchUrl += `&status=${JSON.stringify({ opt: "eq", value: Filter.taskStatus })}`;
            }
        }
        if (Filter.taskAssigned != "") {
            fetchUrl += `&assigned=${Filter.taskAssigned}`;
        }

        getData(fetchUrl, {}, c => {
            this.setState({ count: c.data.count, loading: "" }, () => dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result }));
        });
    }

    getNext() {
        const { count } = { ...this.state };
        this.setState({ loading: "RETRIEVING" }, () => this.getList(count.current_page + 1));
    }

    openTaskDetails(id) {
        const { dispatch, loggedUser } = { ...this.props };
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });

        getData(`/api/activityLog?taskId=${id}&page=1&includes=user`, {}, c => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_ACTIVITYLOG_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/conversation/getConversationList?page=1&linkType=task&linkId=${id}`, {}, c => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_COMMENT_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/task/detail/${id}?starredUser=${loggedUser.data.id}`, {}, c => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
                dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                $(`#task-details`).modal("show");
            }
        });

        getData(`/api/taskTimeLogs?taskId=${id}&page=1`, {}, c => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASKTIMELOG_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_TOTAL_HOURS", total: c.data.total_hours });
            }
        });
    }

    renderRow(taskData) {
        const { index, id, task: task_name, dueDate, workstream, task_members, periodic, status, periodTask, dateCompleted, checklist, approvalRequired, approverId } = { ...taskData };
        const { task, workstream_id = "", loggedUser } = { ...this.props };
        const { Filter } = task;
        const given = moment(dueDate, "YYYY-MM-DD");
        const current = moment().startOf("day");
        const { project } = workstream;
        let daysRemaining = dueDate != "" ? moment.duration(given.diff(current)).asDays() + 1 : 0;
        const isAssignedToMe = _.find(task_members, o => {
            return o.memberType == "assignedTo" && o.user.id == loggedUser.data.id;
        });
        const assigned = _.find(task_members, o => {
            return o.memberType == "assignedTo";
        });

        return (
            <tr key={index}>
                <td data-label="Task Name" class="td-left">
                    <div class="action-td">
                        {((status != "For Approval" &&
                            status != "Rejected" &&
                            (checklist.length == 0 ||
                                _.filter(checklist, ({ isCompleted }) => {
                                    return isCompleted == 1;
                                }).length == checklist.length) &&
                            (loggedUser.data.userRole < 4 ||
                                typeof isAssignedToMe != "undefined" ||
                                (loggedUser.data.userRole >= 4 && project.type.type == "Client" && assigned.user.userType == "External") ||
                                (loggedUser.data.userRole >= 4 && project.type.type == "Internal" && assigned.user.user_role[0].roleId == 4)) &&
                            approvalRequired == 0) ||
                            (status != "In Progress" && status != "Rejected" && approvalRequired == 1 && approverId == loggedUser.data.id)) && (
                            <a onClick={() => this.completeTask(taskData)}>
                                <span class={`fa mr10 ${status != "Completed" ? "fa-circle-thin" : "fa-check-circle text-green"}`} title="Complete" />
                            </a>
                        )}
                        <a
                            onClick={() => this.openTaskDetails(id)}
                            style={{
                                marginLeft:
                                    (status != "For Approval" &&
                                        status != "Rejected" &&
                                        (checklist.length == 0 ||
                                            _.filter(checklist, ({ isCompleted }) => {
                                                return isCompleted == 1;
                                            }).length == checklist.length) &&
                                        (loggedUser.data.userRole < 4 ||
                                            typeof isAssignedToMe != "undefined" ||
                                            (loggedUser.data.userRole >= 4 && project.type.type == "Client" && assigned.user.userType == "External") ||
                                            (loggedUser.data.userRole >= 4 && project.type.type == "Internal" && assigned.user.user_role[0].roleId == 4)) &&
                                        approvalRequired == 0) ||
                                    (status != "In Progress" && status != "Rejected" && approvalRequired == 1 && approverId == loggedUser.data.id)
                                        ? 0
                                        : 30
                            }}
                        >
                            {task_name}
                            {periodic == 1 && <i class="fa fa-refresh ml10" aria-hidden="true" />}
                        </a>
                    </div>
                </td>
                <td data-label="Status">
                    <p class={`m0 ${status == "Completed" ? "text-green" : status == "For Approval" ? "text-orange" : ""}`}>{status}</p>
                </td>
                <td data-label="Deadline" class={daysRemaining < 0 && status != "Completed" ? "text-red" : ""}>
                    {dueDate != "" && dueDate != null ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"}
                </td>
                <td data-label="Time Remaining">
                    <p class={`m0 ${daysRemaining == 0 && status != "Completed" ? "text-yellow" : daysRemaining < 1 && status != "Completed" ? "text-red" : ""}`}>
                        {`${
                            dueDate != "" && dueDate != null && status != "Completed"
                                ? daysRemaining == 0
                                    ? "Today"
                                    : Math.abs(daysRemaining) + `${daysRemaining < 1 ? `  day${Math.abs(daysRemaining) > 1 ? "s" : ""} delayed` : ` day${Math.abs(daysRemaining) > 1 ? "s" : ""}`}`
                                : "N/A"
                        }`}
                    </p>
                </td>
                {Filter.type != "assignedToMe" && (
                    <td data-label="Assigned">
                        <div class="display-flex">
                            <div class="thumbnail-profile">
                                <span title={assigned.user.firstName + " " + assigned.user.lastName}>
                                    <img src={assigned.user.avatar} alt="Profile Picture" class="img-responsive" />
                                </span>
                            </div>
                        </div>
                    </td>
                )}
                {workstream_id == "" && (
                    <td data-label="Project">
                        <p class="m0 td-oblong" style={{ backgroundColor: project.color, color: textColor(project.color) }}>
                            <span title={project.type.type}>
                                <i class={project.type.type == "Client" ? "fa fa-users mr5" : project.type.type == "Private" ? "fa fa-lock mr5" : "fa fa-cloud mr5"} />
                            </span>
                            {project.project}
                        </p>
                    </td>
                )}
                <td data-label="Completed On">{dateCompleted != null ? moment(dateCompleted).format("MMMM DD, YYYY") : "N/A"}</td>
            </tr>
        );
    }

    groupList() {
        const { task, date } = { ...this.props };
        const taskList = _.filter(task.List, o => {
            const { dueDate } = o;
            const given = moment(dueDate).local();
            const current = moment().startOf("day");

            switch (date) {
                case "Today":
                    return given.isSameOrBefore(moment().endOf("day"));
                    break;
                case "This week":
                    return given.isAfter(moment().endOf("day")) && given.isBefore(moment().endOf("week"));
                    break;
                case "This month":
                    return given.isAfter(moment().endOf("week")) && given.isBefore(moment().endOf("month"));
                    break;
                case "Succeeding month":
                    return given.isAfter(moment().endOf("month"));
                    break;
                default:
                    return dueDate == null;
            }
        });
        return taskList;
    }

    render() {
        const { date, task, workstream_id = "" } = { ...this.props };
        const { count, loading } = { ...this.state };
        const currentPage = typeof count.current_page != "undefined" ? count.current_page : 1;
        const lastPage = typeof count.last_page != "undefined" ? count.last_page : 1;
        const taskList = this.groupList();
        return (
            <div>
                <div class="card-header">
                    <h4>{typeof date != "undefined" ? date : "No due date"}</h4>
                </div>
                <div class={loading == "RETRIEVING" && taskList.length == 0 ? "linear-background" : ""}>
                    <div class="card-body m0">
                        {taskList.length > 0 && (
                            <table id="my-task">
                                <thead>
                                    <tr>
                                        <th scope="col" class="td-left">
                                            Task Name
                                        </th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Deadline</th>
                                        <th scope="col">Time Remaining</th>
                                        {task.Filter.type != "assignedToMe" && <th scope="col">Assigned</th>}
                                        {workstream_id == "" && <th scope="col">Project</th>}
                                        <th scope="col">Completed On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {_.map(taskList, (taskObj, index) => {
                                        return this.renderRow({ ...taskObj, index });
                                    })}
                                </tbody>
                            </table>
                        )}
                        {loading == "RETRIEVING" && taskList.length > 0 && <Loading />}
                        {currentPage != lastPage && loading != "RETRIEVING" && (
                            <p class="mb0 text-center">
                                <a onClick={() => this.getNext()}>Load More Tasks</a>
                            </p>
                        )}
                        {taskList.length == 0 && loading != "RETRIEVING" && (
                            <p class="mb0 text-center">
                                <strong>No Records Found</strong>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}
