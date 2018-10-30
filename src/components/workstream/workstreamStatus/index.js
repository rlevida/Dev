import React from "react"
import { getData } from '../../../globalFunction'

import { connect } from "react-redux"
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
        const userRoles = _.map(data.role, (roleObj) => { return roleObj.roleId })[0];

        getData(`/api/workstream/status?projectId=${project}&userId=${loggedUser.data.id}&role=${userRoles}&date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            dispatch({ type: "SET_WORKSTREAM_COUNT_LIST", list: c.data })
        });
    }

    showModal(status) {
        const { loggedUser } = this.props;
        const { data } = loggedUser;
        const userRoles = _.map(data.role, (roleObj) => { return roleObj.roleId })[0];

        getData(`/api/task?projectId=${project}&userId=${loggedUser.data.id}&role=${userRoles}&date=${JSON.stringify({ opt: "lt", value: moment(new Date()).format("YYYY-MM-DD") })}`, {}, (c) => {
            this.setState({ list: c.data.result }, () => {
                $('#workstreamStatusModal').modal("show");
            });
        });
    }

    render() {
        const { workstream } = this.props;
        const { StatusCount } = workstream;

        return <div style={this.props.style}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left", color: "white" }}>Active</span><span style={{ float: "right", color: "white" }}>{(StatusCount.active - StatusCount.issues) + StatusCount.issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left", color: "white" }}>On Time</span><span style={{ float: "right", color: "white" }}>{StatusCount.active - StatusCount.issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#d4a2a2", color: "white", cursor: "pointer" }} onClick={() => this.showModal("Issues")}>
                            <span style={{ float: "left", color: "white" }}>Issues</span><span style={{ float: "right", color: "white" }}>{StatusCount.issues > 0 && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}{StatusCount.issues}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="modal fade" id="workstreamStatusModal" tabIndex="-1" role="dialog" aria-labelledby="workstreamStatusModal" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="workstreamStatusModalLabel">Issues</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <table id="dataTable" class="table responsive-table">
                                <tbody>
                                    <tr>
                                        <th style={{ textAlign: "center" }}>Workstream</th>
                                        <th style={{ textAlign: "center" }}>Task</th>
                                        <th style={{ textAlign: "center" }}>Due date</th>
                                        <th style={{ textAlign: "center" }}>Assignees</th>

                                        <th></th>
                                    </tr>
                                    {this.state.list.length > 0 &&
                                        this.state.list.map((data, index) => {
                                            const assignedUser = (_.filter(data.task_members, (o) => { return o.memberType == "assignedTo" }).length > 0) ? _.filter(data.task_members, (o) => { return o.memberType == "assignedTo" })[0].user : "";

                                            return (
                                                <tr key={index}>
                                                    <td>{data.workstream.workstream}</td>
                                                    <td>{data.task}</td>
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