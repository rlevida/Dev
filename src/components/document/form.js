import React from "react"
import { showToast, postData, putData } from '../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        workstream: store.workstream,
        task: store.task
    }
})

export default class FormComponent extends React.Component {
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
        let { socket, document, dispatch } = this.props

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
                postData(`/api/folder/postFolderTag?tagTypeId=${document.Selected.id}&tagType=folder`, dataToSubmit, (c) => {
                    dispatch({ type: "UPDATE_DATA_FOLDER_LIST", UpdatedData: c.data })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                    showToast("success", "Successfully Updated.")
                })
            }
        } else {
            if (document.EditType == "rename") {
                let dataToSubmit = { origin: document.Selected.origin }
                putData(`/api/document/putDocumentName/${document.Selected.id}`, dataToSubmit, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data })
                        showToast("success", "Successfully Updated.")
                    } else {
                        showToast("error", "Updating failed. Please try again.")
                    }
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                })
            } else if (document.EditType == "tags") {
                let dataToSubmit = { tags: document.Selected.tags }
                postData(`/api/document/postDocumentTag?tagTypeId=${document.Selected.id}&tagType=document`, dataToSubmit, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data })
                        showToast("success", "Successfully Updated.")
                    } else {
                        showToast("danger", "Updating failed. Please try again.")
                    }
                    dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
                })
            }
        }
    }

    selectTag(e, data) {
        let { dispatch, document } = this.props;
        let Selected = Object.assign({}, document.Selected);
        Selected["tags"] = JSON.stringify(e)
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected })
    }

    render() {
        let { dispatch, document, workstream, task } = this.props;
        let tagOptions = [];
        workstream.List.map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) });
        task.List.filter(e => { return e.status != "Completed" }).map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) });

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{ marginRight: "2px" }}
                    onClick={(e) => {
                        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li>
                <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">DOCUMENT {(document.Selected.id) ? " > Edit > ID: " + document.Selected.id : " > Add"}</h3>
                        </div>
                        <div class="panel-body">
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
                                                selected={(document.Selected.tags != null) ? JSON.parse(document.Selected.tags) : []}
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}