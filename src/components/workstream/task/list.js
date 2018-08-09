import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: this.props.workstream.Selected.id  } });
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST",{});
        this.props.socket.emit("GET_TEAM_LIST",{});
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_TASK_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_TASK", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_TASK", { id: id })
        }
    }

    render() {
        let { task, dispatch, socket } = this.props;
        
        return <div>
            <h3>&nbsp;&nbsp;&nbsp;&nbsp;Task</h3>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th style={{textAlign:"center"}}>Description</th>
                        <th style={{textAlign:"center"}}>Due Date</th>
                        <th style={{textAlign:"center"}}>Assignee</th>
                        <th style={{textAlign:"center"}}>Status</th>
                        <th style={{textAlign:"center"}}>Foloower</th>
                    </tr>
                    {
                        (task.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        task.List.map((data, index) => {
                            return <tr key={index}>
                                <td></td>
                                <td>{data.task}</td>
                                <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                <td></td>
                                <td>{data.status_status}</td>
                                <td></td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}