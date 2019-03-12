import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import { getData } from '../../globalFunction'

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser,
        project: store.project
    }
})

export default class myTaskStatus extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "sumBy",
            "visitPage"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        getData(`/api/task/myTaskStatus?&userId=${loggedUser.data.id}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    sumBy(type, by) {
        const { task } = this.props;
        const { StatusCount } = task;
        const assignedToMeTaskCount = _.sumBy(StatusCount[type], (o) => { return o[by] });
        return assignedToMeTaskCount;
    }

    visitPage(type) {
        const { dispatch, history } = { ...this.props };
        dispatch({ type: "SET_TASK_FILTER", filter: { type } });
        history.push('/my-tasks');
    }

    render() {
        const { task } = this.props;
        const { StatusCount } = task;
        const assignedTask = this.sumBy("assigned_to_me", "due_today");
        const assignedIssues = this.sumBy("assigned_to_me", "issues");
        const followingTasks = this.sumBy("following", "due_today");
        const followingIssues = this.sumBy("following", "issues");
        const teamTask = this.sumBy("team", "due_today");
        const teamIssues = this.sumBy("team", "issues");

        return (
            <div class={(_.isEmpty(StatusCount)) ? "linear-background" : ""}>
                {
                    (_.isEmpty(StatusCount) == false) && <div class="row content-row status-count">
                        <div class="col-lg-4 text-center">
                            <a onClick={() => this.visitPage("assignedToMe")}>
                                <p class="status-count text-orange">{('0' + assignedTask).slice(-2)}</p>
                                <p class="status-label">Assigned to me</p>
                                <p class="status-sublabel">for {(typeof StatusCount.assigned_to_me != "undefined") ? (StatusCount.assigned_to_me).length : '0'} Projects</p>
                                <p class="status-sublabel text-red">{(typeof StatusCount.assigned_to_me != "undefined") ? (assignedIssues > 0) ? assignedIssues : 'No' : 'No'} delayed tasks</p>
                            </a>
                        </div>
                        <div class="col-lg-4 text-center">
                            <a onClick={() => this.visitPage("myTeam")}>
                                <p class="status-count text-dark-yellow">{('0' + teamTask).slice(-2)}</p>
                                <p class="status-label">My Team</p>
                                <p class="status-sublabel">for {(typeof StatusCount.team != "undefined") ? (StatusCount.team).length : '0'} Projects</p>
                                <p class="status-sublabel text-red">{(typeof StatusCount.team != "undefined") ? (teamIssues > 0) ? teamIssues : 'No' : 'No'} delayed tasks</p>
                            </a>
                        </div>
                        <div class="col-lg-4 text-center">
                            <a onClick={() => this.visitPage("following")}>
                                <p class="status-count text-dark-yellow">{('0' + followingTasks).slice(-2)}</p>
                                <p class="status-label">Task followed</p>
                                <p class="status-sublabel">for {(typeof StatusCount.following != "undefined") ? (StatusCount.following).length : '0'} Projects</p>
                                <p class="status-sublabel text-red">{(typeof StatusCount.following != "undefined") ? (followingIssues > 0) ? followingIssues : 'No' : 'No'} delayed tasks</p>
                            </a>
                        </div>
                    </div>
                }
            </div>
        );
    }
}