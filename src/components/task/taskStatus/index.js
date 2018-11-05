import React from "react";
import { connect } from "react-redux";
import moment from "moment";
import _ from "lodash";

import { getData } from '../../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        loggedUser: store.loggedUser
    }
})

export default class TaskStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.user_role, (roleObj) => { return roleObj.roleId })[0];

        getData(`/api/task/taskStatus?projectId=${project}&userId=${loggedUser.data.id}&type=myTask&date=${moment(new Date()).format("YYYY-MM-DD")}&role=${userRoles}`, {}, (c) => {
            dispatch({ type: "SET_STATUS_TASK_COUNT_LIST", count: c.data });
        });
    }

    render() {
        const { task } = this.props;
        const { StatusCount } = task;

        return <div style={this.props.style}>
            <table>
                <tbody>
                    {
                        (_.isEmpty(StatusCount) == false) && <tr>
                            <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                                <span style={{ float: "left", color: "white" }}>Active</span><span style={{ float: "right", color: "white" }}>{(StatusCount.assigned_active - StatusCount.assigned_issues) + StatusCount.assigned_issues}</span>
                            </td>
                            <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                                <span style={{ float: "left", color: "white" }}>On Time</span><span style={{ float: "right", color: "white" }}>{StatusCount.assigned_active - StatusCount.assigned_issues}</span>
                            </td>
                            <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#d4a2a2", color: "white" }} onClick={() => this.showModal("Issues")}>
                                <span style={{ float: "left", color: "white" }}>Issues</span><span style={{ float: "right", color: "white" }}>{StatusCount.assigned_issues > 0 && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}{StatusCount.assigned_issues}</span>
                            </td>
                        </tr>
                    }
                </tbody>
            </table>
        </div>
    }
}