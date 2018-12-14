import React from "react"
import { connect } from "react-redux"
import { showToast, putData , deleteData } from "../../../globalFunction";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props) 
    }

    deleteProject(){
        let { project, dispatch } = this.props;

        deleteData(`/api/project/${project.Selected.id}`, {id: project.Selected.id},(c) => {
            if(c.status == 200){
                dispatch({ type: "REMOVE_DELETED_PROJECT_LIST" , id : c.data })
                showToast("success","Successfully Deleted.")
            }
            $(`#archiveModal`).modal("hide");
        })
    }

    archiveProject(){
        let { dispatch , project } = this.props;
        let dataToSubmit = { isDeleted : 1}
        
        putData(`/api/project/archive/${project.Selected.id}`, dataToSubmit, (c) => {
            if(c.status == 200){
                dispatch({ type: "UPDATE_DATA_PROJECT_LIST", UpdatedData: c.data })
            }
            $(`#archiveModal`).modal("hide");
        })
    }

    render() {
        return (
            <div class="modal fade" id="archiveModal" tabIndex="-1" role="dialog" aria-labelledby="archiveModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                            <h4>Delete / Archive a Project</h4>
                            </div>
                        <div class="modal-body">
                        <div class="form-group text-center">
                            <button class="btn btn-danger" onClick={()=> this.deleteProject()}>Delete the project permanently</button>
                            <button class="btn btn-danger" onClick={()=> this.archiveProject()}>Archive the project for one year</button>
                        </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                        </div>
                    </div>
                </div>
        )
    }
}