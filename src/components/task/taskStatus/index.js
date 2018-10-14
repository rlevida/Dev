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

    componentWillMount() {
        let { socket , loggedUser } = this.props;
        let intervalLoggedUser = setInterval(() => {
            if (typeof this.props.loggedUser.data.id != "undefined") {
                if( this.props.loggedUser.data.userRole == 1 || this.props.loggedUser.data.userRole == 2 ){
                    this.props.socket.emit("GET_TASK_COUNT_LIST", { filter : { projectId : project }})
                }else{ 
                    let filter = { filter: { userId: this.props.loggedUser.data.id } }
                    this.props.socket.emit("GET_ALL_TASK_COUNT_LIST", filter)
                }
                clearInterval(intervalLoggedUser)
            }
        }, 1000)
    }

    render() {
        let { task } = this.props;
        let data = { Active: 0, OnTrack: 0, Issues: 0 }
            // if(typeof this.props.loggedUser.data.id != "undefined"){
            //     if( this.props.loggedUser.data.userRole == 1 || this.props.loggedUser.data.userRole == 2){
            //         this.props.task.CountList.map((e, i) => {
            //             data = {
            //                 Active: (typeof e.Active != "undefined" && e.Active) ? e.Active : 0,
            //                 OnTrack: (typeof e.OnTrack != "undefined" && e.OnTrack) ? e.OnTrack : 0,
            //                 Issues: (typeof e.Issues != "undefined" && e.Issues) ? e.Issues : 0
            //             }
            //         })
            //     }else{
            //         this.props.task.AllCountList.map((e, i) => {
            //             data = {
            //                 Active: (typeof e.Active != "undefined" && e.Active) ? e.Active : 0,
            //                 OnTrack: (typeof e.OnTrack != "undefined" && e.OnTrack) ? e.OnTrack : 0,
            //                 Issues: (typeof e.Issues != "undefined" && e.Issues) ? e.Issues : 0
            //             }
            //         })
            //     }
            // }

            task.List.map((e,index)=>{
                data.Active += 1;
                let dueDate = moment(e.dueDate)
                let currentDate = moment(new Date())

                if(dueDate.diff(currentDate,'days') == 0 && e.currentState != "Completed"){
                    data.DueToday += 1;
                }else if(dueDate.diff(currentDate,'days') < 0  && e.currentState != "Completed"){
                    data.Issues += 1;
                }
            })

        return <div style={this.props.style}>
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left", color: "white" }}>Active</span><span style={{ float: "right", color: "white" }}>{(data.Active - data.Issues) + data.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left", color: "white" }}>On Time</span><span style={{ float: "right", color: "white" }}>{data.Active - data.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#d4a2a2", color: "white", cursor: "pointer" }} onClick={() => this.showModal("Issues")}>
                            <span style={{ float: "left", color: "white" }}>Issues</span><span style={{ float: "right", color: "white" }}>{data.Issues > 0 && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}{data.Issues}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    }
}