import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../../globalComponents";
import moment from 'moment'
import Form from "./form"
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

    // followTask(){
    //    let { dispatch , socket , loggedUser ,task , workstream } = this.props;
    //     socket.emit("SAVE_OR_UPDATE_MEMBERS",{ data : { usersType : "users" , userTypeLinkId : loggedUser.data.id , linkType : "task" , linkId : task.Selected.id , memberType : "Follower" , test : "test"} , types : "workstream"})
    //     socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: workstream.Selected.id  } });
    //     dispatch({ type: "SET_TASK_SELECTED", Selected : {}})
    // }

    // unFollowTask(id){
    //     let { dispatch , socket , loggedUser ,task , workstream } = this.props;
    //         socket.emit("DELETE_MEMBERS", { filter : {userTypeLinkId : loggedUser.data.id , linkId : task.Selected.id , memberType : "Follower"} ,  types : "workstream" })
    //         socket.emit("GET_TASK_LIST", { filter: { projectId: project, workstreamId: workstream.Selected.id  } });
    //         dispatch({ type: "SET_TASK_SELECTED", Selected : {}})
    //  }

    selectedTask(data){
        let{ socket , dispatch  } = this.props;
            dispatch({type:"SET_TASK_SELECTED" , Selected : data })
            // dispatch({ type: "SET_WORKSTREAM_SELECTED_LINK", SelectedLink: "task"})
            // socket.emit("GET_TASK_DETAIL", { id: id })
    }


    render() {
        let { task, dispatch, socket , global , loggedUser } = this.props;
        return <div>
            <div class="row">
                <div class={typeof task.Selected.id == "undefined" ? "col-lg-12 col-md-12" : "col-lg-6 col-md-6" }>
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
                                    return <tr key={index} style={{cursor:"pointer"}} onClick={()=> this.selectedTask(data) }>
                                        <td><span class={(data.currentState=="Completed")?"glyphicon glyphicon-ok-circle":(data.currentState=="Incomplete")?"glyphicon glyphicon-question-sign":"fa fa-circle"}></span></td>
                                        <td>{data.task}</td>
                                        <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                        <td>{(data.assignedById)?<span title={data.assignedBy}><i class="fa fa-user fa-lg"></i></span>:""}</td>
                                        <td>{data.status}</td>
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
                                    </tr>
                                })
                            }
                        </tbody>
                    </table>
                </div>
                
                {(typeof task.Selected.id != "undefined") && 
                    <div class="col-lg-6 col-md-6" style={{borderLeft: "solid #000000"}}>
                        <Form />
                    </div>
                }
            </div>
        </div>
    }
}