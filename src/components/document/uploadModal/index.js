import React from "react";
import Dropzone from 'react-dropzone';
import { connect } from "react-redux"

import { DropDown , Loading } from "../../../globalComponents";
import { showToast, postData , getData } from '../../../globalFunction';
import _ from "lodash";

let keyTimer = "";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        global: store.global,
        folder: store.folder,
        project: store.project,
        workstream: store.workstream

    }
})
export default class UploadModal extends React.Component {
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
            "setWorkstreamList",
        ], (fn) => { this[fn] = this[fn].bind(this) });
    }

    componentDidMount(){
        const { project } = this.props;
        this.fetchProjectList();
        this.setWorkstreamList()
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

    setWorkstreamList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchWorkstreamList(options);
        }, 1500);
    }

    fetchWorkstreamList(options) {
        const { dispatch, document, loggedUser, project } = { ...this.props };
        const { Selected } = document;
        let fetchUrl = `/api/workstream?projectId=${typeof project.Selected.id !== 'undefined' ?  project.Selected.id : Selected.projectId}&page=1&userId=${loggedUser.data.id}`;

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


    setDropDown(name, value) {
        let { dispatch, document } = this.props
        const selectedObj = { ...document.Selected, [name]: value };

        if (name == "projectId" && value != "") {
            selectedObj["tagWorkstream"] = [];
        }

        if (name == "projectId" && (typeof selectedObj.projectId != "undefined" && selectedObj.projectId != "")) {
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });
            this.setWorkstreamList();
        }

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
    }

    saveDocument() {
        const { dispatch, document } = this.props;
        postData(`/api/document`, document.Selected, (c) => {
            if (c.status == 200) {
                this.setState({ upload: false, dataToSubmit: [] });
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: document.NewUploadCount + 1 })
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    selectTag(e, index) {
        const { dataToSubmit } = this.state;
        dataToSubmit[index].tags = JSON.stringify(e);
        dataToSubmit[index].status = "new";
        this.setState({ dataToSubmit: dataToSubmit });
    }

    onDrop(files) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES' , Files : files })
        // this.setState({ files, upload: true });
    }

    uploadFile() {
        const { loggedUser, folder , dispatch , document } = this.props;
        const selectedObj = { ...document.Selected };
        let data = new FormData()
        dispatch({ type : 'SET_DOCUMENT_UPLOAD_LOADING' , Loading : true });
        // this.setState({ loading: true })

        document.Files.map(e => {
            data.append("file", e)
        })

        postData(`/api/document/upload`, data, (c) => {
            const documentToSave = []
            c.data.map(e => {
                documentToSave.push({
                    name: e.filename, origin: e.origin, project: project, uploadedBy: loggedUser.data.id,
                    status: 'new', type: 'document', folderId: folder.SelectedNewFolder.id
                })
            })

            selectedObj.DocumentToSave = documentToSave 

            dispatch({ type : 'SET_DOCUMENT_SELECTED', Selected : selectedObj })
            // dispatch({ type : 'SET_DOCUMENT_TO_SAVE' , DocumentToSave : documentToSave })
            dispatch({ type : 'SET_DOCUMENT_UPLOAD_LOADING' , Loading : false });
        })
    }

    render() {
        const { global , project, workstream , document } = this.props;
        // let tagOptions = [];

        // if (typeof global.SelectList.workstreamList != "undefined" && typeof global.SelectList.taskList != "undefined") {
        //     global.SelectList.workstreamList
        //         .map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
        //     global.SelectList.taskList
        //         .filter(e => { return e.status != "Completed" })
        //         .map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })
        // }

        return (
            <div>
                <div class="modal fade document-upload-modal" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4 class="modal-title" id="uploadFileModalLabel">Add New file</h4>
                                    {/* {
                                        (this.state.dataToSubmit.length == 0)
                                            ? "Upload File"
                                            : "Tag your files"
                                    } */}
                                {(this.state.dataToSubmit.length > 0) &&
                                    <p style={{ fontStyle: "italic", margin: "15px 20px 20px 25px" }}>Tagging your files will link them to a project or workflow and will make it easier to find them later.</p>
                                }

                            </div>
                            <div class="modal-body">
                                <div class="row mb20">
                                    <div class="col-lg-6 col-md-6 col-xs-12 ">
                                    <label for="project-options">Project * <span class="text-red">*</span></label>
                                        <DropDown 
                                            id="project-options"
                                            multiple={false}
                                            required={false}
                                            options={(typeof project.Selected.id ==='undefined') ? project.SelectList : [{ id:project.Selected.id ,name:project.Selected.project}]}
                                            selected={(typeof project.Selected.id === "undefined") ? document.Selected.projectId : project.Selected.id}
                                            onChange={(e) => {
                                                this.setDropDown("projectId", (e == null) ? "" : e.value);
                                            }}
                                            
                                            placeholder={'Search project'}
                                        />
                                    </div>
                                </div>
                                <div class="row mb20">
                                    <div class="col-lg-6 col-md-6 col-xs-12 ">
                                    <label for="workstream-options">Workstream</label>
                                            <DropDown 
                                                id="workstream-options"
                                                multiple={true}
                                                required={false}
                                                options={workstream.SelectList}
                                                selected={(typeof document.Selected.tagWorkstream == "undefined") ? [] : document.Selected.tagWorkstream }
                                                loading={true}
                                                onChange={(e) => {
                                                    this.setDropDown("tagWorkstream", (e == null) ? "" : e);
                                                }}
                                            />
                                           <div>
                                                {
                                                    (workstream.Loading == "RETRIEVING" && typeof document.Selected.projectId != "undefined") && <i class="fa fa-circle-o-notch fa-spin fa-fw"></i>
                                                }
                                            </div>
                                    </div>
                                </div>
                                <div class="row mb20">
                                    <div class="col-lg-6 col-md-6 col-xs-12 ">
                                    <label for="folder-options">Folder</label>
                                        <DropDown 
                                            id="folder-options"
                                            multiple={false}
                                            required={false}
                                            options={[]}
                                            selected={null}
                                            // onChange={(e) => this.selectTag(e, index)}
                                        />
                                    </div>
                                </div>
                                <div class="row mb20">
                                    <div class="col-md-8">
                                        {(!document.DocumentUploadLoading && typeof document.Selected.DocumentToSave === 'undefined' ) &&
                                            <Dropzone onDrop={this.onDrop.bind(this)}
                                                class="document-file-upload"
                                            >
                                                <div style={{ textAlign: "center", height: "100%", padding: "60px" }}>
                                                    <div>
                                                        {(this.state.upload && !this.state.loading) ?
                                                            <span style={{ fontSize: "75px" }} class="glyphicon glyphicon-file"></span> :
                                                            <p>Drop some files here, or click to select files to upload.</p>
                                                        }
                                                    </div>
                                                </div>
                                            </Dropzone>
                                        }
                                    </div>
                                </div>
                                <div class="row mb20">
                                    <div class="col-lg-4 col-md-4 col-xs-12">
                                        { (!document.DocumentUploadLoading && document.Files.length > 0 && typeof document.Selected.DocumentToSave === 'undefined') &&
                                            <div class="form-group">
                                                <button class="btn btn-success" onClick={() => this.uploadFile()}> Upload</button>
                                            </div>
                                        }
                                        { (document.DocumentUploadLoading) &&
                                            <Loading/>
                                        }
                                        <table id="dataTable" class="table responsive-table" >
                                            <tbody>
                                              
                                                {( document.Selected.DocumentToSave && document.Selected.DocumentToSave.length > 0) &&
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
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                {(document.Selected.DocumentToSave && document.Selected.DocumentToSave.length > 0) &&
                                    <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.saveDocument()}>Save</button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}