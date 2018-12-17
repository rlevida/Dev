import React from "react"
import { showToast, putData } from '../../../../globalFunction'
import { connect } from "react-redux"
@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
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
        let { dispatch, task, loggedUser } = this.props;

        putData(`/api/task/status/${task.Selected.id}`,
            {
                userId: loggedUser.data.id,
                username: loggedUser.data.username,
                periodTask: task.Selected.periodTask,
                periodic: task.Selected.periodic,
                id: task.Selected.id,
                status: "Rejected",
                message: task.Selected.rejectMessage,
                approvalDueDate: null
            }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
                    dispatch({ type: "SET_TASK_SELECTED", Selected: c.data.task[0] });
                    dispatch({ type: "ADD_ACTIVITYLOG", activity_log: c.data.activity_log });
                    showToast("success", "Task successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
                dispatch({ type: "SET_TASK_LOADING", Loading: "" });
            });

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