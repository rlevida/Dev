import React from "react";
import { connect } from "react-redux";
import { showToast, postData } from '../../../globalFunction';
import _ from "lodash";
import { withRouter } from "react-router";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class FolderModal extends React.Component {
    constructor(props) {
        super(props)
        _.map([
            "submit",
            "onChange",
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        $("#folder-form").validator();
    }
    componentWillMount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} })
    }

    getNestedChildren(arr, parent, dataObj) {
        var out = []
        for (var i in arr) {
            if (arr[i].id == parent) {
                if (typeof arr[i].childFolder === 'undefined') {
                    arr[i].childFolder = []
                }
                arr[i].childFolder.push(dataObj)
                out.push(arr[i])
            } else {
                if (typeof arr[i].childFolder === "undefined") {
                    arr[i].childFolder = []
                }
                if (arr[i].childFolder.length > 0) {
                    this.getNestedChildren(arr[i].childFolder, parent, dataObj)
                }
                out.push(arr[i])
            }
        }
        return out
    }

    submit() {
        const { loggedUser, folder, dispatch, match, document } = this.props;
        const projectId = match.params.projectId;
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
                name: folder.New.name,
                origin: folder.New.name,
                createdBy: loggedUser.data.id,
                type: "folder",
                project: projectId,
                uploadedBy: loggedUser.data.id,
                status: 'new',
            }],
            projectId: projectId,
            folderId: folder.Selected.id,
        };

        if (folder.SelectedFolderName.length <= 3) {
            postData(`/api/document`, dataToSubmit, (c) => {
                const { result } = { ...c.data }
                if (document.Filter.status === 'sort') {
                    if (_.isEmpty(folder.SelectedFolderName)) {
                        dispatch({ type: "ADD_FOLDER_LIST", list: result });
                    } else {
                        const newList = this.getNestedChildren(folder.List, folder.Selected.id, result[0])
                        dispatch({ type: "SET_FOLDER_LIST", list: newList });
                    }
                } else {
                    dispatch({ type: "ADD_DOCUMENT_LIST", list: result });
                }
                dispatch({ type: 'SET_NEW_FOLDER', New: {} })
                showToast("success", "Successfully Added.")
            })
        } else {
            showToast("warning", "Folder count reached")
        }
    }

    onChange(e) {
        const { dispatch, folder } = this.props;
        const selectedObj = { ...folder.New, [e.target.name]: e.target.value };
        dispatch({ type: 'SET_NEW_FOLDER', New: selectedObj })
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
                                        value={folder.New.name || ""}
                                        name="name"
                                        onChange={(e) => this.onChange(e)}
                                        autoComplete="off"
                                        required />
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            {
                                (folder.New.name) &&
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

export default withRouter(FolderModal)