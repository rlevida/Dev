import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import Dropzone from 'react-dropzone';

import { DropDown } from "../../globalComponents";
import { showToast, postData, getData } from '../../globalFunction';

let keyTimer = "";

@connect((store) => {
    return {
        task: store.task,
        loggedUser: store.loggedUser,
        document: store.document,
        project: store.project,
    }
})

export default class TaskDocument extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleSubmit",
            "onDrop",
            "setDropDownMultiple",
            "removefile"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleSubmit() {
        const { document, loggedUser, task, dispatch, project } = { ...this.props };
        let data = new FormData();

        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING", LoadingType: 'Loading' });
        _.map(document.Files, (file) => {
            const checklist = (typeof document.Selected.tagged != "undefined") ? document.Selected.tagged : [];
            data.append("file", file);
            data.append("taskId", task.Selected.id);
            data.append("userId", loggedUser.data.id);
            data.append('tagged', JSON.stringify(checklist));
        });

        postData(`/api/task/document?projectId=${project.Selected.id}&workstreamId=${task.Selected.workstreamId}`, data, (c) => {
            if (c.data.type == "checklist") {
                const currentChecklist = task.Selected.checklist;
                dispatch({
                    type: "SET_TASK_SELECTED",
                    Selected: {
                        ...task.Selected, checklist: _(currentChecklist)
                            .differenceBy(c.data.result, 'id')
                            .concat(c.data.result)
                            .sortBy('dateAdded')
                            .reverse()
                            .value()
                    }
                });
                dispatch({ type: "UPDATE_CHECKLIST", List: c.data.result });
            } else {
                const currentDocumentlist = task.Selected.tag_task;
                currentDocumentlist.push(c.data.result);
                dispatch({
                    type: "SET_TASK_SELECTED",
                    Selected: { ...task.Selected, tag_task: [...currentDocumentlist, ...c.data.result] }
                });
            }

            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' });
            dispatch({ type: 'SET_DOCUMENT_FILES', Files: "" });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            showToast("success", "Task Document successfully updated.");
        });
    }

    onDrop(file) {
        const { dispatch, document } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES', Files: [...document.Files, ...file] });
    }
    setDropDownMultiple(name, values) {
        const { document, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, [name]: values } });
    }
    removefile(selecindextedId) {
        const { dispatch, document } = { ...this.props };
        const { Files } = document;
        (Files).splice(selecindextedId, 1);
        dispatch({ type: "SET_DOCUMENT_FILES", Files: Files });
    }
    render() {
        const { task, document } = { ...this.props };
        const { checklist } = task.Selected;
        const { Files = [], Loading, Selected } = document;
        const fileExtention = (Files.length == 1) ? (Files[0].type).split("/")[1] : (Files.length > 1) ? "" : "";

        return (
            <form id="task-document-form">
                <div class="mt10 row">
                    <div class="col-lg-8 col-sm-12">
                        <div class="form-group">
                            <label for="email">Document:<span class="text-red">*</span></label>
                            <Dropzone
                                accept=".jpg,.png,.pdf,.doc,.docx,.xlsx"
                                onDrop={this.onDrop}
                                class="document-file-upload mb10"
                                id="task-document"
                                disabled={(Loading == "SUBMITTING")}
                            >
                                <div class="dropzone-wrapper">
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
                                </div>
                            </Dropzone>
                            {
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
                        <div class="form-group">
                            <label for="email">Tag Checklist:</label>
                            <DropDown multiple={true}
                                required={false}
                                options={_.map(_.filter(checklist, (o) => { return o.isDocument == 1 }), ({ id, description }) => { return { id, name: description } })}
                                selected={(typeof Selected.tagged == "undefined") ? [] : Selected.tagged}
                                onChange={(e) => this.setDropDownMultiple("tagged", e)}
                                placeholder={"Search or select task"}
                                isClearable={(checklist.length > 0)}
                                disabled={(Loading == "SUBMITTING")}
                            />
                        </div>
                    </div>
                </div>
                {
                    (Files.length > 0) && <a class="btn btn-violet" onClick={this.handleSubmit} disabled={(Loading == "SUBMITTING")}>
                        <span>
                            {
                                (Loading == "SUBMITTING") ? "Uploading..." : "Create Task Document"
                            }
                        </span>
                    </a>
                }
            </form>
        )
    }
}