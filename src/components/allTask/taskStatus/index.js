import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
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
        this.state = {

        }
    }

    // componentWillMount() {
    //     let intervalLoggedUser = setInterval(() => {
    //         if (typeof this.props.loggedUser.data.id != "undefined") {
    //             let filter = { filter: { userId: this.props.loggedUser.data.id } }
    //             this.props.socket.emit("GET_ALL_TASK_COUNT_LIST", filter)
    //             clearInterval(intervalLoggedUser)
    //         }
    //     }, 1000)
    // }

    render() {
        let { task , loggedUser } = this.props;
        let data = {
            assignedTo: { Active: 0, DueToday: 0, Issues: 0 },
            responsible: { Active: 0, DueToday: 0, Issues: 0 },
            Follower: { Active: 0, DueToday: 0, Issues: 0 }
        }
        if(task.List.length){
            let userId = loggedUser.data.id;
            task.List.map((e,index)=>{
                if (e.assignedById == userId ){
                    data.assignedTo.Active += 1;
                    if(moment(e.dueDate).format('L') == moment().format('L')){
                        data.assignedTo.DueToday += 1;
                    }else if(moment(e.dueDate).format('LLL') > moment().format('LLL') ){
                        data.assignedTo.Issues += 1;
                    }
                }
                if ( e.followersIds != null && e.followersIds.split(",").includes(`${userId}`)){
                    data.Follower.Active += 1;
                    if(moment(e.dueDate).format('L') == moment().format('L')){
                        data.Follower.DueToday += 1;
                    }else if(moment(e.dueDate).format('LLL') > moment().format('LLL') ){
                        data.Follower.Issues += 1;
                    }
                }
                if ( e.responsible_id == userId ){
                    data.responsible.Active += 1;
                    if(moment(e.dueDate).format('L') == moment().format('L')){
                        data.responsible.DueToday += 1;
                    }else if(moment(e.dueDate).format('LLL') > moment().format('LLL') ){
                        data.responsible.Issues += 1;
                    }
                }
            })
        }
        
        // this.props.task.AllCountList.map((e, i) => {
        //     data[e.memberType] = {
        //         Active: (typeof e.Active != "undefined") ? e.Active : 0,
        //         DueToday: (typeof e.DueToday != "undefined") ? e.DueToday : 0,
        //         Issues: (typeof e.Issues != "undefined") ? e.Issues : 0
        //     }
        // })

        return <div style={this.props.style}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Assigned</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.assignedTo.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.assignedTo.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.assignedTo.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Responsible</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.responsible.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.responsible.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.responsible.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Following</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{data.Follower.Active}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Due Today</span><span style={{ float: "right" }}>{data.Follower.DueToday}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.Follower.Issues}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    }
}