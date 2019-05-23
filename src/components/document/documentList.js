import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, deleteData, getParameterByName } from '../../globalFunction';
import { connect } from "react-redux"
import { withRouter } from "react-router";
import DocumentSortFile from "./documentSortFile"
import DocumentActivities from "./documentActivities";
import moment from "moment";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
    }
})

class DocumentList extends React.Component {
    constructor(props) {
        super(props)
        this.fetchData = this.fetchData.bind(this);
    }

    async componentDidMount() {
        const { dispatch } = { ...this.props }
        this.fetchData(1)
        if (getParameterByName("file-id")) {
            const documentId = getParameterByName("file-id")
            getData(`/api/document/detail/${documentId}`, {}, (ret) => {
                const documentObj = { ...ret.data }
                getData(`/api/conversation/getConversationList?linkType=document&linkId=${documentObj.id}`, {}, (c) => {
                    dispatch({ type: 'SET_COMMENT_LIST', list: c.data.result })
                    dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: documentObj });
                    $(`#documentViewerModal`).modal('show')
                })
            })
        }
    }

    componentWillUnmount() {
        const { dispatch } = { ...this.props }
        dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
        dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
        dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder, match } = this.props;
        const projectId = match.params.projectId;
        const { ActiveTab } = { ...document };
        let requestUrl = `/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&starredUser=${loggedUser.data.id}`;
        if (ActiveTab === "trash") {
            requestUrl += `&isActive=0`
        } else {
            requestUrl += `&isActive=1`;
            if (typeof folder.Selected.id !== "undefined") {
                requestUrl += `&folderId=${folder.Selected.id}`;
            }

            if (ActiveTab === 'active' || status === 'sort') {
                requestUrl += `&type=document&folderId=null`;
            }

            if (ActiveTab === 'library') {
                requestUrl += `&folderId=null&type=folder`;
            }

            // if (tagWorkstream) {
            //     requestUrl += `&workstream=${tagWorkstream}`;
            // }

            if (ActiveTab === "archived") {
                requestUrl += `&isArchived=1`;
            } else {
                requestUrl += `&isArchived=0`;
            }
        }
        getData(requestUrl, {}, (c) => {
            const { count, result } = { ...c.data };
            let list = [];
            if (document.ActiveTab !== "trash" && document.ActiveTab !== "archived") {
                list = document.List.concat(result);
            } else {
                list = result;
            }
            dispatch({ type: 'SET_DOCUMENT_LIST', list: list, count: count });
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '' });
        });
    }

    async getFolderDocuments(data) {
        const { dispatch, loggedUser, folder, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedFolderName;

        if (data === "") {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
            await dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
            await dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
            await this.fetchData(1);
        } else if (folder.Selected.id !== data.id) {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }

                let hasFolder = true;
                let parentFolderId = data.id;
                while (hasFolder) {
                    let parentFolder = folderList.filter((e) => { return e.folderId == parentFolderId });
                    if (parentFolder.length > 0) {
                        folderList = folderList.filter((e) => { return e.folderId != parentFolderId });
                        parentFolderId = parentFolder[0].id;
                    } else {
                        hasFolder = false;
                    }
                }
                dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data })
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList });
            });
        }
    }

    getNextResult() {
        const { document, fetchWorkstreamDocument, match } = this.props;
        const projectId = match.params.projectId;
        if (match.url === `/projects/${projectId}/files` || match.url === `/projects/${projectId}`) {
            this.fetchData(document.Count.current_page + 1)
        } else {
            fetchWorkstreamDocument(document.Count.current_page + 1)
        }
    }

    moveTo(folderData, documentData) {
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            origin: documentData.origin,
            status: folderData.status,
            folderId: folderData.id,
            actionType: "moved",
            oldDocument: documentData.origin,
            newDocument: "",
            title: `${documentData.type === 'document' ? 'Document' : 'Folder'} moved to folder ${folderData.origin}`,
            projectId: projectId,
            usersId: loggedUser.data.id,
        };

        putData(`/api/document/${documentData.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data.result, Status: documentData.status })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("danger", "Updating failed. Please try again")
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
        })
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.New.length > 0) {
            const sortedDocument = _.orderBy(document.New, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: "SET_DOCUMENT_LIST", list: sortedDocument, DocumentType: 'New', Count: document.NewCount, CountType: 'NewCount' })
        }
    }

    viewDocument(data) {
        const { dispatch, loggedUser, folder, match, pageModal, document } = { ...this.props };
        const projectId = match.params.projectId;

        if (document.ActiveTab === "trash" || document.ActiveTab === 'archived') {
            return;
        }

        if (data.type !== 'folder') {
            $(`#documentViewerModal`).modal('show');
            if (data.document_read.length === 0) {
                const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 };
                postData(`/api/document/read`, dataToSubmit, (ret) => {
                    if (pageModal) {
                        switch (pageModal) {
                            case "project": {
                                window.location.href = `/account#/projects/${projectId}/files?file-id=${data.id}`;
                                location.reload();
                            }
                        }
                    } else {
                        getData(`/api/conversation/getConversationList?page=${1}&linkType=document&linkId=${data.id}`, {}, (c) => {
                            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: { ...data, document_read: [ret.data], isRead: 1 } });
                            dispatch({ type: 'UPDATE_DATA_DOCUMENT_LIST', UpdatedData: { ...data, document_read: [ret.data], isRead: 1 } });
                            dispatch({ type: 'SET_COMMENT_LIST', list: c.data.result, count: c.data.count });
                            dispatch({ type: 'SET_COMMENT_LOADING', Loading: "" });
                        })
                    }
                });

            } else {
                if (pageModal) {
                    switch (pageModal) {
                        case "project": {
                            window.location.href = `/account#/projects/${projectId}/files?file-id=${data.id}`;
                            location.reload();
                        }
                    }
                } else {
                    getData(`/api/conversation/getConversationList?page=${1}&linkType=document&linkId=${data.id}`, {}, (c) => {
                        dispatch({ type: 'SET_COMMENT_LIST', list: c.data.result, count: c.data.count });
                        dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
                        dispatch({ type: 'SET_COMMENT_LOADING', Loading: "" })
                    })
                }
            }
        } else {
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING' });
            getData(`/api/document?isArchived=0&isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: result, count: count });
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' });
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data });
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedFolderName.concat([data]) });
                }
            });
        }
    }

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${projectId}&document=${origin}`, {
            linkType: "document",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedDocumentList = _.map([...document.List], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, count: document.Count });
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    createFolder() {
        const { dispatch, folder } = { ...this.props }
        dispatch({ type: 'SET_SELECTED_FOLDER', Selected: { folderId: folder.Selected.id } })
    }

    downloadDocument(data) {
        if (data.type === 'document') {
            window.open(encodeURI(`/api/downloadDocument?fileName=${data.name}&origin=${data.origin}`));
        } else {
            window.open(encodeURI(`/api/downloadFolder?folder=${data.id}&folderName=${`${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`}`));
        }
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        const newData = { ...data, workstreamId: data.tagWorkstream };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...newData, oldDocument: type === 'tags' ? data.tagWorkstream.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    duplicateDocument(data) {
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            DocumentToSave: [{ name: data.name, origin: data.origin, project: projectId, uploadedBy: loggedUser.data.id, status: data.status, type: data.type }],
            projectId: projectId,
            tagWorkstream: data.tagWorkstream,
            tagTask: data.tagTask,
            tagNote: data.tagNote
        };
        postData(`/api/document?isDuplicate=true`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", list: c.data.result });
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    readDocument(data, action) {
        const { dispatch, loggedUser } = this.props;
        const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 }
        if (action === "read") {
            postData(`/api/document/read`, dataToSubmit, (c) => {
                const documentObj = { ...data, isRead: 1, document_read: [c.data] }
                dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: documentObj });
                showToast('success', 'Document successfully mark as read.');
            })
        } else {
            deleteData(`/api/document/read/${data.id}?usersId=${loggedUser.data.id}&documentId=${data.id}`, {}, (c) => {
                const documentObj = { ...data, isRead: 0, document_read: [] }
                dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: documentObj });
                showToast('success', 'Document successfully mark as unread.');
            })
        }
    }

    moveTo(folderObj, documentObj) {
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;
        const dataToSubmit = {
            origin: documentObj.origin,
            folderId: folderObj.id,
            projectId: projectId,
            usersId: loggedUser.data.id,
        };

        putData(`/api/document/${documentObj.id}`, dataToSubmit, (c) => {
            const { result } = { ...c.data }
            dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: result })
            showToast("success", "Successfully Updated.")
        })
    }

    restore(data) {
        const { dispatch, document, match, loggedUser } = { ...this.props };
        const { ActiveTab } = { ...document };
        const { last_page, current_page } = { ...document.Count };
        const projectId = match.params.projectId;
        const title = `restored a ${data.type}`;
        let dataToSubmit = {};

        if (ActiveTab === "trash") {
            dataToSubmit = {
                isActive: 1, projectId: projectId,
                actionType: "restored", title: title,
                usersId: loggedUser.data.id,
                newDocument: data.origin

            }
        } else if (ActiveTab === "archived") {
            dataToSubmit = {
                isArchived: 0, projectId: projectId,
                actionType: "restored", title: title,
                usersId: loggedUser.data.id,
                newDocument: data.origin
            }
        }

        putData(`/api/document/${data.id}`, dataToSubmit, (c) => {
            const { result } = { ...c.data }
            if (last_page > current_page && document.List.length < 10) {
                this.fetchData(1)
            } else {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: result });
            }
            showToast("success", `Successfully restored to ${data.folderId === null && data.type === "document" ? 'active files' : 'library'}.`);
        })
    }

    render() {
        const { dispatch, document, folder, match } = { ...this.props };
        const { Count } = { ...document };
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;
        let tagCount = 0;
        return (
            <div>
                {(document.ActiveTab !== 'sort' && document.ActiveTab !== "activities") &&
                    <div>
                        <div class="card-header">
                            {(document.ActiveTab === 'library' && document.Loading === "") &&
                                <div class='mt20'>
                                    <h4><a href="javascript:void(0)" onClick={() => this.getFolderDocuments("")}>All Files</a></h4>
                                    {(folder.SelectedFolderName.length > 0) &&
                                        folder.SelectedFolderName.map((e, index) => {
                                            const fName = e.documentNameCount > 0 ? `${e.origin}(${e.documentNameCount})` : e.origin;
                                            return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {fName}</a> </span>
                                        })
                                    }
                                </div>
                            }
                        </div>
                        <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}>
                            <div class="card-body m0">
                                <div>
                                    {
                                        ((document.List).length > 0) && <table class="table-document">
                                            <thead>
                                                <tr>
                                                    <th scope="col" class="td-left" >File Name</th>
                                                    <th scope="col">Uploaded By</th>
                                                    <th scope="col">Upload Date</th>
                                                    <th scope="col">Workstream</th>
                                                    <th scope="col">Task</th>
                                                    <th scope="col">Read On</th>
                                                    {(match.path === "/projects/:projectId/files") && <th scope="col">Actions</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {document.Loading === "" &&
                                                    _.orderBy(document.List, ['dateAdded'], ['desc']).map((data, index) => {
                                                        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
                                                        return (
                                                            <tr key={index}>
                                                                <td class="document-name">
                                                                    <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                                                        {data.type === "folder" && <span class="fa fa-folder fa-lg read mr10"></span>}
                                                                        {data.type === "folder" && <span class="read">{documentName}</span>}
                                                                        {data.type === "document" && < span class={data.isRead ? 'read' : 'unread'}>{documentName}</span>}
                                                                    </a>
                                                                </td>
                                                                <td>
                                                                    <div class="display-flex">
                                                                        <div class="thumbnail-profile">
                                                                            <span title={data.user.firstName + " " + data.user.lastName}>
                                                                                <img src={data.user.avatar} alt="Profile Picture" class="img-responsive" />
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>{moment(data.dateAdded).format("MMMM DD, YYYY")}</td>
                                                                <td>{
                                                                    data.tagWorkstream.length > 0 &&
                                                                    data.tagWorkstream.map((t, tIndex) => {
                                                                        return <p class="m0" key={tIndex}>{t.label}</p>
                                                                    })
                                                                }
                                                                </td>
                                                                <td>{
                                                                    data.tagTask.length > 0 &&
                                                                    data.tagTask.map((t, tIndex) => {
                                                                        return <p class="m0" key={tIndex}>{t.label}</p>
                                                                    })
                                                                }
                                                                </td>
                                                                <td>{data.isRead ? moment(data.document_read[0].dateUpdated).format("MMMM DD, YYYY") : ''}</td>
                                                                {
                                                                    (match.path === "/projects/:projectId/files" && document.ActiveTab !== "trash" && document.ActiveTab !== "archived") &&
                                                                    <td>
                                                                        <a href="javascript:void(0)"
                                                                            onClick={() => this.downloadDocument(data)}
                                                                            class="btn btn-action">
                                                                            <span class="fa fa-download" title="DOWNLOAD"></span>
                                                                        </a>
                                                                        <a href="javascript:void(0)"
                                                                            data-toggle="modal"
                                                                            data-target={`${data.isArchived ? "" : "#archiveModal"}`}
                                                                            onClick={(e) => { data.isArchived ? e.preventDefault() : dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data }) }}
                                                                            class="btn btn-action">
                                                                            <span class={`fa fa-archive ${data.isArchived ? "text-cyan" : ""}`} title="ARCHIVE">
                                                                            </span>
                                                                        </a>
                                                                        <a href="javascript:void(0)"
                                                                            data-toggle="modal"
                                                                            data-target="#deleteModal"
                                                                            onClick={() => dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data })}
                                                                            class="btn btn-action">
                                                                            <span class="fa fa-trash" title="DELETE"></span>
                                                                        </a>
                                                                        <a class="btn btn-action dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                                                            <span ><i class="fa fa-ellipsis-v"></i></span>
                                                                        </a>
                                                                        <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">

                                                                            {(data.type != 'folder') &&
                                                                                <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.duplicateDocument(data)}>Duplicate</a></li>
                                                                            }
                                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "rename")}>Rename</a></li>
                                                                            <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                                                            <li>
                                                                                <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                                                                    {data.isStarred ? 'Unstarred' : 'Star'}
                                                                                </a>
                                                                            </li>
                                                                            <li><a href="javascript:void(0)" data-tip="View" onClick={() => this.viewDocument(data)}>View</a></li>

                                                                            {data.type === "document" &&
                                                                                <li>
                                                                                    {
                                                                                        (data.isRead > 0)
                                                                                            ? <a href="javascript:void(0)" data-tip="View" onClick={() => this.readDocument(data, "unread")}>Mark as unread</a>
                                                                                            : <a href="javascript:void(0)" data-tip="View" onClick={() => this.readDocument(data, "read")}>Mark as read</a>
                                                                                    }
                                                                                </li>
                                                                            }
                                                                            {document.ActiveTab === "library" &&
                                                                                <li>
                                                                                    <a class=" dropdown dropdown-library">
                                                                                        Move to
                                                                                    <div class="dropdown-content dropdown-menu-right">
                                                                                            {folder.SelectList.map((e, fIndex) => {
                                                                                                if (e.id !== data.id) {

                                                                                                    if (typeof folder.Selected.id !== "undefined") {
                                                                                                        if (e.id !== folder.Selected.id) {
                                                                                                            return (
                                                                                                                <span key={fIndex} onClick={() => this.moveTo(e, data)}>{e.name}</span>
                                                                                                            )
                                                                                                        }
                                                                                                    } else {
                                                                                                        return (
                                                                                                            <span key={fIndex} onClick={() => this.moveTo(e, data)}>{e.name}</span>
                                                                                                        )
                                                                                                    }
                                                                                                }
                                                                                            })}
                                                                                        </div>
                                                                                    </a>
                                                                                </li>
                                                                            }
                                                                        </ul>
                                                                    </td>
                                                                }
                                                                {
                                                                    (document.ActiveTab === "trash" || document.ActiveTab === "archived") &&
                                                                    <td>
                                                                        <a href="javascript:void(0)"
                                                                            onClick={() => this.restore(data)}
                                                                            class="btn btn-action">
                                                                            <span class="fa fa-undo" title="RESTORE"></span>
                                                                        </a>
                                                                    </td>
                                                                }
                                                            </tr>
                                                        )

                                                    })
                                                }
                                            </tbody>
                                        </table>
                                    }
                                    {
                                        ((currentPage != lastPage) && document.List.length > 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Documents</a></p>
                                    }
                                    {
                                        (document.Loading == "RETRIEVING" && (document.List).length > 0) && <Loading />
                                    }
                                    {
                                        (document.List.length === 0 && document.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                }
                {
                    (document.ActiveTab) === 'sort' && <DocumentSortFile />
                }
                {
                    (document.ActiveTab) === "activities" && <DocumentActivities />
                }
            </div>
        )
    }
}

export default withRouter(DocumentList);