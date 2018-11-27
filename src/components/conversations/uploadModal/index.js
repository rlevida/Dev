import React from "react"
import Dropzone from 'react-dropzone';
import { showToast, postData, putData } from '../../../globalFunction';
import { connect } from "react-redux";
import axios from "axios";
@connect((store) => {
    return {
        socket: store.socket.container,
        notes: store.notes,
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        checklist: store.checklist,
        activity_log: store.activityLog,
    }
})
export default class UploadModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            dataToSubmit: [],
            upload: false,
            loading: false,
            tags: [],
            files: []
        }
        this.onDrop = this.onDrop.bind(this)
    }

    onDrop(files) {
        this.setState({ files, upload: true });
    }

    uploadFile() {
        let { loggedUser, notes, dispatch, checklist, activity_log } = this.props,
            { files } = this.state
        let data = new FormData(), self = this;

        let tempData = [];

        this.setState({ loading: true })

        files.map(e => {
            data.append("file", e)
        })

        axios({
            method: 'post',
            url: '/api/document/upload',
            data: data,
            params: { uploadType: 'form', type: 'upload' },
            responseType: 'json'
        }).then((response) => {
            response.data.map(e => {
                tempData.push({
                    name: e.filename, origin: e.origin,
                    project: project, uploadedBy: loggedUser.data.id,
                    status: "new",
                    tags: JSON.stringify([{ value: `notes-${notes.Selected.id}`, label: notes.Selected.note }]),
                    type: 'document',
                    isCompleted: 0
                })
            })

            this.setState({ dataToSubmit: tempData, loading: false, upload: false })
        }).catch((error) => {
            this.setState({ loading: false, upload: false })
            showToast("error", "Failed to upload. Please try again.")
        });
    }

    saveDocument() {
        let { dispatch } = this.props;
        let { dataToSubmit } = this.state;

        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                console.log(c.data);
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data, DocumentType: 'New' });
                showToast("success", "Successfully Added.")
                this.setState({ upload: false, tempData: [], tags: [] });
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    closeModal() {
        $(`#uploadFileModal`).modal("hide");
    }

    render() {
        let { notes, workstream } = this.props
        let tagOptions = [];
       
        return (
            <div class="modal fade" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                            <h4 class="modal-title" id="myModalLabel">Upload File</h4>
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
                            {(this.state.loading) &&
                                <div class="form-group text-center">
                                    <span style={{fontSize:"30px"}} class="fa fa-spinner fa-spin" ></span>
                                </div>
                            }
                        </div>
                        <div class="modal-footer">
                            {(this.state.dataToSubmit.length == 0) &&
                                <button type="button" class="btn btn-secondary" onClick={() => this.closeModal()}>Close</button>
                            }
                            {(this.state.dataToSubmit.length > 0) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.saveDocument()}>Save</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}