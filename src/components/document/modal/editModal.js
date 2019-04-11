import React from "react";
import { showToast, putData, getData } from '../../../globalFunction';
import { DropDown } from "../../../globalComponents";
import _ from "lodash";
import { connect } from "react-redux";
import { withRouter } from "react-router";

let keyTimer = "";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        global: store.global,
        workstream: store.workstream,
    }
})

class EditModal extends React.Component {
    constructor(props) {
        super(props)
        _.map([
            "handleChange",
            "handleSubmit",
            "fetchWorkstreamList",
            "setWorkstreamList",
            "handleSubmit",
            "selectTag",
            "setDropDown"
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        const { workstream } = this.props;
        $(".form-container").validator();
        if (_.isEmpty(workstream.SelectList)) {
            this.setWorkstreamList();
        }
    }

    setWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchWorkstreamList(options) {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let fetchUrl = `/api/workstream?projectId=${projectId}&page=1&userId=${loggedUser.data.id}`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&workstream=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const workstreamOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.workstream } })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    handleChange(e) {
        const { dispatch, document } = this.props;
        const Selected = Object.assign({}, document.Selected);

        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected });
    }

    handleSubmit() {
        const { loggedUser, document, dispatch, match } = this.props;
        const projectId = match.params.projectId;
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

        if (document.EditType == "rename") {
            const dataToSubmit = {
                origin: document.Selected.origin,
                oldDocument: document.Selected.oldDocument,
                newDocument: document.Selected.origin,
                usersId: loggedUser.data.id,
                projectId: projectId
            }
            putData(`/api/document/rename/${document.Selected.id}?starredUser=${loggedUser.data.id}`, dataToSubmit, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data.result, Status: document.Selected.status, })
                    dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                    showToast("success", "Successfully Updated.")
                } else {
                    showToast("error", "Updating failed. Please try again.")
                }
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
            })
        } else if (document.EditType == "tags") {
            const dataToSubmit = {
                tagWorkstream: document.Selected.tagWorkstream,
                oldDocument: document.Selected.oldDocument,
                newDocument: document.Selected.tagWorkstream.map((e) => { return e.label }).join(','),
                usersId: loggedUser.data.id,
                projectId: projectId,
                origin: document.Selected.origin
            }
            putData(`/api/document/tag/${document.Selected.id}?tagTypeId=${document.Selected.id}&tagType=document&status=${document.Selected.status}&starredUser=${loggedUser.data.id}`, dataToSubmit, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data.result, Status: document.Selected.status });
                    dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                    showToast("success", "Successfully Updated.");
                } else {
                    showToast("error", "Updating failed. Please try again.")
                }
                dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
            })
        }
    }

    selectTag(e) {
        const { dispatch, document } = this.props;
        const Selected = Object.assign({}, document.Selected);

        Selected["tags"] = e;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: Selected });
    }

    setDropDown(name, value) {
        const { dispatch, document } = this.props
        const selectedObj = { ...document.Selected, [name]: value };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
    }

    render() {
        const { document, workstream } = this.props;

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

                                        </div>
                                    </div>
                                }
                                {(document.EditType == "tags") &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Document Tags *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <DropDown
                                                name="tags"
                                                multiple={true}
                                                required={true}
                                                options={workstream.SelectList}
                                                selected={(document.Selected.tagWorkstream != null) ? document.Selected.tagWorkstream : []}
                                                onChange={(e) => this.setDropDown("tagWorkstream", (e == null) ? "" : e)}
                                            />
                                        </div>
                                    </div>
                                }
                                {(document.EditType == "folder") &&
                                    <div class="form-group">
                                        <label class="col-md-3 col-xs-12 control-label">Folder Name *</label>
                                        <div class="col-md-7 col-xs-12">
                                            <input type="text" name="name" required value={(typeof document.Selected.name == "undefined") ? "" : document.Selected.name} class="form-control" placeholder="Document" onChange={this.handleChange} />

                                        </div>
                                    </div>
                                }
                            </form>
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

export default withRouter(EditModal);