import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import Chart from "react-google-charts";

import { getData, showToast } from "../../globalFunction";
import { Loading } from '../../globalComponents';

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        task: store.task,
    }
})
export default class ProfilePerformance extends React.Component {
    constructor(props) {
        super(props);
    }

    componentWillUnmount(){
        const { dispatch } = this.props;
        dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: {} });
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        getData(`/api/task/profileTask?&userId=${loggedUser.data.id}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data[0] });
            dispatch({ type: "SET_TASK_LOADING", Loading: "" });
        });
    }

    render() {
        const currentYear = moment().format("YYYY");
        const { task } = this.props;
        const { StatusCount, Loading: taskLoading } = task;
        const { assigned_tasks = 0, due_today = 0, issues = 0, on_time = 0, remaining = 0 } = StatusCount;
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
        const data = [
            ["Status", "Count"],
            ["On Time", on_time],
            ["Due Today", due_today],
            ["Delayed", issues],
            ["Remaining", remaining]
        ];

        return (
            <div class={(taskLoading == "RETRIEVING" && _.isEmpty(StatusCount)) ? "linear-background mt20 mb20" : "mt20 mb20"}>
                {
                    (_.isEmpty(StatusCount) == false) && <div>
                        <h3 class="m0 mb20 text-center"><strong>{currentYear} Monthly Performance</strong></h3>
                        <div class="row" id="chart-row">
                            <div class="col-lg-5 col-md-12">
                                <div class="chart-wrapper mb10">
                                    <Chart
                                        chartType="PieChart"
                                        width="100%"
                                        height="auto"
                                        data={data}
                                        options={options}
                                        loader={<Loading />}
                                    />
                                    <p class="total text-uppercase">{moment(new Date()).format("MMM")}</p>
                                </div>
                            </div>
                            <div class="col-lg-7 col-md-12">
                                <div class="flex-row monthly-performance">
                                    <div class="flex-col">
                                        <label>Assigned:</label>
                                        <h3>{assigned_tasks}</h3>
                                    </div>
                                    <div class="flex-col">
                                        <label><span class="fa fa-circle mb0 mr5 text-green"></span> On Time:</label>
                                        <h3>{on_time}</h3>
                                    </div>
                                    <div class="flex-col">
                                        <label><span class="fa fa-circle mb0 mr5 text-yellow"></span> Due Today:</label>
                                        <h3>{due_today}</h3>
                                    </div>
                                </div>
                                <div class="flex-row monthly-performance">
                                    <div class="flex-col">
                                        <label><span class="fa fa-circle mb0 mr5 text-red"></span> Delayed:</label>
                                        <h3>{issues}</h3>
                                    </div>
                                    <div class="flex-col">
                                        <label><span class="fa fa-circle mb0 mr5 text-grey-f1"></span> Remaining:</label>
                                        <h3>{remaining}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}