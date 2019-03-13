import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, putData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        project: store.project
    }
})
export default class TaskListCategory extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            count: {},
            loading: ""
        };

        _.map([
            "getList",
            "getNext",
            "groupList",
            "renderRow",
            "openTaskDetails",
            "completeTask"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_LIST", list: [] });
        this.setState({ loading: "RETRIEVING" }, () => this.getList(1));
    }

    componentDidUpdate(prevProps) {
        const { task } = this.props;
        if (_.isEqual(prevProps.task.Filter, task.Filter) == false) {
            this.setState({ loading: "RETRIEVING" }, () => {
                this.getList(1)
            });
        }
    }

    completeTask({ id, status, periodic, periodTask }) {
        const { dispatch, loggedUser } = { ...this.props };
        const taskStatus = (status == "For Approval" || status == "Completed") ? "In Progress" : "Completed";

        putData(`/api/task/status/${id}`, { userId: loggedUser.data.id, periodTask, periodic, id, status: taskStatus, date: moment().format("YYYY-MM-DD") }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                showToast("success", "Task successfully updated.");
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
                fromDate = moment().startOf('year').format("YYYY-MM-DD");
                toDate = moment().format("YYYY-MM-DD");
                break;
            case "This week":
                fromDate = moment().add('days', 1).format("YYYY-MM-DD");
                toDate = moment().add('days', 8).format("YYYY-MM-DD");
                break;
            case "This month":
                fromDate = moment().add('days', 9).format("YYYY-MM-DD");
                toDate = moment().add('days', 38).format("YYYY-MM-DD");
                break;
            case "Succeeding month":
                fromDate = moment().add('days', 39).format("YYYY-MM-DD");
                toDate = moment().endOf("year").format("YYYY-MM-DD");
                break;
            default:
        }

        if (typeof date != "undefined" && date != "") {
            fetchUrl += `&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;
        } else {
            fetchUrl += `&dueDate=null`
        }

        if (user_id != "") {
            fetchUrl += `&userId=${user_id}`
        }
        
        if (Filter.task != "") {
            fetchUrl += `&task=${Filter.task}`
        }

        if (workstream_id != "") {
            fetchUrl += `&workstreamId=${workstream_id}`
        }

        if (Filter.type != "") {
            fetchUrl += `&type=${Filter.type}`
        }
        
        getData(fetchUrl, {}, (c) => {
            this.setState({ count: c.data.count, loading: "" }, () => dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result }));
            showToast("success", "Task successfully retrieved.");
        });
    }

    getNext() {
        const { count } = { ...this.state };
        this.setState({ loading: "RETRIEVING" }, () => this.getList(count.current_page + 1));
    }

    openTaskDetails(id) {
        const { dispatch, loggedUser } = { ...this.props };
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });

        $(`#task-details`).modal('show');

        getData(`/api/task/detail/${id}?starredUser=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
                dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            } else {
                showToast("error", "Error retrieving task. Please try again later.");
            }
        });
    }

    renderRow({ index, id, task: task_name, dueDate, workstream, task_members, periodic, status, periodTask, dateCompleted }) {
        const { task, workstream_id = "", loggedUser } = { ...this.props };
        const { Filter } = task;
        const given = moment(dueDate, "YYYY-MM-DD");
        const current = moment().startOf('day');
        const { project } = workstream;
        let daysRemaining = (dueDate != "") ? moment.duration(given.diff(current)).asDays() + 1 : 0;
        daysRemaining = (daysRemaining == 0 && dueDate != "") ? 1 : daysRemaining;
        const isAssignedToMe = _.find(task_members, (o) => { return o.memberType == "assignedTo" && o.user.id == loggedUser.data.id });
        const assigned = _(task_members)
            .filter((o) => { return o.memberType == "assignedTo" })
            .map((o) => { return o.user.firstName + " " + o.user.lastName })
            .value();

        return (
            <tr key={index}>
                <td data-label="Task Name" class="td-left action-td">
                    {
                        (status != "For Approval" && status != "Rejected" && typeof isAssignedToMe != "undefined") && <a onClick={() => this.completeTask({ id, status, periodic, periodTask })}>
                            <span class={`fa mr10 ${(status != "Completed") ? "fa-circle-thin" : "fa-check-circle text-green"}`} title="Complete"></span>
                        </a>
                    }
                    <a
                        onClick={() => this.openTaskDetails(id)}
                        class={(daysRemaining < 0 && status != "Completed") ? "text-red" : ""}
                    >
                        {task_name}
                        {(periodic == 1) && <i class="fa fa-refresh ml10" aria-hidden="true"></i>}
                    </a>
                </td>
                <td data-label="Status">
                    <p class={`m0 ${(status == "Completed") ? "text-green" : (status == "For Approval") ? "text-red" : ""}`}>
                        {status}
                    </p>
                </td>
                <td data-label="Deadline" class={(daysRemaining < 0 && status != "Completed") ? "text-red" : ""}>
                    {
                        `${(dueDate != "" && dueDate != null) ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"}`
                    }
                </td>
                <td data-label="Time Remaining">
                    <p class={`m0 ${(daysRemaining == 1 && status != "Completed") ? "text-yellow" : (daysRemaining < 1 && status != "Completed") ? "text-red" : ""}`}>
                        {
                            `${(dueDate != "" && dueDate != null && status != "Completed") ? Math.abs(daysRemaining) + `${(daysRemaining < 1) ? "  day(s) delayed" : " day(s)"}` : "N/A"}`
                        }
                    </p>
                </td>
                {
                    (Filter.type != "assignedToMe") && <td>
                        {
                            assigned.join("\r\n")
                        }
                    </td>
                }
                {
                    (workstream_id == "") && <td data-label="Project">
                        <p class="m0 td-oblong">
                            <span title={project.type.type}>
                                <i class={(project.type.type == "Client") ? "fa fa-users mr5" : (project.type.type == "Private") ? "fa fa-lock mr5" : "fa fa-cloud mr5"}></i>
                            </span>
                            {project.project}
                        </p>
                    </td>
                }
                <td data-label="Completed On">
                    {
                        (dateCompleted != null) ? moment(dateCompleted).format("MMMM DD, YYYY") : "N/A"
                    }
                </td>
            </tr>
        );
    }

    groupList() {
        const { task, date } = { ...this.props };
        const taskList = _.filter(task.List, (o) => {
            const { dueDate } = o;
            const given = moment(dueDate, "YYYY-MM-DD");
            const current = moment().startOf('day');
            const daysRemaining = moment.duration(given.diff(current)).asDays() + 1;

            switch (date) {
                case "Today":
                    return daysRemaining <= 0;
                    break;
                case "This week":
                    return daysRemaining > 0 && daysRemaining <= 7;
                    break;
                case "This month":
                    return daysRemaining > 7 && daysRemaining <= 23;
                    break;
                case "Succeeding month":
                    return daysRemaining > 23;
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
        const currentPage = (typeof count.current_page != "undefined") ? count.current_page : 1;
        const lastPage = (typeof count.last_page != "undefined") ? count.last_page : 1;
        const taskList = this.groupList();
        return (
            <div>
                <div class="card-header">
                    <h4>{(typeof date != "undefined") ? date : "No Due Date"}</h4>
                </div>
                <div class={(loading == "RETRIEVING" && (taskList).length == 0) ? "linear-background" : ""}>
                    <div class="card-body m0">
                        {
                            ((taskList).length > 0) && <table id="my-task">
                                <thead>
                                    <tr>
                                        <th scope="col" class="td-left">Task Name</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Deadline</th>
                                        <th scope="col">Time Remaining</th>
                                        {
                                            (task.Filter.type != "assignedToMe") && <th scope="col">Assigned</th>
                                        }
                                        {
                                            (workstream_id == "") && <th scope="col">Project</th>
                                        }
                                        <th scope="col">Completed On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        _.map(taskList, (taskObj, index) => {
                                            return this.renderRow({ ...taskObj, index })
                                        })
                                    }
                                </tbody>
                            </table>
                        }
                        {
                            (loading == "RETRIEVING" && (taskList).length > 0) && <Loading />
                        }
                        {
                            (currentPage != lastPage && loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Tasks</a></p>
                        }
                        {
                            ((taskList).length == 0 && loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                        }
                    </div>
                </div>
            </div>
        );
    }
}