import React from "react";
import _ from "lodash";
import moment from 'moment';
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class taskListCategory extends React.Component {
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
            "renderRow"
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
            this.setState({ loading: "RETRIEVING" }, () => this.getList(1));
        }
    }

    getList(page) {
        const { loggedUser, dispatch, date, task } = this.props;
        const { Filter } = task;

        let fromDate = "";
        let toDate = "";
        let fetchUrl = `/api/task?page=${page}&userId=${loggedUser.data.id}&type=${Filter.type}`;

        switch (date) {
            case "Today":
                fromDate = moment().startOf('month').format("YYYY-MM-DD");
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
            default:
        }

        fetchUrl += `&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;

        getData(fetchUrl, {}, (c) => {
            this.setState({ count: c.data.count, loading: "" }, () => dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result }));
            showToast("success", "Task successfully retrieved.");
        });
    }

    getNext() {
        const { count } = { ...this.state };
        this.setState({ loading: "RETRIEVING" }, () => this.getList(count.current_page + 1));
    }

    renderRow({ index, task: task_name, dueDate, workstream, task_members }) {
        const { task } = { ...this.props };
        const { Filter } = task;
        const given = moment(dueDate, "YYYY-MM-DD");
        const current = moment().startOf('day');
        const { project } = workstream;
        let daysRemaining = moment.duration(given.diff(current)).asDays() + 1;
        daysRemaining = (daysRemaining == 0) ? 1 : daysRemaining;
        const assigned = _.map(task_members, (o) => { return o.user.firstName + " " + o.user.lastName });

        return (
            <tr key={index} class={(daysRemaining < 0) ? "text-red" : ""}>
                <td data-label="Task Name" class="td-left">
                    {task_name}
                </td>
                <td data-label="Deadline">
                    {moment(dueDate).format("MMMM DD, YYYY")}
                </td>
                <td data-label="Time Remaining" class={(daysRemaining == 1) ? "text-yellow" : ""}>
                    {`${Math.abs(daysRemaining)} day(s) ${(daysRemaining < 0) ? "delayed" : ""}`}
                </td>
                <td data-label="Project">
                    <p class="m0">
                        <span title={project.type.type}>
                            <i class={(project.type.type == "Client") ? "fa fa-users mr5" : (project.type.type == "Private") ? "fa fa-lock mr5" : "fa fa-cloud mr5"}></i>
                        </span>
                        {project.project}
                    </p>
                </td>
                {
                    (Filter.type != "assignedToMe") && <td>
                        {
                            assigned.join("\r\n")
                        }
                    </td>
                }
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
                    return daysRemaining > 0 && daysRemaining > 7;
                    break;
                default:
            }
        });

        return taskList;
    }


    render() {
        const { date, task } = { ...this.props };
        const { count, loading } = { ...this.state };
        const currentPage = (typeof count.current_page != "undefined") ? count.current_page : 1;
        const lastPage = (typeof count.last_page != "undefined") ? count.last_page : 1;
        const taskList = this.groupList();

        return (
            <div>
                <div class="card-header">
                    <h4>{date}</h4>
                </div>
                <div class={(loading == "RETRIEVING" && (taskList).length == 0) ? "linear-background" : ""}>
                    <div class="card-body m0">
                        {
                            ((taskList).length > 0) && <table id="my-task">
                                <thead>
                                    <tr>
                                        <th scope="col" class="td-left">Task Name</th>
                                        <th scope="col">Deadline</th>
                                        <th scope="col">Time Remaining</th>
                                        <th scope="col">Project</th>
                                        {
                                            (task.Filter.type != "assignedToMe") && <th scope="col">Assigned</th>
                                        }
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