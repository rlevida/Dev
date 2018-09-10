import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
    }
})

export default class TaskStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    componentWillMount() {
        this.props.socket.emit("GET_TASK_COUNT_LIST",{filter:{projectId:project}})
    }

    render() {
        let data = { Active : 0, OnTrack: 0, Issues: 0}
        
        this.props.task.CountList.map((e,i)=>{
            data = { Active : (typeof e.Active != "undefined" && e.Active)?e.Active:0, 
                            OnTrack: (typeof e.OnTrack != "undefined" && e.OnTrack)?e.OnTrack:0, 
                            Issues: (typeof e.Issues != "undefined" && e.Issues)?e.Issues:0}
        })

        return <div style={this.props.style}>
                <table>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                           <span style={{float:"left",color:"white"}}>Active</span><span style={{float:"right",color:"white"}}>{(data.Active - data.Issues) + data.Issues}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left",color:"white"}}>On Time</span><span style={{float:"right",color:"white"}}>{data.Active - data.Issues}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#d4a2a2",color:"white",cursor:"pointer"}} onClick={()=>this.showModal("Issues")}>
                            <span style={{float:"left",color:"white"}}>Issues</span><span style={{float:"right",color:"white"}}>{ data.Issues > 0 && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{marginRight:"5px"}}></i>}{data.Issues}</span>
                        </td>
                    </tr>
                </table>
            </div>
    }
}