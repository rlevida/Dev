import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker } from "../../globalFunction";

let delayTimer = "";
let keyTimer = "";

@connect(store => {
    return {
        loggedUser: store.loggedUser,
        global: store.global,
        document: store.document,
        folder: store.folder,
        workstream: store.workstream
    };
})
class DocumentActionTab extends React.Component {
    constructor(props) {
        super(props);
        _.map(["setDropDown", "handleDate", "handleChange", "fetchWorkstreamList", "getWorkstreamList"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder, match, document } = { ...this.props };
        const projectId = match.params.projectId;

        if (_.isEqual(prevProps.document.ActiveTab, document.ActiveTab) == false) {
            clearTimeout(delayTimer);

            if (_.isEmpty(folder.Selected) === false) {
                dispatch({ type: "SET_SELECTED_FOLDER", Selected: {} });
                dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
            }
            const { ActiveTab } = { ...document };

            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "RESET_DOCUMENT_FILTER", filter: {} });

            delayTimer = setTimeout(() => {
                if (ActiveTab !== "activities") {
                    let requestUrl = `/api/document?linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;

                    if (ActiveTab === "trash") {
                        requestUrl += `&isActive=0&isDeleted=0`;
                    } else {
                        requestUrl += `&isActive=1&isDeleted=0`;

                        if (ActiveTab === "active" || ActiveTab === "sort") {
                            requestUrl += `&folderId=null&type=document`;
                        }

                        if (ActiveTab === "library") {
                            requestUrl += `&folderId=null&type=folder`;
                            this.fetchFolderList();
                        }

                        if (ActiveTab === "archived") {
                            requestUrl += `&isArchived=1`;
                        } else {
                            requestUrl += `&isArchived=0`;
                        }
                    }

                    getData(`${requestUrl}`, {}, c => {
                        const { result, count } = { ...c.data };
                        dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
                    });

                    if (ActiveTab === "sort") {
                        getData(`/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder&folderId=null`, {}, c => {
                            const { result, count } = { ...c.data };
                            dispatch({ type: "SET_FOLDER_LIST", list: result, count: count });
                        });
                    }
                }
            }, 1000);
        }
    }

    fetchFolderList() {
        const { dispatch, loggedUser, match } = { ...this.props };
        const projectId = match.params.projectId;

        let requestUrl = `/api/document?page=1&isDeleted=0&linkId=${projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder&isActive=1&isDeleted=0`;

        if (typeof options != "undefined" && options != "") {
            requestUrl += `&name=${options}`;
        }

        getData(requestUrl, {}, c => {
            if (c.status == 200) {
                const folderOptions = _(c.data.result)
                    .map(e => {
                        const fName = e.documentNameCount > 0 ? `${e.name}(${e.documentNameCount})` : e.name;
                        return { id: e.id, name: fName };
                    })
                    .value();
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            } else {
                showToast("success", "Something went wrong!");
            }
        });
    }

    handleChange(params) {
        const { dispatch, document } = this.props;
        if (document.Filter.workstream != params.workstream) {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [] });
            dispatch({ type: "SET_DOCUMENT_FILTER", filter: params });
        }
    }

    handleDate(e) {
        const { dispatch } = this.props;
        const selectedDate = e.target.value != "" ? moment(e.target.value).format("YYYY-MM-DD") : "";
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [e.target.name]: selectedDate } });
    }

    getWorkstreamList(options) {
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

    setDropDown(name) {
        const { dispatch, document } = this.props;
        if (_.isEqual(name, document.ActiveTab) == false) {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: {} });
            dispatch({ type: "SET_DOCUMENT_ACTIVE_TAB", active: name });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
            dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
        }
    }

    render() {
        const { dispatch, document } = this.props;
        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        <div class="flex-row tab-row mb0">
                            <div class="flex-col">
                                <a class={document.ActiveTab === "active" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("active")}>
                                    Active Files
                                </a>
                            </div>
                            <div class="flex-col">
                                <a class={document.ActiveTab === "library" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("library")}>
                                    Library
                                </a>
                            </div>
                            <div class="flex-col">
                                <a class={document.ActiveTab === "sort" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("sort")}>
                                    Sort Files
                                </a>
                            </div>
                            <div class="flex-col">
                                <a class={document.ActiveTab === "trash" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("trash")}>
                                    Trash
                                </a>
                            </div>
                            <div class="flex-col">
                                <a class={document.ActiveTab === "archived" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("archived")}>
                                    Archived
                                </a>
                            </div>
                            <div class="flex-col">
                                <a class={document.ActiveTab === "activityLogs" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("activities")}>
                                    Activities
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 col-sm-6 col-xs-12 pd0">
                        {document.ActiveTab !== "trash" && document.ActiveTab !== "archived" && document.ActiveTab !== "activities" && (
                            <div class="button-action">
                                {document.Loading === "" && (
                                    <a class="btn btn-default mr10" onClick={() => dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Upload" })}>
                                        <span>
                                            <i class="fa fa-plus mr10" aria-hidden="true" />
                                            Add New File
                                        </span>
                                    </a>
                                )}
                                {document.ActiveTab !== "active" && document.Loading === "" && (
                                    <a class="btn btn-default" data-toggle="modal" data-target="#folderModal">
                                        <span>
                                            <i class="fa fa-folder fa-lg mr10" />
                                            Add New Folder
                                        </span>
                                    </a>
                                )}
                            </div>
                        )}
                        {document.ActiveTab === "trash" && (
                            <div class="button-action">
                                <a class="btn btn-default" data-toggle="modal" data-target="#deleteModal">
                                    <span>
                                        <i class="fa fa-trash fa-lg mr10" />
                                        Empty
                                    </span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default withRouter(DocumentActionTab);
