import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import moment from 'moment'
import TaskStatus from "./taskStatus"

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
        this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST",{});
        this.props.socket.emit("GET_TEAM_LIST",{});
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "ProjectMemberList" , filter : { linkId : project, linkType: "project" } })
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
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_TASK_FORM_ACTIVE", FormActive: "Form" })} >
                    <span>New Task</span>
                </li>
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th style={{textAlign:"center"}}>Workstream</th>
                        <th style={{textAlign:"center"}}>Task Name</th>
                        <th style={{textAlign:"center"}}>Due Date</th>
                        <th style={{textAlign:"center"}}>Assigned</th>
                        <th style={{textAlign:"center"}}>Followed By</th>
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
                           let taskStatus = 0;
                            if(new Date().getTime() > new Date( data.dueDate ).getTime()){
                                taskStatus = 2 
                            }else if(new Date() == new Date( data.dueDate )){
                                taskStatus = 1
                            }

                            return <tr key={index}>
                                <td>
                                    { (taskStatus == 0) && <span class="fa fa-circle fa-lg" style={{color:"#27ae60"}}></span> }
                                    { (taskStatus == 1) && <span class="fa fa-circle fa-lg" style={{color:"#f39c12"}}></span> }
                                    { (taskStatus == 2) && <span class="fa fa-circle fa-lg" style={{color:"#c0392b"}}></span> }
                                </td>
                                <td>{data.workstream_workstream}</td>
                                <td>{data.task}</td>
                                <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                <td>{(data.assignedById)?<span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span>:""}</td>
                                <td>
                                    {( data.followersName != null) &&
                                        <div>
                                            <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                            <Tooltip id={`follower${index}`}>
                                                        {data.followersName.split(",").map( e =>{ 
                                                            return <p>{ e != null ? e : "" } <br/></p>
                                                    })}
                                            </Tooltip>
                                        </div>
                                    }
                                </td>
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