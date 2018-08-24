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
        let taskListInterval = setInterval(()=>{
            if(this.props.workstream.Selected.id){
                this.props.socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: this.props.workstream.Selected.id  } });
                clearInterval(taskListInterval)
            }
        },1000)
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

    followTask(){
       let { socket , loggedUser } = this.props;
       let { SelectedTask } = this.state;
       socket.emit("SAVE_OR_UPDATE_MEMBERS",{ data : { usersType : "users" , userTypeLinkId : loggedUser.data.id , linkType : "task" , linkId : SelectedTask.id , memberType : "Follower" }})
    }

    unFollowTask(id){
        let { socket , loggedUser } = this.props;
        let { SelectedTask } = this.state;
        socket.emit("DELETE_MEMBERS",{ id : id })
     }

    render() {
        let { task, dispatch, socket , global , loggedUser } = this.props;
        return <div>
            <div class="row">
                <div class={ typeof task.Selected.id != "undefined" ? "col-lg-6 col-md-6" : "col-lg-12 col-md-12"}>
                    <h3>&nbsp;&nbsp;&nbsp;&nbsp;Task</h3>
                    <table id="dataTable" class="table responsive-table">
                        <tbody>
                            <tr>
                                <th></th>
                                <th style={{textAlign:"center"}}>Description</th>
                                <th style={{textAlign:"center"}}>Due Date</th>
                                <th style={{textAlign:"center"}}>Assignee</th>
                                <th style={{textAlign:"center"}}>Status</th>
                                <th style={{textAlign:"center"}}>Follower</th>
                            </tr>
                            {
                                (task.List.length == 0) &&
                                <tr>
                                    <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                                </tr>
                            }
                            {
                                task.List.map((data, index) => {
                                    return <tr key={index} style={{cursor:"pointer"}} onClick={()=>  socket.emit("GET_TASK_DETAIL", { id: data.id }) }>
                                        <td><span class={(data.currentState=="Completed")?"glyphicon glyphicon-ok-circle":(data.currentState=="Incomplete")?"glyphicon glyphicon-question-sign":"fa fa-circle"}></span></td>
                                        <td>{data.task}</td>
                                        <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td>{(data.assignedById)?<span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span>:""}</td>
                                        <td>{data.status}</td>
                                        <td>
                                            <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                             <Tooltip id={`follower${index}`}>
                                                <ul style={{listItemStyle:"none", marginLeft:"0px;", paddingLeft:"0px;"}} >
                                                    {( data.followersName != null) && data.followersName.split(",").map( e =>{ return <li>{e}</li>})}
                                                </ul>
                                             </Tooltip>
                                        </td>
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </div>
                {(typeof task.Selected.id != "undefined") && 
                    <div class="col-lg-6 col-md-6">
                        <span class="pull-right" style={{cursor:"pointer"}} onClick={()=> dispatch({ type: "SET_TASK_SELECTED", Selected : {}})}><i class="fa fa-times-circle fa-lg"></i></span>
                        <div class="form-group text-center" >
                                <a href="javascript:void(0);" class="btn btn-primary" style={{margin:"30px"}}>Mark Task as Completed</a>
                                { (task.Selected.followersName != null && task.Selected.followersIds.split(",").filter( e => {return e == loggedUser.data.id}).length > 0 ) 
                                        ? <a href="javascript:void(0);" class="btn btn-primary" style={{margin:"30px"}} onClick={()=> this.unFollowTask( loggedUser.data.id )}>Unfollow Task</a>
                                            :<a href="javascript:void(0);" class="btn btn-primary" style={{margin:"30px"}} onClick={()=> this.followTask()}>Follow Task</a>
                                }
                        </div>
                    </div>
                }
            </div>
        </div>
    }
}