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
        document: store.document
    }
})

export default class TaskDocument extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "handleSubmit",
            "onDrop",
            "setDropDownMultiple"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleSubmit() {
        const { document, loggedUser, task, dispatch } = { ...this.props };
        let data = new FormData();

        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING", LoadingType: 'Loading' });
        _.map(document.Files, (file) => {
            const checklist = (typeof document.Selected.tagged != "undefined") ? document.Selected.tagged : [];
            data.append("file", file);
            data.append("taskId", task.Selected.id);
            data.append("userId", loggedUser.data.id);
            data.append('tagged', JSON.stringify(checklist));
        });

        postData(`/api/task/document`, data, (c) => {
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
                    Selected: { ...task.Selected, tag_task: currentDocumentlist }
                });
            }

            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' });
            dispatch({ type: 'SET_DOCUMENT_FILES', Files: "" });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            showToast("success", "Task Document successfully updated.");
        });
    }

    onDrop(file) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES', Files: file });
    }
    setDropDownMultiple(name, values) {
        const { document, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...document.Selected, [name]: values } });
    }
    render() {
        const { task, document } = { ...this.props };
        const { checklist } = task.Selected;
        const { Files = [], Loading, Selected } = document;
        const fileExtention = (Files.length > 0) ? (Files[0].type).split("/")[1] : "";

        return (
            <form id="task-document-form">
                <div class="mt10 row">
                    <div class="col-lg-8 col-sm-12">
                        <div class="form-group">
                            <label for="email">Document:<span class="text-red">*</span></label>
                            <Dropzone
                                onDrop={this.onDrop}
                                class="document-file-upload"
                                id="task-document"
                                disabled={(Loading == "SUBMITTING")}
                                multiple={false}
                            >
                                <div class="dropzone-wrapper">
                                    <div class="upload-wrapper">
                                        {
                                            (Files.length > 0) ?
                                                <div class="img-wrapper">
                                                    {
                                                        (fileExtention == "png" || fileExtention == "jpg" || fileExtention == "jpeg") ?
                                                            <img src={Files[0].preview} alt="Task Document" class="img-responsive" /> :
                                                            <i class="fa fa-file-text" aria-hidden="true"></i>
                                                    }

                                                </div>
                                                : <p class="m0">Drop task document</p>
                                        }
                                    </div>
                                </div>
                            </Dropzone>
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
                <a class="btn btn-violet" onClick={this.handleSubmit} disabled={(Loading == "SUBMITTING")}>
                    <span>
                        {
                            (Loading == "SUBMITTING") ? "Uploading..." : "Create Task Document"
                        }
                    </span>
                </a>
            </form>
        )
    }
}