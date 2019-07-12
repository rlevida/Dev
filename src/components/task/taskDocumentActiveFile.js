import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData } from "../../globalFunction";
import { withRouter } from "react-router";
import { Loading } from "../../globalComponents";

@connect(store => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        document: store.document,
        task: store.task,
        folder: store.folder
    };
})
class TaskActiveFile extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            list: []
        };
    }

    componentDidMount() {
        this.fetchData(1);
    }

    componentDidUpdate(prevProps) {
        const { dispatch } = { ...this.props };
        if (prevProps.document.uploadType !== this.props.document.uploadType) {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            this.fetchData(1);
        }
    }

    fetchData(page) {
        const { loggedUser, task, dispatch, document } = this.props;
        let requestUrl = "";
        if (document.uploadType === "active") {
            requestUrl = `/api/document/getFiles?&isArchived=0&isDeleted=0&projectId=${task.Selected.projectId}&linkType=task&linkId=${task.Selected.id}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${
                loggedUser.data.id
            }&isActive=1&t&&tagType=document&folderId=null&type=document`;
        } else {
            requestUrl = `/api/document?isDeleted=0&linkId=${task.Selected.projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${
                loggedUser.data.id
            }&folderId=null&type=folder&isActive=1&isDeleted=0`;
        }

        getData(requestUrl, {}, c => {
            const { result } = { ...c.data };
            dispatch({ type: "SET_DOCUMENT_LIST", list: result });
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "" });
        });
    }

    handleCheckbox(id, isChecked) {
        const { dispatch, document } = { ...this.props };
        const updateList = document.List.map(e => {
            if (id === e.id) {
                return { ...e, isChecked: !isChecked };
            } else {
                return e;
            }
        });
        dispatch({ type: "SET_DOCUMENT_LIST", list: updateList });
    }

    viewDocument(data) {
        const { dispatch, loggedUser, folder, document, task } = { ...this.props };

        if (document.ActiveTab === "trash" || document.ActiveTab === "archived") {
            return;
        }

        if (data.type !== "folder") {
            this.handleCheckbox(data.id, data.isChecked);
        } else {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "RETRIEVING" });
            getData(
                `/api/document?isArchived=0&isActive=1&isDeleted=0&linkId=${task.Selected.projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`,
                {},
                c => {
                    const { result, count } = { ...c.data };
                    if (c.status == 200) {
                        dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: "NewDocumentLoading" });
                        dispatch({ type: "SET_FOLDER_SELECTED", Selected: data });
                        dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: folder.SelectedFolderName.concat([data]) });
                        this.fetchFolderSelectList(data.id);
                    }
                }
            );
        }
    }

    fetchFolderSelectList(folderId) {
        const { dispatch, loggedUser, match, task } = { ...this.props };

        let requestUrl = `/api/document?page=1&isDeleted=0&linkId=${task.Selected.projectId}&linkType=project&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${
            loggedUser.data.id
        }&type=folder&isActive=1&isDeleted=0&folderId=${folderId}`;

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

    async getFolderDocuments(data) {
        const { dispatch, loggedUser, folder, task } = this.props;
        let folderList = folder.SelectedFolderName;

        if (data === "") {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
            await dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
            await dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
            await this.fetchData(1);
        } else if (folder.Selected.id !== data.id) {
            getData(
                `/api/document?isDeleted=0&linkId=${task.Selected.projectId}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== "undefined" ? data.id : null}&starredUser=${
                    loggedUser.data.id
                }`,
                {},
                c => {
                    const { result, count } = { ...c.data };

                    let hasFolder = true;
                    let parentFolderId = data.id;
                    while (hasFolder) {
                        let parentFolder = folderList.filter(e => {
                            return e.folderId == parentFolderId;
                        });
                        if (parentFolder.length > 0) {
                            folderList = folderList.filter(e => {
                                return e.folderId != parentFolderId;
                            });
                            parentFolderId = parentFolder[0].id;
                        } else {
                            hasFolder = false;
                        }
                    }
                    dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                    dispatch({ type: "SET_FOLDER_SELECTED", Selected: data });
                    dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: folderList });
                }
            );
        }
    }

    render() {
        const { document, folder, task } = { ...this.props };
        const documentList = document.List.filter(e => {
            return !_.find(e.tagTask, { value: task.Selected.id }) || e.type === "folder";
        });
        return (
            <div>
                <div class="card-header">
                    {document.uploadType === "library" && (
                        <div class="mt20">
                            <a href="javascript:void(0)" style={{ color: "#818181", textDecoration: "none" }} onClick={() => this.getFolderDocuments("")}>
                                All Files
                            </a>
                            {folder.SelectedFolderName.length > 0 &&
                                folder.SelectedFolderName.map((e, index) => {
                                    const fName = e.documentNameCount > 0 ? `${e.origin}(${e.documentNameCount})` : e.origin;
                                    return (
                                        <span key={index}>
                                            <i class="fa fa-angle-right mr5 ml5" />
                                            <a href="javascript:void(0)" style={{ color: "#818181", textDecoration: "none" }} onClick={() => this.getFolderDocuments(e)}>
                                                {fName}
                                            </a>
                                        </span>
                                    );
                                })}
                        </div>
                    )}
                </div>
                <table class="table-document mb10">
                    <thead>
                        <tr class="text-left">
                            <th scope="col" colSpan="2">
                                File Name
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {documentList.map((data, index) => {
                            const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`;
                            return (
                                <tr key={index}>
                                    <td class="document-name display-flex" colSpan="2">
                                        {data.type === "document" && (
                                            <label class="custom-checkbox mr10">
                                                <input
                                                    type="checkbox"
                                                    checked={data.isChecked}
                                                    onClick={f => {
                                                        this.handleCheckbox(data.id, data.isChecked);
                                                    }}
                                                />
                                                <span class="checkmark" />
                                            </label>
                                        )}
                                        <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                            {data.type === "folder" && <span class="fa fa-folder fa-lg read mr10" />}
                                            {data.type === "folder" && <span class="read">{documentName}</span>}
                                            {data.type === "document" && <span class="read">{documentName}</span>}
                                        </a>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {document.Loading == "RETRIEVING" && documentList.length > 0 && <Loading />}
                {documentList.length === 0 && document.Loading != "RETRIEVING" && (
                    <p class="mb0 text-center">
                        <strong>No Records Found</strong>
                    </p>
                )}
            </div>
        );
    }
}

export default withRouter(TaskActiveFile);
