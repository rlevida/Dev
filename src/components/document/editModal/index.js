import React from "react"
import { showToast, putData } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        workstream: store.workstream,
        task: store.task,
        global: store.global
    }
})

export default class EditModal extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
    }

    handleChange(e) {
        let { dispatch, document } = this.props
        let Selected = Object.assign({}, document.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    handleSubmit(e) {
        let { loggedUser, document, dispatch } = this.props

        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

        if (document.Selected.isFolder) {
            if (document.EditType == "tags") {
                let dataToSubmit = { ...document.Selected }
                putData(`/api/folder/folderTag/${document.Selected.id}?tagTypeId=${document.Selected.id}&tagType=folder`, dataToSubmit, (c) => {
                    dispatch({ type: "UPDATE_DATA_FOLDER_LIST", UpdatedData: c.data })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                    showToast("success", "Successfully Updated.")
                })
            }
        } else {
            if (document.EditType == "rename") {
                let dataToSubmit = {
                    origin: document.Selected.origin,
                    oldDocument: document.Selected.oldDocument,
                    newDocument: document.Selected.origin,
                    usersId: loggedUser.data.id,
                    projectId: project
                }
                putData(`/api/document/putDocumentName/${document.Selected.id}`, dataToSubmit, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data, Status: document.Selected.status, })
                        showToast("success", "Successfully Updated.")
                    } else {
                        showToast("error", "Updating failed. Please try again.")
                    }
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                })
            } else if (document.EditType == "tags") {
                let dataToSubmit = {
                    tags: JSON.stringify(document.Selected.tags),
                    oldDocument: document.Selected.oldDocument,
                    newDocument: document.Selected.tags.map((e) => { return e.label }).join(','),
                    usersId: loggedUser.data.id,
                    projectId: project
                }
                putData(`/api/document/documentTag/${document.Selected.id}?tagTypeId=${document.Selected.id}&tagType=document&status=${document.Selected.status}`, dataToSubmit, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data, Status: document.Selected.status })
                        showToast("success", "Successfully Updated.")
                    } else {
                        showToast("error", "Updating failed. Please try again.")
                    }
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                })
            }
        }
    }

    selectTag(e, data) {
        let { dispatch, document } = this.props;
        let Selected = Object.assign({}, document.Selected);
        Selected["tags"] = e
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    render() {
        let { document, global } = this.props;
        let tagOptions = [];
        if (typeof global.SelectList.workstreamList !== 'undefined' && typeof global.SelectList.taskList !== 'undefined') {
            global.SelectList.workstreamList.map((e) => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) });
            global.SelectList.taskList.filter((e) => { return e.status != "Completed" }).map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) });
        }
        return (

            <div class="modal fade" id="editModal" tabIndex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="panel-title">DOCUMENT {(document.Selected.id) ? " > Edit > ID: " + document.Selected.id : " > Add"}</h3>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                {(document.EditType == "rename") &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Document Name *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="origin" required value={(typeof document.Selected.origin == "undefined") ? "" : document.Selected.origin} class="form-control" placeholder="Document" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                {(document.EditType == "tags" && tagOptions.length > 0) &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Document Tags *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown
                                                name="tags"
                                                multiple={true}
                                                required={false}
                                                options={tagOptions}
                                                selected={(document.Selected.tags != null) ? document.Selected.tags : []}
                                                onChange={(e) => this.selectTag(e, document.Selected)}
                                            />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                                {(document.EditType == "folder") &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Folder Name *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="name" required value={(typeof document.Selected.name == "undefined") ? "" : document.Selected.name} class="form-control" placeholder="Document" onChange={this.handleChange} />
                                            <div class="help-block with-errors"></div>
                                        </div>
                                    </div>
                                }
                            </form>
                            <br />
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            {(document.Selected.tags != null != null) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={this.handleSubmit}>Submit</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}