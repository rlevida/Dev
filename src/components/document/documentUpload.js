import React from "react";
import Dropzone from 'react-dropzone';
import { connect } from "react-redux"

import { DropDown } from "../../globalComponents";
import { showToast, postData, getData } from '../../globalFunction';
import _ from "lodash";
import { withRouter } from "react-router";

let keyTimer = "";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        global: store.global,
        folder: store.folder,
        workstream: store.workstream,
        project: store.project

    }
})
class DocumentUpload extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dataToSubmit: [],
            upload: false,
            loading: false,
            files: []
        }
        _.map([
            "onDrop",
            "fetchProjectList",
            "saveDocument",
            "setDropDown",
            "getWorkstreamList",
            "fetchFolderList",
            "getFolderList",
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount() {
        const { dispatch, document, match, loggedUser } = this.props;
        const projectId = match.params.projectId;
        const selectedObj = { ...document.Selected, projectId: projectId, usersId: loggedUser.data.id };

        if (projectId) {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: selectedObj })
        }

        this.fetchProjectList();
        this.getWorkstreamList();
        this.fetchFolderList();
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: [] });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
    }
    fetchProjectList(options) {
        const { dispatch } = { ...this.props };
        let fetchUrl = "/api/project?page=1";

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&project=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const projectOptions = _(c.data.result)
                .map((e) => { return { id: e.id, name: e.project } })
                .value();
            dispatch({ type: "SET_PROJECT_SELECT_LIST", List: projectOptions });
        });
    }

    getWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    getFolderList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchFolderList(options);
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

    fetchFolderList(options) {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let requestUrl = `/api/document?page=1&isDeleted=0&linkId=${projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder`;

        if (typeof options != "undefined" && options != "") {
            requestUrl += `&name=${options}`;
        }
        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                const folderOptions = _(c.data.result)
                    .map((e) => { return { id: e.id, name: e.name } })
                    .value();
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            } else {
                showToast('success', 'Something went wrong!');
            }
        });
    }

    setDropDown(name, value) {
        let { dispatch, document } = this.props
        const selectedObj = { ...document.Selected, [name]: value };

        if (name == "projectId" && value != "") {
            selectedObj["tagWorkstream"] = [];
        }

        if (name == "projectId" && (typeof selectedObj.projectId != "undefined" && selectedObj.projectId != "")) {
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
            this.getWorkstreamList();
        }

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
    }

    saveDocument() {
        const { dispatch, document, folder } = this.props;
        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
            return;
        }

        postData(`/api/document`, document.Selected, (c) => {
            if (c.status == 200) {
                this.setState({ upload: false, dataToSubmit: [] });
                const list = _(c.data.result).map((e) => {
                    if (typeof e.folderId !== 'undefined' && folder.SelectedNewFolder.id !== "undefined" && e.folderId === folder.SelectedNewFolder.id) {
                        return e
                    } else if (e.folderId === null) {
                        return e
                    }
                }).filter((e) => { return e }).value();
                // dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs });
                // dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: document.NewUploadCount + 1 });
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                dispatch({ type: 'SET_DOCUMENT_FILES', Files: [] });
                dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: 'List' });
                showToast("success", "Successfully Added.")

            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    onDrop(file) {
        const { dispatch, document } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES', Files: [...document.Files, ...file] });
    }

    async uploadFile() {
        const { loggedUser, folder, dispatch, document, match } = { ...this.props };
        const projectId = match.params.projectId;
        const selectedObj = { ...document.Selected };
        let data = new FormData();

        await dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING" });

        await document.Files.map(e => {
            data.append("file", e)
        })

        await postData(`/api/document/upload`, data, async (c) => {
            const documentToSave = c.data.map(e => {
                e = {
                    name: e.filename, origin: e.origin, project: projectId, uploadedBy: loggedUser.data.id,
                    status: 'new', type: 'document', folderId: folder.SelectedNewFolder.id
                }
                return e
            })
            selectedObj.DocumentToSave = documentToSave
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: selectedObj })
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        })
    }

    removefile(selecindextedId) {
        const { dispatch, document } = { ...this.props };
        const { Files } = document;
        (Files).splice(selecindextedId, 1);
        dispatch({ type: "SET_DOCUMENT_FILES", Files: Files });
    }

    render() {
        const { dispatch, project, workstream, folder, match, document } = { ...this.props };
        const projectId = match.params.projectId;
        const { Files = [], Selected, Loading } = { ...document };
        const { DocumentToSave = [] } = { ...Selected }
        const fileExtention = (Files.length == 1) ? (Files[0].type).split("/")[1] : (Files.length > 1) ? "" : "";
        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                Add New Files
                        </h4>
                        </div>
                        <div class="card-body">
                            <div class="mb20">
                                <form class="form-container">
                                    <div class="form-group">
                                        <label for="project-options">Project <span class="text-red">*</span></label>
                                        <DropDown
                                            id="project-options"
                                            multiple={false}
                                            options={project.SelectList}
                                            selected={projectId}
                                            loading={true}
                                            onChange={(e) => {
                                                this.setDropDown("projectId", (e == null) ? "" : e.value);
                                            }}
                                            placeholder={'Search project'}
                                            disabled
                                            required={true}
                                        />
                                    </div>
                                    <div class="form-group">
                                        <label for="workstream-options">Workstream  <span class="text-red">*</span></label>
                                        <DropDown
                                            id="workstream-options"
                                            multiple={true}
                                            options={workstream.SelectList}
                                            onInputChange={this.getWorkstreamList}
                                            selected={(typeof document.Selected.tagWorkstream == "undefined") ? [] : document.Selected.tagWorkstream}
                                            loading={true}
                                            onChange={(e) => {
                                                this.setDropDown("tagWorkstream", (e == null) ? "" : e);
                                            }}
                                            required={true}
                                            disabled={Loading === "SUBMITTING" ? true : false}
                                        />
                                        <div>
                                            {
                                                (workstream.Loading == "RETRIEVING" && typeof document.Selected.projectId != "undefined") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                            }
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="folder-options">Folder</label>
                                        <DropDown
                                            id="folder-options"
                                            multiple={false}
                                            required={false}
                                            options={folder.SelectList}
                                            selected={(typeof document.Selected.folderId == "undefined") ? null : document.Selected.folderId}
                                            onInputChange={this.getFolderList}
                                            onChange={(e) => {
                                                this.setDropDown("folderId", (e == null) ? "" : e.value);
                                            }}
                                            disabled={Loading === "SUBMITTING" ? true : false}
                                        />
                                    </div>
                                    {DocumentToSave.length === 0 && <div class="form-group">
                                        <Dropzone
                                            accept=".jpg,.png,.pdf,.doc,.docx,.xlsx"
                                            onDrop={this.onDrop}
                                            class="document-file-upload mb10"
                                            id="task-document"
                                            disabled={(Loading == "SUBMITTING")}
                                        >
                                            <div class="dropzone-wrapper">
                                                {
                                                    Loading === "SUBMITTING" ?
                                                        <i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>
                                                        :
                                                        <div class="upload-wrapper">
                                                            {
                                                                (Files.length > 0) ?
                                                                    <div class="img-wrapper">
                                                                        {
                                                                            (fileExtention == "png" || fileExtention == "jpg" || fileExtention == "jpeg") ?
                                                                                <img src={Files[0].preview} alt="Task Document" class="img-responsive" /> :
                                                                                <i class={`fa ${(Files.length > 1) ? "fa-files-o" : "fa-file"}`} aria-hidden="true"></i>
                                                                        }

                                                                    </div>
                                                                    : <p class="m0">Drop task document</p>
                                                            }
                                                        </div>
                                                }
                                            </div>
                                        </Dropzone>
                                        {(Loading !== "SUBMITTING") &&
                                            _.map(Files, ({ name, id }, index) => {
                                                return (
                                                    <div class="file-div" key={index}>
                                                        <p class="m0"><strong>{name.substring(0, 30)}{(name.length > 30) ? "..." : ""}</strong></p>
                                                        <a onClick={() => this.removefile(index)}><i class="fa fa-times ml10" aria-hidden="true"></i></a>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                    }
                                    <div class="form-group">
                                        <table id="dataTable" class="table responsive-table" >
                                            <tbody>

                                                {(document.Selected.DocumentToSave && document.Selected.DocumentToSave.length > 0) &&
                                                    document.Selected.DocumentToSave.map((data, index) => {
                                                        return (
                                                            <tr key={index}>
                                                                <td style={{ border: "none", width: "20%" }}><span class="pull-left"><i class="fa fa-file" aria-hidden="true"></i>&nbsp;&nbsp;{data.origin}</span></td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    {(Loading === "" && document.Files.length > 0 && typeof document.Selected.DocumentToSave === 'undefined') &&
                                         <a class="btn btn-violet mr5" type="button" onClick={() => this.uploadFile()}> Upload Document</a>
                                    }
                                    {(document.Selected.DocumentToSave && document.Selected.DocumentToSave.length > 0) &&
                                        <a class="btn btn-violet mr5" data-dismiss="modal" onClick={() => this.saveDocument()}>Add File</a>
                                    }
                                    {Loading === "" &&
                                        <a class="btn btn-default"
                                            onClick={(e) => {
                                                dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                                                dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
                                            }}
                                        >
                                            <span>Cancel</span>
                                        </a>
                                    }
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        )
    }
}

export default withRouter(DocumentUpload);