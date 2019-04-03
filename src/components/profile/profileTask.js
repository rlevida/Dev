import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { Loading } from "../../globalComponents";
import { getData } from "../../globalFunction";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task
    }
})
export default class ProfileTask extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "getList",
            "getNext"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_TASK_LIST", list: [], count: {} });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };
        this.getList(1);
    }

    getList(page) {
        const { dispatch, loggedUser } = { ...this.props };
        let fetchUrl = `/api/task?page=${page}&userId=${loggedUser.data.id}&type=assignedToMe`;
        getData(fetchUrl, {}, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
        });
    }

    getNext() {
        const { task, dispatch } = { ...this.props };
        const { Count } = task;
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
        this.getList(Count.current_page + 1);
    }

    render() {
        const { task } = { ...this.props };
        const { Loading: taskLoading, Count, List } = task;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        return (
            <div>
                <h4><strong>Tasks</strong></h4>
                <div class={(taskLoading == "RETRIEVING" && (List).length == 0) ? "linear-background" : ""}>
                    {
                        ((List).length > 0) && <table id="my-task">
                            <thead>
                                <tr>
                                    <th scope="col" class="td-left">Task Name</th>
                                    <th scope="col">Project</th>
                                    <th scope="col">Deadline</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    _.map(List, ({ periodic, task, workstream, dueDate, status }, index) => {
                                        const given = moment(dueDate, "YYYY-MM-DD");
                                        const current = moment().startOf('day');
                                        let daysRemaining = (dueDate != "") ? moment.duration(given.diff(current)).asDays() + 1 : 0;

                                        const colorClass = (daysRemaining < 0 && status != "Completed") ? "text-red" :(daysRemaining == 0 && status != "Completed") ? "text-yellow" : (status == "Completed") ? "text-green" : "";

                                        return (
                                            <tr key={index}>
                                                <td data-label="Task Name" class="td-left">
                                                    {
                                                        (colorClass != "") && <span class={`fa fa-circle mb0 mr5 ${colorClass}`}></span>
                                                    }
                                                    {task}
                                                    {(periodic == 1) && <i class="fa fa-refresh ml10" aria-hidden="true"></i>}
                                                </td>
                                                <td data-label="Project">
                                                    <p class="m0 td-oblong">
                                                        <span title={workstream.project.type.type}>
                                                            <i class={(workstream.project.type.type == "Client") ? "fa fa-users mr5" : (workstream.project.type.type == "Private") ? "fa fa-lock mr5" : "fa fa-cloud mr5"}></i>
                                                        </span>
                                                        {workstream.project.project}
                                                    </p>
                                                </td>
                                                <td data-label="Deadline">
                                                    {
                                                        (dueDate != "" && dueDate != null) ? moment(dueDate).format("MMMM DD, YYYY") : "N/A"
                                                    }
                                                </td>
                                                <td data-label="Status">
                                                    <p class={`m0 ${(status == "Completed") ? "text-green" : (status == "For Approval") ? "text-orange" : ""}`}>
                                                        {status}
                                                    </p>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    }

                    {
                        (currentPage != lastPage && taskLoading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNext()}>Load More Tasks</a></p>
                    }
                    {
                        (taskLoading == "RETRIEVING" && (List).length > 0) && <Loading />
                    }
                    {
                        ((List).length == 0 && taskLoading != "RETRIEVING") && <p class="mb0"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        )
    }
}