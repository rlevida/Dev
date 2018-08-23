import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment'
import TaskStatus from './taskStatus'

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
        
        let intervalLoggedUser = setInterval(()=>{
            if(typeof this.props.loggedUser.data.id != "undefined"){
                let filter = {}
                if(this.props.loggedUser.data.userRole != "1" && this.props.loggedUser.data.userRole != "2"){
                    filter = {filter:{ id: {name: "id", value: this.props.loggedUser.data.taskIds, condition: " IN "}}}
                }
                this.props.socket.emit("GET_TASK_LIST",filter);
                clearInterval(intervalLoggedUser)
            }
        },1000)

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
            <TaskStatus style={{float:"right",padding:"20px"}} />
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th style={{textAlign:"center"}}>Project</th>
                        <th style={{textAlign:"center"}}>Workstream</th>
                        <th style={{textAlign:"center"}}>Task Name</th>
                        <th style={{textAlign:"center"}}>Due Date</th>
                        <th style={{textAlign:"center"}}>Assigned to</th>
                        <th style={{textAlign:"center"}}></th>
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