import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
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
        this.props.socket.emit("GET_TASK_LIST", { filter: { } });
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { } });
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
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })} >
                    <span>New Task</span>
                </li>
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th>Project</th>
                        <th>Workstream</th>
                        <th>Task Name</th>
                        <th>Due Date</th>
                        <th>Assigned to</th>
                        <th></th>
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
                                <td>{data.status_status}</td>
                                <td>{data.project_project}</td>
                                <td>{data.workstream_workstream}</td>
                                <td>{data.task}</td>
                                <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                <td></td>
                                <td></td>
                                <td></td>
                                <td>{data.type_type}</td>
                                <td></td>
                                <td class="text-center">
                                    <a href="javascript:void(0);" data-tip="EDIT"
                                        onClick={(e) => socket.emit("GET_TASK_DETAIL", { id: data.id })}
                                        class="btn btn-info btn-sm">
                                        <span class="glyphicon glyphicon-pencil"></span></a>
                                    <a href="javascript:void(0);" data-tip="DELETE"
                                        onClick={e => this.deleteData(data.id)}
                                        class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                        <span class="glyphicon glyphicon-trash"></span></a>
                                    <Tooltip />
                                </td>
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}