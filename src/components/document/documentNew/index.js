import React from "react";

import { DropDown, Loading } from "../../../globalComponents"
import { deleteData, displayDate, getData, postData, putData, showToast } from '../../../globalFunction'
import { connect } from "react-redux"

@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        users: store.users,
        settings: store.settings,
        starred: store.starred,
        global: store.global,
        task: store.task,
        projectData: store.project,
        folder: store.folder

    }
})

export default class DocumentNew extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
            upload: false,
            loading: false,
            tags: [],
            files: [],
            folderAction: "",
            selectedFilter: 0,
            order: 'asc',
            selectedFolderName: []
        }
        this.fetchData = this.fetchData.bind(this);
        this.starredDocument = this.starredDocument.bind(this);
    }

    componentDidMount() {
        let { document } = this.props;
        // automatically move to selected folder
        if (folderParams != "" && folderParamsType == "new") {
            let folderSelectedInterval = setInterval(() => {
                if (this.props.folder.List.length > 0) {
                    clearInterval(folderSelectedInterval)
                    let folderData = this.props.folder.List.filter(e => e.id == folderParams)
                    if (folderData.length > 0) {
                        this.props.dispatch({ type: "SET_NEW_FOLDER_SELECTED", Selected: folderData[0] })
                    }
                }
            }, 1000)
        }
        if (_.isEmpty(document.NewCount.Count)) {
            this.fetchData(1)
        }
    }

    addFolder() {
        let { loggedUser, folder, dispatch } = this.props;
        let { folderName } = this.state;
        let dataToSubmit = [
            {
                name: folderName,
                projectId: project,
                origin: folderName,
                createdBy: loggedUser.data.id,
                type: "folder",
                folderId: folder.SelectedNewFolder.id,
                project: project,
                uploadedBy: loggedUser.data.id,
                status: 'new'
            }
        ];

        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
            this.setState({ folderAction: "", folderName: "" });
        })
    }

    deleteDocument(data) {
        let { dispatch, loggedUser } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${data.id}`, { isDeleted: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: project, type: data.type, actionType: "deleted", title: 'Document deleted' }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", DocumentType: 'New', Id: data.id })
                    dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            })
        }
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
    }

    duplicateDocument(data) {
        const { dispatch, document, loggedUser } = this.props;
        const dataToSubmit = [{ name: data.name, origin: data.origin, project: project, uploadedBy: loggedUser.data.id, status: data.status, tags: JSON.stringify(data.tags), type: 'document' }]
        postData(`/api/document?isDuplicate=true`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                if (data.status == 'new') {
                    dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: document.NewUploadCount + 1 })
                }
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    downloadFolder(folder) {
        let { document } = this.props;
        let fileList = [];
        document.List.filter(e => {
            if (e.folderId == folder.id) {
                fileList.push({ origin: e.origin, name: e.name })
            }
        })
        window.open(encodeURI(`/api/downloadFolder?data=${JSON.stringify(fileList)}&folderName=${folder.name}`));
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        const newData = { ...data, tags: data.tags };

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...newData, oldDocument: type === 'tags' ? data.tags.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    fetchData(page) {
        const { dispatch, loggedUser, document, folder } = this.props;
        let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=new&folderId=${folder.SelectedNewFolder.id}&starredUser=${loggedUser.data.id}`;
        const { search, tags, uploadedBy, isCompleted, members, uploadFrom, uploadTo } = document.Filter;
        if (typeof isCompleted !== 'undefined' && isCompleted !== '') {
            requestUrl += `&isCompleted=${isCompleted}`
        }
        if (typeof search !== 'undefined' && search !== '') {
            requestUrl += `&search=${search}`
        }
        if (typeof tags !== 'undefined') {
            _.filter(tags, (t) => {
                const tagType = t.value.split('-')[0];
                const tagId = t.value.split('-')[1];
                if (tagType === 'workstream') {
                    requestUrl += `&workstream=${tagId}`
                }
            })
        }
        if (typeof uploadedBy !== 'undefined' && uploadedBy !== '') {
            requestUrl += `&uploadedBy=${uploadedBy}`
        }
        if (typeof members !== 'undefined' && members !== '') {
            _.map(members, (e) => {
                requestUrl += `&members=${e.value}`
            })
        }
        if (typeof uploadFrom !== 'undefiend' && uploadFrom !== '') {
            requestUrl += `&uploadFrom=${uploadFrom}`
        }
        if (typeof uploadTo !== 'undefiend' && uploadTo !== '') {
            requestUrl += `&uploadTo=${uploadTo}`
        }

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", list: document.New.concat(c.data.result), DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                dispatch({ type: "SET_FOLDER_LIST", list: c.data.result })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                showToast('success', 'Documents successfully retrieved.')
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    getFolderDocuments(data) {
        const { dispatch, loggedUser, folder } = this.props;
        let folderList = folder.SelectedNewFolderName
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedNewFolder' })

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
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList, Type: 'SelectedNewFolderName' });
                showToast('success', 'Documents successfully retrieved.');
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    getNextResult() {
        let { document, dispatch } = this.props;
        this.fetchData(document.NewCount.Count.current_page + 1)
    }

    moveToLibrary(data) {
        const { dispatch, document, loggedUser } = this.props;
        const dataToSubmit = {
            id: data.id,
            status: "library",
            actionType: "moved",
            oldDocument: data.origin,
            newDocument: "",
            title: "Document moved to library",
            projectId: project,
            usersId: loggedUser.data.id
        }
        putData(`/api/document/${data.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data.result, Status: data.status })
                dispatch({ type: "MOVE_DOCUMENT_TO_LIBRARY", UpdatedData: c.data.result })
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: document.NewUploadCount - 1 })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("error", "Updating failed. Please try again.")
            }
        })
    }

    moveTo(folderData, documentData) {
        let { dispatch, loggedUser } = this.props;
        let dataToSubmit = {
            status: folderData.status,
            folderId: folderData.id,
            actionType: "moved",
            oldDocument: documentData.origin,
            newDocument: "",
            title: `${documentData.type === 'document' ? 'Document' : 'Folder'} moved to folder ${folderData.origin}`,
            projectId: project,
            usersId: loggedUser.data.id
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

    starredDocument({ id, isStarred, origin }) {
        const { document, loggedUser, dispatch } = this.props;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${project}&document=${origin}`, {
            linkType: "document",
            linkId: id,
            usersId: loggedUser.data.id
        }, (c) => {
            if (c.status == 200) {
                const updatedDocumentList = _.map([...document.New], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.documentActivityLog })
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    viewDocument(data) {
        const { dispatch, loggedUser, folder } = this.props;
        if (data.type !== 'folder') {
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
        } else {
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' })
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedNewFolder' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedNewFolderName.concat([data]), Type: 'SelectedNewFolderName' })
                    showToast('success', 'Documents successfully retrieved.')
                }
            });
        }
    }

    render() {
        let { document, starred, dispatch, loggedUser, folder } = this.props
        let tagCount = 0;
        const currentPage = (typeof document.NewCount.Count.current_page != "undefined") ? document.NewCount.Count.current_page : 1;
        const lastPage = (typeof document.NewCount.Count.last_page != "undefined") ? document.NewCount.Count.last_page : 1;

        return <div>
            <br />
            <div class="col-lg-12 col-md-12">
                <h3>
                    <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>New Documents</a>
                    {folder.SelectedNewFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })}
                </h3>

                {(this.state.folderAction == "") &&
                    <div class="row mb10">
                        <div class="col-lg-2">
                            <div class="col-md-4 mb5">
                                <div class="mt20">
                                    <a href="javascript:void(0)" title="New Folder" style={{ textDecoration: "none" }} onClick={() => this.setState({ folderAction: "create" })}><span class="fa fa-folder fa-3x"></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                }

                {(this.state.folderAction == "create") &&
                    <form class="form-inline">
                        <div class="form-group">
                            <input class="form-control" type="text" name="folderName" placeholder="Enter folder name" onChange={(e) => this.setState({ [e.target.name]: e.target.value })} value={this.state.folderName} />
                            <a href="javascript:void(0)" class="btn btn-primary" style={{ margin: "5px" }} onClick={() => this.addFolder()}>Add</a>
                            <a href="javascript:void(0)" class="btn btn-primary" style={{ margin: "5px" }} onClick={() => this.setState({ folderAction: "" })}>Cancel</a>
                        </div>
                    </form>
                }
                <table id="dataTable" class="table responsive-table table-bordered document-table" ref={el => (this.componentRef = el)}>
                    <tbody>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('dateAdded')}>Uploaded</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                        {(document.NewDocumentLoading != "RETRIEVING") &&
                            document.New.map((data, index) => {
                                let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
                                return (
                                    <tr key={index}>
                                        <td>
                                            <input type="checkbox" style={{ width: 'auto' }} />
                                        </td>
                                        <td>
                                            <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                                <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                                            </a>
                                        </td>
                                        <td><span class={data.type !== "folder" ? 'glyphicon glyphicon-file' : 'fa fa-folder'}></span></td>
                                        <td class="new-document"> <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>{documentName}</a></td>
                                        <td>{displayDate(data.dateAdded)}</td>
                                        <td>{data.user.emailAddress}</td>
                                        <td>
                                            {(data.tags.length > 0) &&
                                                data.tags.map((t, tIndex) => {
                                                    tagCount += t.label.length
                                                    let tempCount = tagCount;
                                                    if (tagCount > 16) { tagCount = 0 }
                                                    return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                                })
                                            }
                                        </td>
                                        <td>
                                            <div class="dropdown">
                                                <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                    {(loggedUser.data.userType == "Internal") &&
                                                        <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={() => dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })}>Share</a></li>
                                                    }
                                                    <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(data)}>Download</a></li>
                                                    {(data.type != 'folder') &&
                                                        <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.duplicateDocument(data)}>Duplicate</a></li>
                                                    }
                                                    <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "rename")}>Rename</a></li>
                                                    <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                                    <li>{starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                        ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={() => this.starDocument(data, 1)}>Unstarred</a>
                                                        : <a href="javascript:void(0)" data-tip="Star" onClick={() => this.starDocument(data, 0)}>Star</a>
                                                    }
                                                    </li>
                                                    <li class="dropdown dropdown-library">
                                                        <span class="test" style={{ marginLeft: "20px", color: "#333", lineHeight: "1.42857143", cursor: "pointer" }}>Move to</span>
                                                        <div class="dropdown-content">
                                                            {(loggedUser.data.userRole != 6) &&
                                                                <a href="javascript:void(0)" style={{ textDecoration: "none" }} data-tip="Move to library" onClick={() => this.moveToLibrary(data)}>Move to library</a>
                                                            }
                                                            {
                                                                _.filter(document.New, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                                                    let folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                                                    return (
                                                                        <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveTo(f, data)}>{folderName}</a>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </li>

                                                    <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data)}>Delete</a></li>
                                                    <li><a href="javascript:void(0)" data-tip="View" onClick={() => this.viewDocument(data)}>View</a></li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
                <div class="text-center">
                    {
                        ((currentPage != lastPage) && document.New.length > 0 && document.NewDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                    }
                    {
                        (document.New.length == 0 && document.NewDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (document.NewDocumentLoading == "RETRIEVING") && <Loading />
                }
            </div>
        </div>
    }
}