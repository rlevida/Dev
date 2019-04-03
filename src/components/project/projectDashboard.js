import React from "react";
import _ from "lodash";
import { connect } from "react-redux";
import Chart from "react-google-charts";
import { Link } from 'react-router-dom';
import { getData, showToast } from '../../globalFunction';
import { Loading } from '../../globalComponents';

import Focus from '../focus';

@connect((store) => {
    return {
        projectData: store.project,
        workstream: store.workstream,
        task: store.task,
        loggedUser: store.loggedUser
    }
})
export default class ProjectDashboard extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "fetchProjectStatus",
            "getNextWorkstreams"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        const { workstream } = { ...this.props };
        const { loggedUser, history } = { ...this.props };
        if (loggedUser.data.userRole >= 4 && loggedUser.data.projectId.length === 1) {
            history.push(`/projects/${loggedUser.data.projectId[0]}`)
        } else {
            this.fetchProjectStatus();
            if (_.isEmpty(workstream.Count)) {
                this.fetchCompletionRate(1);
            }
        }
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser } = { ...this.props };

        if (prevProps.match.params.projectId !== this.props.match.params.projectId) {
            if (loggedUser.data.userRole >= 4 && loggedUser.data.projectId.length === 1) {
                history.push(`/projects/${loggedUser.data.projectId[0]}`)
            } else {
                dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: {} });
                dispatch({ type: "SET_WORKSTREAM_LIST", list: [], Count: {} });
                dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
                this.fetchProjectStatus();
                this.fetchCompletionRate(1);
            }
        }
    }

    componentWillUnmount() {
        const { dispatch } = this.props;

        dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: {} });
        dispatch({ type: "SET_WORKSTREAM_LIST", list: [], Count: {} });
        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
    }

    fetchProjectStatus() {
        const { dispatch } = this.props;
        const projectId = this.props.match.params.projectId;

        getData(`/api/task/projectTaskStatus?projectId=${projectId}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, ({ status, data }) => {
            if (status == 200) {
                dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: data });
                showToast("success", "Project details successfully retrieved.");
            } else {
                showToast("error", "Something went wrong. Please try again later.");
            }
        });
    }

    fetchCompletionRate(page) {
        const { dispatch, loggedUser, workstream, match } = this.props;
        const { typeId, workstreamStatus, workstream: workstreamFilter } = workstream.Filter;
        const dueDateMoment = moment().format("YYYY-MM-DD");
        const projectId = match.params.projectId;
        const requestUrl = `/api/workstream?projectId=${projectId}&page=${page}&userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}&typeId=${typeId}&workstreamStatus=${workstreamStatus}&dueDate=${dueDateMoment}&workstream=${workstreamFilter}&isDeleted=0`;

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count });
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    getNextWorkstreams() {
        const { dispatch, workstream } = { ...this.props };
        const { Count } = workstream;

        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
        this.fetchCompletionRate(Count.current_page + 1);
    }

    renderStatusCard({ label, count, class_color }) {
        return (
            <div class="flex-row">
                <div class="flex-col">
                    <p class={`status-count ${class_color}`}>{('0' + count).slice(-2)}</p>
                </div>
                <div class="flex-col">
                    <p class="status-label">{label}</p>
                </div>
            </div>
        );
    }

    render() {
        const { task, workstream } = this.props;
        const { StatusCount } = task;
        const {
            task_due = 0,
            task_for_approval = 0,
            new_files = 0,
            delayed_task = 0
        } = StatusCount;
        const workstreamCurrentPage = (typeof workstream.Count.current_page != "undefined") ? workstream.Count.current_page : 1;
        const workstreamLastPage = (typeof workstream.Count.last_page != "undefined") ? workstream.Count.last_page : 1;
        const statusToBeDisplayed = [
            { label: "Tasks Due Today", count: task_due, class_color: "text-yellow" },
            { label: "Tasks For Approval", count: task_for_approval, class_color: "text-orange" },
            { label: "New Files Uploaded", count: new_files, class_color: "text-blue" },
            { label: "Delayed Tasks", count: delayed_task, class_color: "text-red" }
        ];
        const projectId = this.props.match.params.projectId;
        const chartData = _.map(workstream.List, ({ id, issues, dueToday, completed, task, workstream, completion_rate }) => {
            return {
                data: [
                    ["Workstream", "Completion"],
                    ["Completed", completed.length],
                    ["Due Today", dueToday],
                    ["Delayed", issues],
                    ["In Progress", task.length]
                ],
                title: workstream,
                total: (completion_rate.completed.value).toFixed(2),
                id
            }
        });
        const options = {
            pieHole: 0.6,
            is3D: false,
            legend: 'none',
            width: '100%',
            height: '100%',
            chartArea: {
                left: "3%",
                top: "3%",
                height: "94%",
                width: "94%"
            },
            colors: ['#00e589', '#f6dc64', '#f9003b', '#f1f1f1'],
        };
        return (
            <div class="row content-row">
                <div class="col-lg-12">
                    <h3 class="title">{moment(new Date()).format("MMMM YYYY")}</h3>
                </div>
                {
                    _.map(statusToBeDisplayed, (o, index) => {
                        return (
                            <div class="col-lg-3 col-md-6 col-sm-6 col-xs-12" key={index}>
                                <div class={`card dashboard-card`}>
                                    <div class="card-body">
                                        <div class={(_.isEmpty(StatusCount)) ? "linear-background" : "margin-center"}>
                                            {
                                                (_.isEmpty(StatusCount) == false) && this.renderStatusCard(o)
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 mt30">
                    <div class="card">
                        <div class="card-header"><h4>Workstream Completion Rate</h4></div>
                        <div class="card-body">
                            <div class="container-fluid">
                                {
                                    ((workstream.List).length == 0) && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                }
                                {
                                    ((workstream.List).length > 0) && <div class="row content-row">
                                        {
                                            _.map(chartData, (o, index) => {
                                                return (
                                                    <div class="col-lg-3 col-md-4 col-sm-12 col-xs-12" key={index}>
                                                        <div class="chart-wrapper">
                                                            <Chart
                                                                chartType="PieChart"
                                                                width="100%"
                                                                height="auto"
                                                                data={o.data}
                                                                options={options}
                                                                loader={<Loading />}
                                                            />
                                                            <p class="total">{o.total}%</p>
                                                        </div>
                                                        <Link to={`${this.props.match.url}/workstreams/${o.id}`}>
                                                            <h5 class="text-center title mt0">{o.title}</h5>
                                                        </Link>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                }
                                {
                                    (workstream.Loading == "RETRIEVING" && (workstream.List).length > 0) && <Loading />
                                }
                                {
                                    (_.isEmpty(workstream) == false && (workstreamCurrentPage != workstreamLastPage) && workstream.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextWorkstreams()}>Load More Workstream</a></p>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 mt30">
                    <div class="card">
                        <div class="card-header"><h4>Favorites</h4></div>
                        <div class="card-body">
                            <div class="container-fluid">
                                <div class="row content-row">
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"task"} label={"Tasks"} project_id={projectId} />
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"notes"} label={"Messages"} project_id={projectId} />
                                    </div>
                                    <div class="col-lg-4 col-md-4 col-sm-12 col-xs-12">
                                        <Focus type={"document"} label={"Documents"} project_id={projectId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}