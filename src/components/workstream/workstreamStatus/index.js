import React from "react"
import _ from "lodash";
import { connect } from "react-redux";
import { getData } from '../../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        task: store.task
    }
})

export default class WorkstreamStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            status: 'isActive',
            list: []
        }
    }

    componentDidMount() {
        const { loggedUser, dispatch } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.user_role, (roleObj) => { return roleObj.roleId })[0];

        getData(`/api/workstream/status?projectId=${project}&userId=${loggedUser.data.id}&role=${userRoles}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_WORKSTREAM_STATUS_COUNT", count: c.data })
        });
    }

    showModal(status) {
        getData(`/api/task?projectId=${project}&dueDate=${JSON.stringify({ opt: "lt", value: moment(new Date()).format("YYYY-MM-DD") })}&status=${JSON.stringify({ opt: "not", value: "Completed" })}`, {}, (c) => {
            this.setState({ list: c.data.result }, () => {
                $('#workstreamStatusModal').modal("show");
            });
        });
    }

    render() {
        const { workstream } = this.props;
        const { StatusCount } = workstream;

        return <div class="container-fluid">
            {
                (_.isEmpty(StatusCount) == false) &&
                <div class="row">
                    <div class="col-lg-4 col-xs-12 active-count count">
                        <span class="text-white">{(StatusCount.active - StatusCount.issues) + StatusCount.issues}</span>
                        <span class="text-white">Active Workstreams:</span>
                    </div>
                    <div class="col-lg-4 col-xs-12 on-time count">
                        <span class="text-white">{StatusCount.active - StatusCount.issues}</span>
                        <span class="text-white">Workstreams On Time:</span>
                    </div>
                    <div class="col-lg-4 col-xs-12 issues count"
                        onClick={() => this.showModal("Issues")}
                        style={{ cursor: "pointer" }}
                    >
                        <span class="text-white">
                            {(StatusCount.issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                            {StatusCount.issues}
                        </span>
                        <span class="text-white">Workstreams With Issues:</span>
                    </div>
                </div>
            }
            <div class="modal fade" id="workstreamStatusModal" tabIndex="-1" role="dialog" aria-labelledby="workstreamStatusModal" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal">&times;</button>
                            <h4 class="modal-title">Issues</h4>
                        </div>
                        <div class="modal-body">
                            <table id="dataTable" class="table responsive-table">
                                <tbody>
                                    <tr>
                                        <th class="text-left">Workstream</th>
                                        <th class="text-left">Task</th>
                                        <th style={{ textAlign: "center" }}>Due date</th>
                                        <th style={{ textAlign: "center" }}>Assignees</th>
                                    </tr>
                                    {this.state.list.length > 0 &&
                                        this.state.list.map((data, index) => {
                                            const assignedUser = (_.filter(data.task_members, (o) => { return o.memberType == "assignedTo" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "assignedTo" })[0].user : "";

                                            return (
                                                <tr key={index}>
                                                    <td class="text-left">{data.workstream.workstream}</td>
                                                    <td class="text-left">{data.task}</td>
                                                    <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                                    <td>
                                                        {
                                                            (assignedUser != "" && assignedUser != null) && <span title={`${assignedUser.firstName} ${assignedUser.lastName}`}><i class="fa fa-user fa-lg"></i></span>
                                                        }
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    }
}