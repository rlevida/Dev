import React from "react"
import Dropzone from 'react-dropzone';
import { DropDown } from "../../../../globalComponents";
import { showToast, setDatePicker, displayDate } from '../../../../globalFunction'
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        checklist: store.checklist,
        global: store.global
    }
})
export default class ModalComponent extends React.Component {
    constructor(props) {
        super(props)

    }

    componentDidMount(){
        $(".form-container").validator();
    }

    handleSubmit(){
        let { dispatch , socket , task , loggedUser } = this.props;
        let dataToBeSubmit = {
            id : task.Selected.id,
            status : null,
            approverId : null,
            approvalDueDate : null ,
            action : "Reject Task"
        }
        let rejectedDetails = {
            taskId : task.Selected.id,
            workstreamId : task.Selected.workstreamId,
            projectId : project,
            approvalDueDate : task.Selected.approvalDueDate,
            approverId : task.Selected.approverId,
            message : task.Selected.rejectMessage
        }

        let reminderDetails = {
            workstreamId : task.Selected.workstreamId,
            projectId : project,
            reminderDetail : task.Selected.rejectMessage,
            seen : 0,
            linkType : "task",
            linkId : task.Selected.id,
            type: "Task Rejected",
            usersId : task.Selected.assignedById,
            createdBy : loggedUser.data.id
        }
        socket.emit("SAVE_OR_UPDATE_TASK", { data: dataToBeSubmit , rejectedData : rejectedDetails , reminder : reminderDetails})
        $(`#rejectMessageModal`).modal("hide");
       
    }

    closeModal(){
        $(`#rejectMessageModal`).modal("hide");
    }

    render() {
        let { task, dispatch } = this.props 

        return (
            <div class="modal fade" id="rejectMessageModal" tabIndex="-1" role="dialog" aria-labelledby="rejectMessageModal" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="rejectMessageModalLabel">Reject Message</h5>
                            </div>
                        <div class="modal-body ">
                            <div class="container-fluid">
                                <form class="form-container">                                
                                    <div class="form-group">
                                        <div class="col-md-12 col-xs-12">
                                           <textarea 
                                                class="form-control" 
                                                rows="6" 
                                                value={ typeof task.Selected.rejectMessage != "undefined" ? task.Selected.rejectMessage : "" }
                                                onChange={(e)=> dispatch({type : "SET_TASK_SELECTED" , Selected : { ...task.Selected , rejectMessage : e.target.value }})}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onClick={()=>this.closeModal()}>Close</button>
                            <button type="button" class="btn btn-primary" onClick={ () => this.handleSubmit() }>Submit</button>
                        </div>
                        </div>
                    </div>
                </div>
        )
    }
}