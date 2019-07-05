import React from "react";
import { connect } from "react-redux";
import { showToast, postData, getData } from "../../../globalFunction";
import { DropDown } from "../../../globalComponents";
import _ from "lodash";
import { withRouter } from "react-router";
let keyTimer = "";
@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
        workstream: store.workstream,
        project: store.project
    };
})
class FolderModal extends React.Component {
    constructor(props) {
        super(props);
        _.map(["submit", "onChange", "fetchWorkstreamList", "fetchFolderList", "fetchProjectList", "getWorkstreamList", "getFolderList"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch, match, loggedUser } = this.props;
        const projectId = match.params.projectId;
        const selectedObj = { projectId: projectId, usersId: loggedUser.data.id };

        if (projectId) {
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
        }

        this.fetchProjectList();
        this.getWorkstreamList();
        this.fetchFolderList();

        $("#folderModal").on("hidden.bs.modal", function() {
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
        });
    }
    componentWillMount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
    }

    getNestedChildren(arr, parent, dataObj) {
        var out = [];
        for (var i in arr) {
            if (arr[i].id == parent) {
                if (typeof arr[i].childFolder === "undefined") {
                    arr[i].childFolder = [];
                }
                arr[i].childFolder.push(dataObj);
                out.push(arr[i]);
            } else {
                if (typeof arr[i].childFolder === "undefined") {
                    arr[i].childFolder = [];
                }
                if (arr[i].childFolder.length > 0) {
                    this.getNestedChildren(arr[i].childFolder, parent, dataObj);
                }
                out.push(arr[i]);
            }
        }
        return out;
    }

    submit() {
        const { loggedUser, folder, dispatch, match, document } = this.props;
        const projectId = match.params.projectId;
        let result = true;

        $(".folder-form *").validator("validate");
        $(".folder-form .form-group").each(function() {
            if ($(this).hasClass("has-error")) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.");
            return;
        }

        let dataToSubmit = {
            DocumentToSave: [
                {
                    name: document.Selected.name,
                    origin: document.Selected.name,
                    createdBy: loggedUser.data.id,
                    type: "folder",
                    project: projectId,
                    uploadedBy: loggedUser.data.id,
                    status: "new"
                }
            ],
            tagWorkstream: typeof document.Selected.tagWorkstream !== "undefined" ? document.Selected.tagWorkstream : [],
            projectId: projectId,
            folderId: null
        };

        if (folder.Selected.id && !document.Selected.folderId) {
            dataToSubmit = { ...dataToSubmit, folderId: folder.Selected.id };
        }
        if (document.Selected.folderId) {
            dataToSubmit = { ...dataToSubmit, folderId: document.Selected.folderId };
        }

        postData(`/api/document`, dataToSubmit, c => {
            const { result } = { ...c.data };
            if (document.ActiveTab === "sort") {
                if (document.Selected.folderId) {
                    const newList = this.getNestedChildren(folder.List, document.Selected.folderId, result[0]);
                    dispatch({ type: "SET_FOLDER_LIST", list: newList });
                } else {
                    dispatch({ type: "ADD_FOLDER_LIST", list: result });
                }
            } else if ((folder.Selected.id && !document.Selected.folderId) || (!folder.Selected.id && !document.Selected.folderId)) {
                dispatch({ type: "ADD_DOCUMENT_LIST", list: result });
            }

            if (document.ActiveTab === "library") {
                const resultArr = result.map(e => {
                    const fName = e.documentNameCount > 0 ? `${e.name}(${e.documentNameCount})` : e.name;
                    return { id: e.id, name: fName };
                });
                const folderOptions = [...folder.SelectList, ...resultArr];
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            }

            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            $("#folderModal").modal("hide");
            showToast("success", "Successfully Added.");
        });
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

        getData(fetchUrl, {}, c => {
            const projectOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.project };
                })
                .value();
            dispatch({ type: "SET_PROJECT_SELECT_LIST", List: projectOptions });
            dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
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
        getData(fetchUrl, {}, c => {
            const workstreamOptions = _(c.data.result)
                .map(e => {
                    return { id: e.id, name: e.workstream };
                })
                .value();
            dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
            dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
        });
    }

    fetchFolderList(options) {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let requestUrl = `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder`;

        if (typeof options != "undefined" && options != "") {
            requestUrl += `&name=${options}`;
        }
        getData(requestUrl, {}, c => {
            if (c.status == 200) {
                const folderOptions = _(c.data.result)
                    .map(e => {
                        return { id: e.id, name: e.name };
                    })
                    .value();
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            } else {
                showToast("success", "Something went wrong!");
            }
        });
    }

    setDropDown(name, value) {
        let { dispatch, document } = this.props;
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

    onChange(e) {
        const { dispatch, document } = this.props;
        const selectedObj = { ...document.Selected, [e.target.name]: e.target.value };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: selectedObj });
    }

    render() {
        const { project, workstream, folder, document } = { ...this.props };
        const { Selected, Loading } = { ...document };
        const hasSelectedProject = _.find(project.SelectList, { id: project.Selected.id });
        if (!hasSelectedProject) {
            project.SelectList.push({ id: project.Selected.id, name: project.Selected.project });
        }
        return (
            <div class="modal fade" id="folderModal" tabIndex="-1" role="dialog" aria-labelledby="folderModalLabel" aria-hidden="true" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title" id="folderModalLabel">
                                Add New Folder
                            </h4>
                        </div>
                        <div class="modal-body">
                            <div class="folder-form">
                                <div class="form-group">
                                    <label for="project-options">
                                        Folder Name <span class="text-red">*</span>
                                    </label>
                                    <input class="form-control" type="text" id="inputFolder" placeholder="Folder Name" value={Selected.name || ""} name="name" onChange={e => this.onChange(e)} autoComplete="off" required />
                                </div>
                                <div class="form-group">
                                    <label for="project-options">
                                        Project <span class="text-red">*</span>
                                    </label>
                                    <DropDown
                                        id="project-options"
                                        options={project.SelectList}
                                        selected={project.Selected.id}
                                        onChange={e => {
                                            this.setDropDown("projectId", e == null ? "" : e.value);
                                        }}
                                        placeholder={"Search project"}
                                        disabled
                                        multiple={false}
                                        loading={true}
                                        required={true}
                                    />
                                    <div>{project.Loading == "RETRIEVING" && typeof document.Selected.projectId != "undefined" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}</div>
                                </div>
                                <div class="form-group">
                                    <label for="workstream-options">Workstream</label>
                                    <div class="display-flex vh-center">
                                        <DropDown
                                            id="workstream-options"
                                            options={workstream.SelectList}
                                            onInputChange={this.getWorkstreamList}
                                            selected={typeof document.Selected.tagWorkstream == "undefined" ? [] : document.Selected.tagWorkstream}
                                            onChange={e => {
                                                this.setDropDown("tagWorkstream", e == null ? "" : e);
                                            }}
                                            disabled={Loading === "SUBMITTING" ? true : false}
                                            loading={true}
                                            multiple={true}
                                        />
                                        <div>{workstream.Loading == "RETRIEVING" && typeof document.Selected.projectId != "undefined" && <i class="fa fa-circle-o-notch fa-spin fa-fw" />}</div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="folder-options">Folder</label>
                                    <DropDown
                                        id="folder-options"
                                        options={folder.SelectList}
                                        selected={typeof document.Selected.folderId == "undefined" ? null : document.Selected.folderId}
                                        onInputChange={this.getFolderList}
                                        onChange={e => {
                                            this.setDropDown("folderId", e == null ? "" : e.value);
                                        }}
                                        disabled={Loading === "SUBMITTING" ? true : false}
                                        multiple={false}
                                        isClearable={true}
                                        required={false}
                                    />
                                </div>
                            </div>
                            <div class="mt20">
                                <a class="btn btn-violet mr5" onClick={() => this.submit()}>
                                    <span>Submit</span>
                                </a>
                                <a class="btn btn-default" data-dismiss="modal">
                                    <span>Cancel</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(FolderModal);
