import React from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { getData, showToast, setDatePicker, getParameterByName } from "../../globalFunction";
import { DropDown } from "../../globalComponents";

let delayTimer = "";


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
        _.map(["setDropDown"], fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidUpdate(prevProps) {
        const { dispatch, loggedUser, folder, match, document } = { ...this.props };
        const projectId = match.params.projectId;

        if (_.isEqual(prevProps.document.ActiveTab, document.ActiveTab) == false && !getParameterByName("folder-id")) {

            clearTimeout(delayTimer);

            if (_.isEmpty(folder.Selected) === false) {
                dispatch({ type: "SET_SELECTED_FOLDER", Selected: {} });
                dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
            }
            const { ActiveTab } = { ...document };

            dispatch({ type: "RESET_DOCUMENT", List: [], Loading: "RETRIEVING", SubFolders: [] });
            dispatch({ type: "RESET_DOCUMENT_FILTER", filter: {} });

            delayTimer = setTimeout(() => {

                /* Remove pending request */

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
                        getData(
                            `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&type=folder&folderId=null`,
                            {},
                            c => {
                                const { result, count } = { ...c.data };
                                dispatch({ type: "SET_FOLDER_LIST", list: result, count: count });
                            }
                        );
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
                        const fName = e.documentNameCount > 0 ? `${e.origin}(${e.documentNameCount})` : e.origin;
                        return { id: e.id, name: fName };
                    })
                    .value();
                dispatch({ type: "SET_FOLDER_SELECT_LIST", List: folderOptions });
            } else {
                showToast("error", "Something went wrong!");
            }
        });
    }
    setDropDown(name) {
        const { dispatch, document, history } = this.props;
        if (_.isEqual(name, document.ActiveTab) == false) {
            if (getParameterByName("folder-id")) {
                history.replace(history.location.pathname);
            }
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: {} });
            dispatch({ type: "SET_DOCUMENT_ACTIVE_TAB", active: name });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} });
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
            dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
        }
    }

    handleSearchFilter(name, value) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_FILTER", filter: { [name]: value } });
        clearTimeout(delayTimer);
        delayTimer = setTimeout(() => {
            this.handleFilter()
        }, 500);
    }

    handleFilter() {
        const { dispatch, loggedUser, match, document, folder } = { ...this.props };
        const projectId = match.params.projectId;
        const { uploadFrom, uploadTo, uploadedBy, tagWorkstream, tagTask, fileName, searchComment, sortBy } = { ...document.Filter };
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?&linkId=${projectId}&linkType=project&page=1&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}&activeTab=${ActiveTab}&sortBy=${sortBy}`;

        if (ActiveTab === "trash") {
            requestUrl += `&isActive=0&isDeleted=0`;
        } else {
            requestUrl += `&isActive=1&isDeleted=0`;

            if (ActiveTab === "library") {
                if (folder.Selected.id) {
                    requestUrl += `&folderId=${folder.Selected.id}`;
                } else if (!uploadFrom && !uploadTo && !uploadedBy && !tagWorkstream && !tagTask && !fileName) {
                    requestUrl += `&type=folder&folderId=null`;
                }
            }

            if (ActiveTab === "active" || ActiveTab === "sort") {
                requestUrl += `&folderId=null&type=document`;
            }

            if (ActiveTab === "archived") {
                requestUrl += `&isArchived=1`;
            } else {
                requestUrl += `&isArchived=0`;
            }
        }

        if (uploadFrom && uploadTo) {
            requestUrl += `&uploadFrom=${moment(uploadFrom).format("YYYY-MM-DD")}&uploadTo=${moment(uploadTo).format("YYYY-MM-DD")}`;
        }
        if (uploadedBy) {
            requestUrl += `&uploadedBy=${uploadedBy}`;
        }
        if (tagWorkstream) {
            requestUrl += `&workstream=${tagWorkstream}`;
        }
        if (tagTask) {
            requestUrl += `&task=${tagTask}`;
        }
        if (fileName) {
            requestUrl += `&fileName=${fileName}`;
        }
        if (searchComment) {
            requestUrl += `&comment=${searchComment}`
        }
        getData(`${requestUrl}`, {}, c => {
            const { result, count } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }

    render() {
        const { dispatch, document } = { ...this.props };
        const { Filter } = { ...document };

        const sortOptions = [{ id: "origin-asc", name: "A to Z" }, { id: "origin-desc", name: "Z to A" }, { id: 'dateAdded-desc', name: 'Newest to Oldest' }, { id: 'dateAdded-asc', name: 'Oldest to Newest' }];


        return (
            <div class="container-fluid filter mb20">
                <div class="row content-row">
                    <div class="col-md-12 col-sm-12 col-xs-12 pd0">
                        <div class="flex">
                            <div class="flex-row tab-row mb0">
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "active" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("active")}>
                                        Active Files
                                </a>
                                </div>
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "library" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("library")}>
                                        Library
                                </a>
                                </div>
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "sort" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("sort")}>
                                        Sort Files
                                </a>
                                </div>
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "trash" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("trash")}>
                                        Trash
                                </a>
                                </div>
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "archived" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("archived")}>
                                        Archived
                                </a>
                                </div>
                                <div class="flex-col">
                                    <a class={document.ActiveTab === "activities" && document.Loading === "" ? "btn btn-default btn-active" : "btn btn-default"} onClick={() => this.setDropDown("activities")}>
                                        Activities
                                </a>
                                </div>
                            </div>
                            <div class="button-action">
                                {(document.ActiveTab !== 'activities') && document.Loading === "" &&
                                    <div class="document-sort-by">
                                        <DropDown multiple={false} required={false} options={sortOptions} selected={Filter.sort} onChange={e => this.handleSearchFilter("sortBy", e.value)} label="Sort by:" />
                                    </div>
                                }
                                {document.ActiveTab !== "activities" && document.Loading === "" && (
                                    <input class="form-control mr10" type="text" value={Filter.searchComment} onChange={e => this.handleSearchFilter("searchComment", e.target.value)} placeholder="Search comment" style={{ width: '120px' }} />
                                )}
                                {document.ActiveTab !== "trash" && document.ActiveTab !== "archived" && document.ActiveTab !== "activities" && (
                                    <div style={{
                                        display: 'flex',
                                    }}>
                                        {
                                            document.Loading === "" && (
                                                <a class="btn btn-default mr10" onClick={() => dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Upload" })}>
                                                    <span>
                                                        <i class="fa fa-plus mr10" aria-hidden="true" />
                                                        Add New File
                                                    </span>
                                                </a>
                                            )
                                        }
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
                                    <a class="btn btn-default" data-toggle="modal" data-target="#deleteModal">
                                        <span>
                                            <i class="fa fa-trash fa-lg mr10" />
                                            Empty
                                                </span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }
}

export default withRouter(DocumentActionTab);
