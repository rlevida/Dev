import React from "react"
import Dropzone from 'react-dropzone';
import { DropDown } from "../../../../globalComponents";
import { showToast, putData } from '../../../../globalFunction'
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

    componentDidMount() {
        $(".form-container").validator();
    }

    handleSubmit() {
        let { dispatch, task, loggedUser, global, workstream } = this.props;

        let dataToSubmit = {
            id: task.Selected.id,
            status: null,
            approverId: task.Selected.approverId,
            approvalDueDate: null
        }

        let assignee = global.SelectList.projectMemberList.filter(e => { return e.id == task.Selected.assignedTo })[0]

        let reminderDetails = {
            workstreamId: task.Selected.workstreamId,
            projectId: task.Selected.projectId,
            reminderDetail: task.Selected.rejectMessage,
            seen: 0,
            linkType: "task",
            linkId: task.Selected.id,
            type: "Task Rejected",
            usersId: assignee.id,
            createdBy: loggedUser.data.id
        }

        let mailDetails = {
            workstreamId: workstream.Selected.id,
            taskId: task.Selected.id,
            task: task.Selected.task,
            receiveNotification: assignee.receiveNotification,
            emailAddress: assignee.emailAddress,
            project: project
        }

        putData(`/api/task/taskReject/${task.Selected.id}`, { data: dataToSubmit, reminder: reminderDetails, mailDetails: mailDetails }, (c) => {
            dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task })
            dispatch({ type: "SET_TASK_SELECTED", Selected: c.data.task[0] })
            showToast("success", "Sucessfully Updated.")
        })

        $(`#rejectMessageModal`).modal("hide");
    }

    closeModal() {
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
                                                value={typeof task.Selected.rejectMessage != "undefined" ? task.Selected.rejectMessage : ""}
                                                onChange={(e) => dispatch({ type: "SET_TASK_SELECTED", Selected: { ...task.Selected, rejectMessage: e.target.value } })}
                                            />
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onClick={() => this.closeModal()}>Close</button>
                            <button type="button" class="btn btn-primary" onClick={() => this.handleSubmit()}>Submit</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}