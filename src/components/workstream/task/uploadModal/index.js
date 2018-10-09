import React from "react"
import Dropzone from 'react-dropzone';
import { DropDown } from "../../../../globalComponents";
import { showToast } from '../../../../globalFunction';
import { connect } from "react-redux";
import axios from "axios";
@connect((store) => {
    return {
        socket: store.socket.container,
        task: store.task,
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        checklist: store.checklist
    }
})
export default class UploadModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
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
        let { loggedUser, task, dispatch, checklist , socket } = this.props,
            { files } = this.state
        let data = new FormData(), self = this;
        let documentIds = []
        if( typeof checklist.Selected.documents != "undefined" && checklist.Selected.documents != null){
            documentIds = checklist.Selected.documents.map( e => { return e.id })
        }
     
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
                    tags: JSON.stringify([{ value: `task-${task.Selected.id}`, label: task.Selected.Task }]),
                    type: task.ModalType == "checklist" ? "attachment" : "task",
                    isCompleted: 1
                })
            })

            if (task.ModalType == "checklist") {
                socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: checklist.Selected, documents: tempData, project: project , documentIds : documentIds })
                this.setState({ tempData: [], loading: false, upload: false })
                $(`#uploadFileModal`).modal("hide");
            } else {
                this.setState({ tempData: tempData, loading: false, upload: false })
            }
        }).catch((error) => {
            this.setState({ loading: false, upload: false })
            showToast("error", "Failed to upload. Please try again.")
        });
    }

    saveDocument() {
        let { socket, loggedUser } = this.props;
        let { tempData, tags } = this.state;
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", {
            data: tempData, userId: loggedUser.data.id, project: project, tags: JSON.stringify(tags)
        });
        this.setState({ upload: false, tempData: [], tags: [] });
    }

    closeModal() {
        let { task, dispatch, checklist } = this.props;
        if (task.ModalType == "checklist") {
            dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...checklist.Selected, isDocument: 0 } })
            $(`#uploadFileModal`).modal("hide");
        } else {
            $(`#uploadFileModal`).modal("hide");
        }
    }

    render() {
        let { socket, task, project, dispatch, workstream } = this.props
        let tagOptions = [];
        workstream.List.map(e => { tagOptions.push({ id: `workstream-${e.id}`, name: e.workstream }) })
        task.List.map(e => { tagOptions.push({ id: `task-${e.id}`, name: e.task }) })

        return (
            <div class="modal fade" id="uploadFileModal" tabIndex="-1" role="dialog" aria-labelledby="uploadFileModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="uploadFileModalLabel">Upload File</h5>
                        </div>
                        <div class="modal-body">
                            {(!this.state.loading && this.state.tempData.length == 0) &&
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
                                    {(this.state.tempData.length == 0 && this.state.loading) &&
                                        <tr>
                                            <td colSpan={8}><i class="fa fa-spinner fa-spin" style={{ fontSize: "36px", marginTop: "50px" }}></i></td>
                                        </tr>
                                    }
                                    {(this.state.tempData.length > 0) &&
                                        this.state.tempData.map((data, index) => {
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
                                                            disabled={true}
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
                            {(this.state.tempData.length == 0) &&
                                <button type="button" class="btn btn-secondary" onClick={() => this.closeModal()}>Close</button>
                            }
                            {(this.state.tempData.length > 0) &&
                                <button type="button" class="btn btn-primary" data-dismiss="modal" onClick={() => this.saveDocument()}>Save</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}