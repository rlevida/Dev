import React from "react";
import moment from 'moment'
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DropDown, Loading } from "../../../globalComponents"
import { deleteData, displayDate, getData, postData, putData, removeTempFile, showToast } from '../../../globalFunction'
import Tooltip from "react-tooltip";
import PrintComponent from "../print"

import { connect } from "react-redux"

@DragDropContext(HTML5Backend)

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


export default class DocumentLibrary extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData: [],
            upload: false,
            loading: false,
            tags: [],
            files: [],
            folderAction: "",
            folderName: "",
            selectedFilter: 0,
            order: 'asc',
            selectedFolderName: []
        }
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { document } = this.props;
        // automatically move to selected folder
        if (folderParams != "" && folderParamsType == "library") {
            let folderSelectedInterval = setInterval(() => {
                if (this.props.folder.List.length > 0) {
                    clearInterval(folderSelectedInterval)
                    let folderData = this.props.folder.List.filter(e => e.id == folderParams)
                    if (folderData.length > 0) {
                        this.props.dispatch({ type: "SET_LIBRARY_FOLDER_SELECTED", Selected: folderData[0] })
                    }
                }
            }, 1000)
        }
        if (_.isEmpty(document.LibraryCount.Count)) {
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
                folderId: folder.SelectedLibraryFolder.id,
                project: project,
                uploadedBy: loggedUser.data.id,
                status: 'library'
            }
        ];

        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data, DocumentType: 'Library' });
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
            this.setState({ folderAction: "", folderName: "" });
        })
    }

    deleteDocument(id) {
        let { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${id}`, { isDeleted: 1 }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", DocumentType: 'Library', Id: id })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            })
        }
    }

    deleteFolder(id) {
        let { dispatch } = this.props;
        if (confirm("Do you really want to delete this folder?")) {
            deleteData(`/api/folder/${id}`, { projectId: project }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_FOLDER_LIST", id: id })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("danger", "Delete failed. Please try again.");
                }
            })
        }
    }

    downloadDocument(document) {
        window.open(encodeURI(`/api/downloadDocument?fileName=${document.name}&origin=${document.origin}`));
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

    duplicateDocument(data) {
        const { dispatch, document, loggedUser } = this.props;
        const dataToSubmit = [{ name: data.name, origin: data.origin, project: project, uploadedBy: loggedUser.data.id, status: data.status, tags: JSON.stringify(data.tags), type: 'document' }]
        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data, DocumentType: 'Library' });
                if (data.status == 'new') {
                    dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: document.NewUploadCount + 1 })
                }
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    editDocument(data, type) {
        let { dispatch } = this.props;
        let newData = { ...data }, tempTags = [];

        newData = { ...data, tags: JSON.stringify(data.tags) }

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: newData });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type })
        $(`#editModal`).modal('show');
    }

    editFolder(data, type) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type })
    }

    fetchData(page) {
        const { dispatch, document, loggedUser } = this.props;
        let requestUrl = `/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${page}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&status=library`;

        if (typeof document.Filter.isCompleted !== 'undefined' && document.Filter.isCompleted !== '') {
            requestUrl += `&isCompleted=${document.Filter.isCompleted}`
        }
        if (typeof document.Filter.search !== 'undefined' && document.Filter.search !== '') {
            requestUrl += `&search=${document.Filter.search}`
        }
        if (typeof document.Filter.tags !== 'undefined') {
            _.filter(document.Filter.tags, (t) => {
                const tagType = t.value.split('-')[0];
                const tagId = t.value.split('-')[1];
                if (tagType === 'workstream') {
                    requestUrl += `&workstream=${tagId}`
                }
            })
        }
        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", List: document.Library.concat(c.data.result), DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })

                showToast('success', 'Documents successfully retrieved.');
            } else {
                showToast('error', 'Something went wrong!');
            }
        });
    }

    getFolderDocuments(data) {
        const { dispatch, loggedUser, folder } = this.props;
        let folderList = folder.SelectedLibraryFolderName
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: 'SET_DOCUMENT_LIST', List: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedLibraryFolder' })

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
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList, Type: 'SelectedLibraryFolderName' });
                showToast('success', 'Documents successfully retrieved.');
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    getNextResult() {
        let { document, dispatch } = this.props;
        this.fetchData(document.LibraryCount.Count.current_page + 1)
    }

    moveTo(folderData, documentData) {
        let { dispatch } = this.props;
        let dataToSubmit = { ...documentData, status: folderData.status, folderId: folderData.id };
        putData(`/api/document/${documentData.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data, Status: documentData.status })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("danger", "Updating failed. Please try again")
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
        })
    }

    libraryDocumentFilter(e) {
        let { dispatch, loggedUser } = this.props;
        let isCompleted = 0
        if (e.value != 0) {
            isCompleted = e.value == 1 ? 1 : 0;
        }
        dispatch({ type: "SET_LIBRARY_DOCUMENT_LOADING", Loading: "RETRIEVING" })
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&isCompleted=${isCompleted}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIBRARY_LIST", list: c.data.result, count: { Count: c.data.count } })
                dispatch({ type: "SET_LIBRARY_DOCUMENT_LOADING", Loading: "" })
                this.setState({ selectedFilter: e.value })
            }
        });
    }

    sortDocument(type) {
        const { dispatch, document } = this.props;
        const { order } = this.state;
        if (document.Library.length > 0) {
            const sortedDocument = _.orderBy(document.Library, [`${type}`], [`${order == 'asc' ? 'desc' : 'asc'}`]).map((e) => { return e })
            this.setState({
                ...this.state,
                order: order == 'asc' ? 'desc' : 'asc'
            })
            dispatch({ type: "SET_DOCUMENT_LIST", List: sortedDocument, DocumentType: 'Library', Count: document.LibraryCount, CountType: 'LibraryCount' })
        }
    }

    starDocument(data, isStarred) {
        let { starred, loggedUser, dispatch } = this.props;
        if (isStarred) {
            let id = starred.List.filter(s => { return s.linkId == data.id })[0].id
            deleteData(`/api/starred/${id}`, {}, (c) => {
                dispatch({ type: "REMOVE_DELETED_STARRED_LIST", id: data.id })
            })
        } else {
            let dataToSubmit = { usersId: loggedUser.data.id, linkType: "project", linkId: data.id }
            postData(`/api/starred/`, dataToSubmit, (c) => {
                dispatch({ type: "ADD_STARRED_LIST", list: c.data })
            })
        }
    }

    viewDocument(data) {
        let { dispatch, loggedUser, folder } = this.props;
        if (data.type !== 'folder') {
            dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: "DocumentViewer" });
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
        } else {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'SET_DOCUMENT_LIST', List: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedLibraryFolder' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedLibraryFolderName.concat([data]), Type: 'SelectedLibraryFolderName' })
                    showToast('success', 'Documents successfully retrieved.')
                }
            });
        }
    }

    render() {
        let { document, starred, global, folder, dispatch, loggedUser } = this.props;
        let tagCount = 0
        const currentPage = (typeof document.LibraryCount.Count.current_page != "undefined") ? document.LibraryCount.Count.current_page : 1;
        const lastPage = (typeof document.LibraryCount.Count.last_page != "undefined") ? document.LibraryCount.Count.last_page : 1;
        return <div>
            <div class="col-lg-12 col-md-12">
                <h3>
                    <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>Library</a>
                    {folder.SelectedLibraryFolderName.map((e, index) => { return <span key={index}> > <a href="javascript:void(0)" onClick={() => this.getFolderDocuments(e)}> {e.name}</a> </span> })}
                </h3>

                {(this.state.folderAction == "") &&
                    <form >
                        <div class="form-group">
                            <div class="col-lg-1 col-md-1 col-sm-1">
                                <a href="javascript:void(0)" title="New Folder" style={{ textDecoration: "none" }} onClick={() => this.setState({ folderAction: "create" })}><span class="fa fa-folder fa-3x"></span></a>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="col-lg-2 col-md-2 col-sm-2">
                                <DropDown
                                    multiple={false}
                                    required={false}
                                    options={[{ id: 0, name: "All" }, { id: 1, name: "Completed" }, { id: 2, name: "Uncompleted" }]}
                                    selected={this.state.selectedFilter}
                                    onChange={(e) => this.libraryDocumentFilter(e)} />
                            </div>
                        </div>
                    </form>
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
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i> <a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('dateUpdated')}>Modified</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Members</th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>Tags</th>
                            <th></th>
                        </tr>

                        {(document.LibraryDocumentLoading != "RETRIEVING") &&
                            document.Library.map((data, index) => {
                                const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`;
                                let documentMembers = data.members;
                                if (typeof global.SelectList.projectMemberList != 'undefined') {
                                    documentMembers = _.uniqBy(documentMembers.concat(global.SelectList.projectMemberList.filter((e) => { return e.userType == 'Internal' })), 'id')
                                }
                                return (
                                    // <LibraryDocument key={index} data={data} handleDrop={(id) => this.moveItem(id ,"document")} documentToMove={(data)=> this.documentToMove(data)} docType="document"/>
                                    <tr key={index}>
                                        <td>
                                            <input type="checkbox"
                                            />
                                        </td>
                                        <td>
                                            {
                                                starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                    ? <span class="glyphicon glyphicon-star" onClick={() => this.starDocument(data, 1)} style={{ cursor: "pointer" }}></span>
                                                    : <span class="glyphicon glyphicon-star-empty" onClick={() => this.starDocument(data, 0)} style={{ cursor: "pointer" }}></span>
                                            }
                                        </td>
                                        <td><span class={data.type !== "folder" ? 'glyphicon glyphicon-file' : 'fa fa-folder'}></span></td>
                                        <td class="library-document"><a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>{documentName}</a></td>
                                        <td>{displayDate(data.dateUpdated)}</td>
                                        <td>
                                            <div>
                                                <span class="fa fa-users" data-tip data-for={`follower${index}`}></span>
                                                <Tooltip id={`follower${index}`}>
                                                    {documentMembers.map((e, i) => {
                                                        return <p key={i}>{`${e.firstName} ${e.lastName}`} <br /></p>
                                                    })}
                                                </Tooltip>
                                            </div>
                                        </td>
                                        <td>
                                            <ul style={{ listStyleType: "none", padding: "0" }}>
                                                {(data.tags.length > 0) &&
                                                    data.tags.map((t, tIndex) => {
                                                        tagCount += t.label.length
                                                        let tempCount = tagCount;
                                                        if (tagCount > 16) { tagCount = 0 }
                                                        return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                                                    })
                                                }
                                            </ul>
                                        </td>
                                        <td>
                                            <div class="dropdown">
                                                <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                <ul class="dropdown-menu  pull-right document-actions" aria-labelledby="dropdownMenu2" >
                                                    <li><a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>View</a></li>
                                                    {(loggedUser.data.userType == "Internal") &&
                                                        <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={() => dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })}>Share</a></li>
                                                    }
                                                    <li class="dropdown dropdown-library">
                                                        <span class="test" style={{ marginLeft: "20px", color: "#333", lineHeight: "1.42857143", cursor: "pointer" }}>Move to</span>
                                                        <div class="dropdown-content">
                                                            {(typeof folder.SelectedLibraryFolder.id != "undefined") &&
                                                                <a href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveTo({ id: null }, data)}>Library</a>
                                                            }
                                                            {
                                                                _.filter(document.Library, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                                                    let folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                                                    return (
                                                                        <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveTo(f, data)}>{folderName}</a>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </li>
                                                    <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                                    <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(data)}>Download</a></li>
                                                    {(data.type != 'folder') &&
                                                        <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.duplicateDocument(data)}>Duplicate</a></li>
                                                    }
                                                    <li>
                                                        {starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                            ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={() => this.starDocument(data, 1)}>Unstarred</a>
                                                            : <a href="javascript:void(0)" data-tip="Star" onClick={() => this.starDocument(data, 0)}>Star</a>
                                                        }
                                                    </li>
                                                    <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                    {/* <li><a href="javascript:void(0);" data-tip="Print" onClick={()=>this.printDocument(data)}>Print</a></li> */}
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
                        ((currentPage != lastPage) && document.Library.length > 0 && document.LibraryDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                    }
                    {
                        (document.Library.length == 0 && document.LibraryDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (document.LibraryDocumentLoading == "RETRIEVING") && <Loading />
                }
            </div>
            {/* <PrintComponent /> */}
        </div>
    }
}