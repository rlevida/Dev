import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import Dropzone from "react-dropzone";
import TaskDocumentActiveFile from "./taskDocumentActiveFile";
import { DropDown } from "../../globalComponents";
import { showToast, postData, getData } from "../../globalFunction";

let keyTimer = "";

@connect(store => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        document: store.document,
        project: store.project
    };
})
export default class TaskDocument extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            uploadType: null
        };

        _.map(["handleSubmit", "onDrop", "setDropDownMultiple", "removefile", "handleSelectedDocument"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentWillMount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
    }

    handleSubmit() {
        const { document } = { ...this.props };
        if (document.uploadType === "local") {
            this.handleUploadLocal();
        } else if (document.uploadType === "active" || document.uploadType === "library") {
            this.handleUploadActiveFile();
        }
    }

    handleUploadLocal() {
        const { document, loggedUser, task, dispatch } = { ...this.props };

        let data = new FormData();
        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING", LoadingType: "Loading" });
        _.map(document.Files, file => {
            const checklist = typeof document.Selected.tagged != "undefined" ? document.Selected.tagged : [];
            data.append("file", file);
            data.append("taskId", task.Selected.id);
            data.append("userId", loggedUser.data.id);
            data.append("tagged", JSON.stringify(checklist));
        });

        postData(`/api/task/document?projectId=${task.Selected.projectId}&workstreamId=${task.Selected.workstreamId}`, data, c => {
            if (c.data.type == "checklist") {
                const updatedChecklist = _.map(c.data.result, o => {
                    return { ...o, isCompleted: 1 };
                });
                dispatch({
                    type: "SET_TASK_SELECTED",
                    Selected: {
                        ...task.Selected,
                        checklist: _(task.Selected.checklist)
                            .differenceBy(updatedChecklist, "id")
                            .concat(updatedChecklist)
                            .sortBy("dateAdded")
                            .reverse()
                            .value()
                    }
                });
                dispatch({ type: "UPDATE_CHECKLIST", List: updatedChecklist });
                if (c.data.activity_logs.length > 0) {
                    _.map(c.data.activity_logs, o => {
                        dispatch({ type: "ADD_ACTIVITYLOG", activity_log: o });
                    });
                }
            } else {
                const currentDocumentlist = task.Selected.tag_task;

                dispatch({
                    type: "SET_TASK_SELECTED",
                    Selected: { ...task.Selected, tag_task: [...currentDocumentlist, ...c.data.result] }
                });

                if (c.data.activity_logs.length > 0) {
                    _.map(c.data.activity_logs, o => {
                        dispatch({ type: "ADD_ACTIVITYLOG", activity_log: o });
                    });
                }
            }

            this.setState(
                {
                    uploadType: null
                },
                () => {
                    $(`#task-documents`).modal("hide");
                    dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
                    dispatch({ type: "SET_DOCUMENT_FILES", Files: "" });
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                    dispatch({ type: "SET_DOCUMENT_LIST", list: [] });
                    showToast("success", "Task Document successfully updated.");
                }
            );
        });
    }
    handleUploadActiveFile() {
        const { task, dispatch, document, loggedUser } = { ...this.props };
        const files = document.List.filter(e => {
            return e.isChecked;
        });
        const tagWorkstream = files.map(e => {
            return {
                linkType: "workstream",
                linkId: task.Selected.workstreamId,
                tagType: "document",
                tagTypeId: e.id
            };
        });

        const tagTask = files.map(e => {
            return {
                linkType: "task",
                linkId: task.Selected.id,
                tagType: "document",
                tagTypeId: e.id
            };
        });

        const checklist = typeof document.Selected.tagged != "undefined" ? document.Selected.tagged : [];

        postData(`/api/task/documentActiveFile?taskId=${task.Selected.id}&userId=${loggedUser.data.id}`, { data: { task: JSON.stringify(tagTask), workstream: JSON.stringify(tagWorkstream), checklist: JSON.stringify(checklist) } }, c => {
            if (c.data.type == "checklist") {
            } else {
                const currentDocumentlist = task.Selected.tag_task;
                dispatch({
                    type: "SET_TASK_SELECTED",
                    Selected: { ...task.Selected, tag_task: [...currentDocumentlist, ...c.data.result] }
                });
            }
            this.setState(
                {
                    uploadType: null
                },
                () => {
                    $(`#task-documents`).modal("hide");
                    dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
                    dispatch({ type: "SET_DOCUMENT_FILES", Files: "" });
                    dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
                    dispatch({ type: "SET_DOCUMENT_LIST", list: [] });
                    showToast("success", "Task Document successfully updated.");
                }
            );
        });
    }

    onDrop(file) {
        const { dispatch, document } = this.props;
        dispatch({ type: "SET_DOCUMENT_FILES", Files: [...document.Files, ...file] });
    }
    setDropDownMultiple(name, values) {
        const { document, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, [name]: values } });
    }
    removefile(selecindextedId) {
        const { dispatch, document } = { ...this.props };
        const { Files } = document;
        Files.splice(selecindextedId, 1);
        dispatch({ type: "SET_DOCUMENT_FILES", Files: Files });
    }
    setDropDown(name, value) {
        const { dispatch, document } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_UPLOAD_TYPE", uploadType: value });
        if (value === "active" || value === "library") {
            const documentList = document.List.map(e => {
                return { ...e, isChecked: false };
            });
            dispatch({ type: "SET_DOCUMENT_LIST", list: documentList });
            dispatch({ type: "SET_DOCUMENT_FILES", Files: [] });
        }
    }
    handleSelectedDocument(selected) {
        this.setState({
            documentSelected: selected
        });
    }
    render() {
        const { task, document } = { ...this.props };
        const { uploadType } = { ...document };
        const { checklist = [] } = task.Selected;
        const { Files = [], Loading, Selected } = document;
        const fileExtention = Files.length == 1 ? Files[0].type.split("/")[1] : Files.length > 1 ? "" : "";
        const checklistTagged = typeof Selected.tagged == "undefined" ? [] : Selected.tagged;
        const checkSelectedDocument = document.List.filter(e => {
            return e.isChecked;
        });
        return (
            <form id="task-document-form">
                <div>
                    <div class="form-group">
                        <DropDown
                            label=""
                            placeholder="Select upload type"
                            multiple={false}
                            required={true}
                            options={[{ id: "local", name: "Upload From Local" }, { id: "active", name: "Upload From Active Files" }, { id: "library", name: "Upload From Library" }]}
                            selected={uploadType}
                            onChange={e => this.setDropDown("uploadType", e.value)}
                        />
                    </div>
                    {uploadType === "local" && (
                        <div class="form-group">
                            <label for="email">
                                Document:<span class="text-red">*</span>
                            </label>
                            <Dropzone accept=".jpg,.png,.pdf,.doc,.docx,.xlsx,.pptx,.ppt" onDrop={this.onDrop} class="document-file-upload mb10" id="task-document" disabled={Loading == "SUBMITTING"}>
                                <div class="dropzone-wrapper">
                                    <div class="upload-wrapper">
                                        {Files.length > 0 ? (
                                            <div class="img-wrapper">
                                                {fileExtention == "png" || fileExtention == "jpg" || fileExtention == "jpeg" ? (
                                                    <img src={Files[0].preview} alt="Task Document" class="img-responsive" />
                                                ) : (
                                                    <i class={`fa ${Files.length > 1 ? "fa-files-o" : "fa-file"}`} aria-hidden="true" />
                                                )}
                                            </div>
                                        ) : (
                                            <p class="m0">Drop task document</p>
                                        )}
                                    </div>
                                </div>
                            </Dropzone>
                            {_.map(Files, ({ name }, index) => {
                                return (
                                    <div class="file-div mw100" key={index}>
                                        <p class="m0">
                                            <strong>
                                                {name.substring(0, 30)}
                                                {name.length > 30 ? "..." : ""}
                                            </strong>
                                        </p>
                                        <a onClick={() => this.removefile(index)}>
                                            <i class="fa fa-times ml10" aria-hidden="true" />
                                        </a>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {(uploadType === "active" || uploadType === "library") && <TaskDocumentActiveFile handleSelectedDocument={this.handleSelectedDocument} />}
                    {Selected.document_type == "checklist_document" && (
                        <div class="form-group">
                            <label for="email">
                                Tag Checklist:<span class="text-red">*</span>
                            </label>
                            <DropDown
                                multiple={true}
                                required={false}
                                options={_.map(
                                    _.filter(checklist, o => {
                                        return o.isDocument == 1;
                                    }),
                                    ({ id, description }) => {
                                        return { id, name: description };
                                    }
                                )}
                                selected={checklistTagged}
                                onChange={e => this.setDropDownMultiple("tagged", e)}
                                placeholder={"Search or select document checklist"}
                                isClearable={checklist.length > 0}
                                disabled={Loading == "SUBMITTING"}
                            />
                        </div>
                    )}
                </div>
                <div class="text-center mt10">
                    {((Files.length > 0 && Selected.document_type == "checklist_document" && checklistTagged.length > 0) ||
                        (Files.length > 0 && Selected.document_type == "task_document") ||
                        (document.uploadType === "active" && checkSelectedDocument.length > 0 && Selected.document_type == "task_document") ||
                        (document.uploadType === "library" && checkSelectedDocument.length > 0 && Selected.document_type == "task_document") ||
                        (Selected.document_type == "checklist_document" && document.uploadType === "library" && checkSelectedDocument.length > 0 && checklistTagged.length > 0) ||
                        (Selected.document_type == "checklist_document" && document.uploadType === "active" && checkSelectedDocument.length > 0 && checklistTagged.length > 0)) && (
                        <a class="btn btn-violet" onClick={this.handleSubmit} disabled={Loading == "SUBMITTING"}>
                            <span>{Loading == "SUBMITTING" ? "Uploading..." : "Create Task Document"}</span>
                        </a>
                    )}
                </div>
            </form>
        );
    }
}
