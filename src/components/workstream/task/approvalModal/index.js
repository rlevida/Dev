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
export default class ApprovalModal extends React.Component {
    constructor(props) {
        super(props)

        this.handleDate = this.handleDate.bind(this)
    }

    componentDidMount(){
        $(".form-container").validator();
        setDatePicker(this.handleDate, "approvalDueDate");
    }

    handleDate(e) {
        let { dispatch, task } = this.props;
            dispatch({ type: "SET_TASK_SELECTED", Selected:{ ...task.Selected , [e.target.name] : e.target.value } });
    }

    setDropDown(name , value){
        let { dispatch , task } = this.props;
            dispatch({type:"SET_TASK_SELECTED" , Selected : { ...task.Selected, [name] :value }  })
    }

    handleSubmit(){
        let { dispatch , socket , task } = this.props;
        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
        } else {
            let dataToSubmit =  { 
                id: task.Selected.id , status : "For Approval" , 
                approverId : task.Selected.approverId  ,
                approvalDueDate : task.Selected.approvalDueDate,
                action : "For Approval"
            }
            socket.emit("SAVE_OR_UPDATE_TASK" , { data : dataToSubmit })
            $(`#approvalModal`).modal(`hide`);
        }
    }

    closeModal(){
        $(`#approvalModal`).modal("hide");
    }

    render() {
        let { socket, task, project, dispatch , workstream , global} = this.props 
        let approverOptions = []
        if(typeof global.SelectList.workstreamMemberList != "undefined"){
           global.SelectList.workstreamMemberList.map( e =>{ 
               if(e.roleId == 1 || e.roleId == 2 || e.roleId == 3 || e.roleId == 5 ){
                    approverOptions.push({ id : e.id , name: `${e.firstName} ${e.lastName}`})
               }
            })
        }

        return (
            <div class="modal fade" id="approvalModal" tabIndex="-1" role="dialog" aria-labelledby="approvalModal" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="approvalModalLalbel">Approval Modal</h5>
                            </div>
                        <div class="modal-body ">
                            <div class="container-fluid">
                                <form class="form-container">                                
                                    <div class="form-group">
                                        <label class="col-md-2 col-xs-12 control-label">Approver :</label>
                                        <div class="col-md-10 col-xs-12">
                                            <DropDown multiple={false}
                                                required={true}
                                                options={approverOptions}
                                                selected={(typeof task.Selected.approverId == "undefined") ? "" : task.Selected.approverId}
                                                onChange={(e) => this.setDropDown("approverId", e.value )}
                                                />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="col-md-2 col-xs-12 control-label">Due Date *</label>
                                        <div class="col-md-10 col-xs-12">
                                            <div class="input-group date">
                                                <input type="text"
                                                    class="form-control datepicker"
                                                    style={{ backgroundColor: "#eee" }}
                                                    id="approvalDueDate"
                                                    name="approvalDueDate"
                                                    value={ task.Selected.approvalDueDate != null && task.Selected.approvalDueDate != ""  ? displayDate(task.Selected.approvalDueDate) : "" }
                                                    onChange={() => { }}
                                                    required={true}
                                                />
                                                <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                                </span>
                                            </div>
                                        </div>
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onClick={()=>this.closeModal()}>Close</button>
                            <button type="button" class="btn btn-primary" onClick={ () => this.handleSubmit() }>Save</button>
                        </div>
                        </div>
                    </div>
                </div>
        )
    }
}