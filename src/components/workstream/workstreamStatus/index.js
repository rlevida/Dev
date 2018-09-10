import React from "react"
import ReactDOM from "react-dom"
import Tooltip from "react-tooltip";
import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        task : store.task
    }
})

export default class WorkstreamStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            status : 'isActive',
            list : []
        }
    }

    componentWillMount() {
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_WORKSTREAM_COUNT_LIST",{filter:{projectId:project}})
    }

    showModal(status){
        let { workstream , task } = this.props;
        let issueList = []
        if(status == "Issues"){
            task.List.map( e =>{
                if(new Date().getTime() > new Date( e.dueDate ).getTime() && e.status != "Completed" && moment(new Date().getTime()).format('L') != moment( e.dueDate ).format('L')){
                    issueList.push(e)
                }
            })
            this.setState({ list:issueList , status : status },()=>{
                $('#workstreamStatusModal').modal("show");
            })
        }else{
            this.setState({list: task.List})
        }

    }

    render() {
        let { workstream , loggedUser } = this.props , { status } = this.state;
        let data = { Active : 0, OnTrack: 0, Issues: 0}
        
        this.props.workstream.CountList.map((e,i)=>{
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
                                            <th style={{textAlign:"center"}}>Workstream</th>
                                            <th style={{textAlign:"center"}}>Task</th>
                                            <th style={{textAlign:"center"}}>Due date</th>
                                            <th style={{textAlign:"center"}}>Assignees</th>
                                         
                                            <th></th>
                                        </tr>
                                        { this.state.list.length > 0 && 
                                            this.state.list.map( (data,index) => { 
                                               return (
                                                <tr key={index}>
                                                    <td>{data.workstream_workstream}</td>
                                                    <td>{data.task}</td>
                                                    <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                                    <td>{(data.assignedBy !=  null) ? data.assignedBy : ''}</td>
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