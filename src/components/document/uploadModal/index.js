import React from "react";
import Dropzone from 'react-dropzone';

import { DropDown } from "../../../globalComponents";
import { showToast, postData } from '../../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        projectData: store.project

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
        this.onDrop = this.onDrop.bind(this)
    }

    saveDocument() {
        let { dispatch } = this.props;
        let { dataToSubmit } = this.state;
        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                this.setState({ upload: false, dataToSubmit: [] });
                dispatch({ type: "ADD_DOCUMENT_LIST", list: c.data });
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    selectTag(e, index) {
        let { dataToSubmit } = this.state;
        dataToSubmit[index].tags = JSON.stringify(e);
        dataToSubmit[index].status = "new";
        this.setState({ dataToSubmit: dataToSubmit });
    }

    onDrop(files) {
        this.setState({ files, upload: true });
    }

    uploadFile() {
        let { loggedUser } = this.props,
            { files } = this.state
        let data = new FormData(), dataToSubmit = [];
        this.setState({ loading: true })

        files.map(e => {
            data.append("file", e)
        })


        postData(`/api/document/upload`, data, (c) => {
            c.data.map(e => {
                dataToSubmit.push({ name: e.filename, origin: e.origin, project: project, uploadedBy: loggedUser.data.id, status: "new" })
            })
            this.setState({ dataToSubmit: dataToSubmit, loading: false, upload: false })
        })
    }

    render() {
        let { workstream, task, global } = this.props;
        let tagOptions = [];
        if (typeof global.SelectList.workstreamList != "undefined" && typeof global.SelectList.taskList != "undefined") {
            global.SelectList.workstreamList
                .map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
            global.SelectList.taskList
                .filter(e => { return e.status != "Completed" })
                .map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })
        }
        return <div>
            <div class="modal fade" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5 class="modal-title" id="uploadFileModalLabel">
                                {
                                    (this.state.dataToSubmit.length == 0)
                                        ? "Upload File"
                                        : "Tag your files"
                                }
                            </h5>
                            {(this.state.dataToSubmit.length > 0) &&
                                <p style={{ fontStyle: "italic", margin: "15px 20px 20px 25px" }}>Tagging your files will link them to a project or workflow and will make it easier to find them later.</p>
                            }

                        </div>
                        <div class="modal-body">
                            {(!this.state.loading && this.state.dataToSubmit.length == 0) &&
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

                            <br />

                            {(this.state.upload && !this.state.loading) &&
                                <div class="form-group text-center">
                                    <button class="btn btn-success" onClick={() => this.uploadFile()}> Upload</button>
                                </div>
                            }

                            <table id="dataTable" class="table responsive-table" >
                                <tbody>
                                    {(this.state.dataToSubmit.length == 0 && this.state.loading) &&
                                        <tr>
                                            <td colSpan={8}><i class="fa fa-spinner fa-spin" style={{ fontSize: "36px", marginTop: "50px" }}></i></td>
                                        </tr>
                                    }
                                    {(this.state.dataToSubmit.length > 0) &&
                                        this.state.dataToSubmit.map((data, index) => {
                                            return (
                                                <tr key={index}>
                                                    <td style={{ border: "none", width: "20%" }}><span class="pull-left"><i class="fa fa-file" aria-hidden="true"></i>&nbsp;&nbsp;{data.origin}</span></td>
                                                    <td style={{ border: "none", width: "10%" }}><span><i class="fa fa-tag" aria-hidden="true"></i></span></td>
                                                    <td style={{ border: "none" }}>
                                                        <DropDown multiple={false}
                                                            multiple={true}
                                                            required={false}
                                                            options={tagOptions}
                                                            selected={(typeof data.tags != "undefined") ? JSON.parse(data.tags) : []}
                                                            onChange={(e) => this.selectTag(e, index)}
                                                        />
                                                        <div class="help-block with-errors"></div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    }
                                </tbody>
                            </table>

                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            {(this.state.dataToSubmit.length > 0) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.saveDocument()}>Save</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}