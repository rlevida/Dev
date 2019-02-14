import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { showToast, putData, deleteData } from "../../../globalFunction";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "deleteProject",
            "archiveProject"
        ], (fn)=>{
            this[fn] = this[fn].bind(this);
        });
    }

    deleteProject() {
        let { project, dispatch } = this.props;

        deleteData(`/api/project/${project.Selected.id}`, { id: project.Selected.id }, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DELETED_PROJECT_LIST", id: c.data })
                showToast("success", "Successfully Deleted.");
            }
            $(`#archiveModal`).modal("hide");
        })
    }

    archiveProject() {
        let { dispatch, project } = this.props;
        let dataToSubmit = { isDeleted: 1 }

        putData(`/api/project/archive/${project.Selected.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DELETED_PROJECT_LIST", id: c.data });
                showToast("success", "Successfully Archived.");
            }
            $(`#archiveModal`).modal("hide");
        })
    }

    render() {
        const { project } = { ...this.props };
        const { Selected } = project;

        return (
            <div class="modal fade" id="archiveModal">
                <div class="modal-dialog modal-md" role="document">
                    <div class="modal-content">
                        <div class="modal-body">
                            <i class="fa fa-exclamation-circle" aria-hidden="true"></i>
                            <p class="warning text-center">Delete or Archive this project?</p>
                            <p class="warning text-center"><strong>{Selected.project}</strong></p>
                            <div class="flex-row mt20" id="delete-action">
                                <div class="flex-col">
                                    <div class="dropdown">
                                        <button class="btn btn-danger dropdown-toggle" type="button" data-toggle="dropdown">
                                            Yes Delete / Archive project!
                                            <span class="caret ml10"></span>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a onClick={this.deleteProject}>Delete the project permanently</a></li>
                                            <li><a onClick={this.archiveProject}>Archive the project for 1 year</a></li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="flex-col">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">No Don't!</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}