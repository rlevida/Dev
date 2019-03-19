import React from "react";
import { connect } from "react-redux"

import { showToast, postData } from '../../../globalFunction';
import _ from "lodash";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
        project: store.project
    }
})

export default class FolderModal extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        $("#folder-form").validator();
    }

    submit() {
        const { loggedUser, folder, dispatch, project } = this.props;
        let result = true;
        $('#folder-form *').validator('validate');
        $('#folder-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

        const dataToSubmit =
        {
            DocumentToSave: [{
                name: folder.Selected.name,
                origin: folder.Selected.name,
                createdBy: loggedUser.data.id,
                type: "folder",
                project: project.Selected.id,
                uploadedBy: loggedUser.data.id,
                status: 'new',
            }],
            projectId: project.Selected.id,
            folderId: folder.SelectedNewFolder.id,
        };

        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    onChange(e) {
        const { dispatch, folder } = this.props;
        const selectedObj = { ...folder.Selected, [e.target.name]: e.target.value };
        dispatch({ type: 'SET_FOLDER_SELECTED', Selected: selectedObj, Type: 'Selected' })
    }

    render() {
        const { folder } = this.props;
        return (
            <div class="modal fade" id="folderModal" tabIndex="-1" role="dialog" aria-labelledby="folderModalLabel" aria-hidden="true" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title" id="folderModalLabel">Add New Folder</h4>
                        </div>
                        <div class="modal-body">
                            <div class="folder-form">
                                <div class="form-group">
                                    <label for="project-options">Folder Name <span class="text-red">*</span></label>
                                    <input
                                        class="form-control"
                                        type="text"
                                        id="inputFolder"
                                        placeholder="Folder Name"
                                        value={folder.Selected.name}
                                        name="name"
                                        onChange={(e) => this.onChange(e)}
                                        required />
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            {
                                (folder.Selected.name) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.submit()}>Submit</button>
                            }
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}