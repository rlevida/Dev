import React from "react";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, putData, deleteData, showToast } from "../../globalFunction";
import { Chart } from "react-google-charts";

@connect(store => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        workstream: store.workstream
    };
})
export default class TaskTimeline extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            count: {},
            loading: "",
            chart_height: 43
        };

        _.map(["deleteData", "updateStatus", "getList"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        this.setState({ loading: "RETRIEVING" }, () => this.getList(1));
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({
            type: "SET_TASK_TIMELINE",
            list: []
        });
    }

    getList(page) {
        const { dispatch, workstream_id } = this.props;
        let requestUrl = `/api/task?workstreamId=${workstream_id}&page=${page}&listType=timeline&status=${JSON.stringify({ opt: "not", value: "Completed" })}&isActive=1`;

        dispatch({ type: "SET_SCREEN_LOADER", Loading: true });

        getData(requestUrl, {}, c => {
            const { task } = { ...this.props };
            const { Timeline } = task;
            const taskStack = [...Timeline, ...c.data.result];

            this.setState({ loading: false, count: c.data.count, chart_height: 43 * taskStack.length + 50 }, () => {
                dispatch({
                    type: "SET_TASK_TIMELINE",
                    list: taskStack
                });
                dispatch({ type: "SET_SCREEN_LOADER", Loading: false });
            });
        });
    }

    getNext() {
        const { count } = { ...this.state };
        this.setState({ loading: "RETRIEVING" }, () => this.getList(count.current_page + 1));
    }

    updateStatus({ id, periodTask, periodic }) {
        let { dispatch, loggedUser } = this.props;

        putData(
            `/api/task/status/${id}`,
            {
                userId: loggedUser.data.id,
                periodTask,
                periodic,
                id,
                status: "Completed"
            },
            c => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
                dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            }
        );
    }

    deleteData(id) {
        let { dispatch } = this.props;

        if (confirm("Do you really want to delete this record?")) {
            deleteData(`/api/task/${id}`, {}, c => {
                if (c.status == 200) {
                    dispatch({ type: "DELETE_TASK", id });
                    showToast("success", "Task successfully deleted.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }
    }

    render() {
        const { task } = { ...this.props };
        const { Timeline } = task;
        const { loading, count, chart_height } = { ...this.state };
        const chartLabel = [{ type: "string", id: "Date" }, { type: "string", id: "Task Name" }, { type: "date", id: "Start Date" }, { type: "date", id: "Due Date" }];
        const taskData = _.map(Timeline, (o, index) => {
            const { startDate, dueDate } = o;
            const startDateString = startDate != null ? moment(startDate).toDate() : moment(dueDate).toDate();
            const endDateString = moment(dueDate).endOf("day");
            return ["Task" + " - " + (index + 1).toString(), o.task, startDateString, endDateString];
        });
        const chartData = [...[chartLabel], ...taskData];
        const currentPage = typeof count.current_page != "undefined" ? count.current_page : 1;
        const lastPage = typeof count.last_page != "undefined" ? count.last_page : 1;
        return (
            <div class="card">
                <div class="card-header">
                    <div class="row content-row">
                        <div class="col-md-6 col-sm-6 col-xs-12">
                            <h4>Timeline</h4>
                        </div>
                        <div class="col-md-6 col-sm-6 col-xs-12" />
                    </div>
                </div>
                <div class={loading === "RETRIEVING" && Timeline.length === 0 ? "linear-background" : ""}>
                    <div class="card-body m0">
                        <div class="mt20">
                            {Timeline.length > 0 && (
                                <Chart
                                    width={"100%"}
                                    height={chart_height}
                                    chartType="Timeline"
                                    loader={<Loading />}
                                    data={chartData}
                                    options={{
                                        is3d: true
                                    }}
                                />
                            )}
                            {Timeline.length == 0 && loading != "RETRIEVING" && (
                                <p class="text-center">
                                    <strong>No Records Found</strong>
                                </p>
                            )}
                            {currentPage != lastPage && loading != "RETRIEVING" && (
                                <p class="mb0 text-center">
                                    <a onClick={() => this.getNext()}>Load More Tasks</a>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
