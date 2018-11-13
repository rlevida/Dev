import React from "react";
import { DropDown, Loading } from "../../../globalComponents"
import { deleteData, displayDate, getData, getFilePathExtension, postData, putData, removeTempFile, showToast } from '../../../globalFunction'
import moment from 'moment'
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
            order: 'asc'
        }
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
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

        this.fetchData(1)
    }

    addFolder() {
        let { loggedUser, folder, dispatch } = this.props;
        let { folderName } = this.state;
        let dataToSubmit = { projectId: project, name: folderName, createdBy: loggedUser.data.id, parentId: folder.SelectedNewFolder.id, type: "new" };
        postData(`/api/folder?projectId=${project}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_FOLDER_LIST", list: [c.data] });
                showToast("success", "Successfully Added.");
            } else {
                showToast("error", "Saving failed. Please try again.");
            }

            this.setState({ folderAction: "", folderName: "" });
        })
    }

    deleteDocument(id) {
        let { dispatch } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${id}`, { isDeleted: 1 }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", DocumentType: 'New', Id: id })
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
        const { dispatch, document } = this.props;
        const dataToSubmit = [{ name: data.name, origin: data.origin, project: project, uploadedBy: data.uploadedBy, status: data.status, tags: JSON.stringify(data.tags) }]
        postData(`/api/document`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data, DocumentType: data.status == 'new' ? 'New' : 'Library' });
                if (data.status == 'new') {
                    dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: document.NewUploadCount + 1 })
                }
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
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
        let { dispatch } = this.props;
        let newData = { ...data }, tempTags = [];

        newData = { ...data, tags: JSON.stringify(data.tags) }

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: newData });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    fetchData(page) {
        const { dispatch, loggedUser, document } = this.props;
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${page}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_LIST", List: document.New.concat(c.data.result), DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' })
                dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' })
                showToast('success', 'Documents successfully retrieved.')
            } else {
                showToast('success', 'Something went wrong!')
            }
        });
    }

    moveToLibrary(data) {
        let { dispatch, document } = this.props;
        let dataToSubmit = { status: "library", id: data.id }
        putData(`/api/document/${data.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data, Status: data.status })
                dispatch({ type: "MOVE_DOCUMENT_TO_LIBRARY", UpdatedData: c.data })
                dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
                dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: document.NewUploadCount - 1 })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("error", "Updating failed. Please try again.")
            }
        })
    }

    moveFolderTo(folderData, selectedFolder) {
        let { dispatch } = this.props;
        let dataToSubmit = { ...selectedFolder, parentId: folderData.id };
        putData(`/api/folder/${selectedFolder.id}`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "UPDATE_DATA_FOLDER_LIST", UpdatedData: c.data })
                showToast("success", "Successfully Updated.");
            } else {
                showToast("error", 'Updating failed. Please try again.');
            }
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
        })
    }

    moveTo(folderData, documentData) {
        let { dispatch } = this.props;
        let dataToSubmit = { ...documentData, status: folderData.type, folderId: folderData.id };
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

    getFolderDocuments(data) {
        let { dispatch, loggedUser } = this.props;
        dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "RETRIEVING" })
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_NEW_LIST", list: c.data.result, count: { Count: c.data.count } })
                dispatch({ type: "SET_NEW_FOLDER_SELECTED", Selected: data })
                dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "" })
            }
        });
    }

    newDocumentFilter(e) {
        let { dispatch, loggedUser } = this.props;
        let isCompleted = 0
        if (e.value != 0) {
            isCompleted = e.value == 1 ? 1 : 0;
        }
        dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "RETRIEVING" })
        getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&isCompleted=${isCompleted}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_DOCUMENT_NEW_LIST", list: c.data.result, count: { Count: c.data.count } })
                dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "" })
                this.setState({ selectedFilter: e.value })
            }
        });
    }

    getNextResult() {
        let { document, loggedUser, dispatch } = this.props;
        dispatch({ type: "SET_NEW_DOCUMENT_LOADING", Loading: "RETRIEVING" })
        this.fetchData(document.NewCount.Count.current_page + 1)
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
            dispatch({ type: "SET_DOCUMENT_LIST", List: sortedDocument, DocumentType: 'New', Count: document.NewCount, CountType: 'NewCount' })
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
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
    }

    render() {
        let { document, starred, global, folder, dispatch, loggedUser } = this.props
        let tagCount = 0, folderList = [];
        const currentPage = (typeof document.NewCount.Count.current_page != "undefined") ? document.NewCount.Count.current_page : 1;
        const lastPage = (typeof document.NewCount.Count.last_page != "undefined") ? document.NewCount.Count.last_page : 1;

        if (folder.List.length > 0) {
            if (loggedUser.data.userType == "Internal") {
                folder.List.map(e => {
                    if (e.type == "new") {
                        folderList.push(e)
                    }
                })
            } else {
                if (typeof global.SelectList.shareList != "undefined" && typeof loggedUser.data.id != "undefined") {
                    folder.List.map(e => {
                        let isShared = global.SelectList.shareList.filter(s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id && s.shareType == "folder" }).length ? 1 : 0
                        if ((isShared || e.createdBy == loggedUser.data.id) && e.type == "new") {
                            folderList.push(e)
                        }
                    })
                }
            }
        }

        let folderName = [];
        folderName.unshift(<span>{(typeof folder.SelectedNewFolder.name != "undefined" && folder.SelectedNewFolder.type == "new") ? ` > ${folder.SelectedNewFolder.name}` : ""}</span>)
        let folderParentId = folder.SelectedNewFolder.parentId;
        while (folderParentId) {
            let parentFolder = folderList.filter(e => e.id == folderParentId);
            folderParentId = null;
            if (parentFolder.length > 0) {
                folderName.unshift(<span> > <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments(parentFolder[0])}>{
                    ((typeof parentFolder[0].name != "undefined") ? `${parentFolder[0].name}` : "")}</a></span>)
                folderParentId = parentFolder[0].parentId;
            }
        }

        return <div>
            <br />
            <div class="col-lg-12 col-md-12">
                <h3>
                    <a style={{ cursor: "pointer" }} onClick={() => this.getFolderDocuments("")}>New Documents</a>
                    {folderName.map((e, index) => { return <span key={index}>{e}</span> })}
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
                                    onChange={(e) => this.newDocumentFilter(e)} />
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
                <table id="dataTable" class="table responsive-table table-bordered document-table">
                    <tbody>
                        <tr>
                            <th></th>
                            <th></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('origin')}>Name</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i><a href="javascript:void(0)" onClick={() => this.sortDocument('dateAdded')}>Uploaded</a></th>
                            <th><i class="fa fa-caret-down">&nbsp;&nbsp;</i>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>

                        {(!document.NewDocumentLoading != "RETRIEVING") &&
                            _.orderBy(folderList, ["dateAdded"], ["desc"]).map((data, index) => {
                                if ((!data.parentId && !folder.SelectedNewFolder.id) || (data.parentId && folder.SelectedNewFolder.id == data.parentId)) {
                                    return (
                                        <tr key={index}>
                                            <td><input type="checkbox" /></td>
                                            <td ><span class="glyphicon glyphicon-star-empty" onClick={() => this.starDocument(data, 0)} style={{ cursor: "pointer" }}></span></td>
                                            <td class="library-document"><a href="javascript:void(0)" onClick={() => this.getFolderDocuments(data)}><span class="fa fa-folder" style={{ marginRight: "20px" }}></span>{data.name}</a></td>
                                            <td>{moment(data.dateUpdated).format('L')}</td>
                                            <td>{data.user.emailAddress}</td>
                                            <td>
                                                <ul style={{ listStyleType: "none", padding: "0" }}>
                                                    {(data.tags.length > 0) &&
                                                        data.tags.map((t, tIndex) => {
                                                            return <li key={tIndex}><span key={tIndex} class="label label-primary" style={{ margin: "5px" }}>{t.label}</span></li>
                                                        })
                                                    }
                                                </ul>
                                            </td>
                                            <td>
                                                <div class="dropdown">
                                                    <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                                                    <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                                        {(loggedUser.data.userType == "Internal") &&
                                                            <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={() => dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })}>Share</a></li>
                                                        }
                                                        <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.downloadFolder(data)}>Download</a></li>
                                                        <li class="dropdown dropdown-library">
                                                            <span class="test" style={{ marginLeft: "20px", color: "#333", lineHeight: "1.42857143", cursor: "pointer" }}>Move to</span>
                                                            <div class="dropdown-content">
                                                                {(typeof folder.SelectedNewFolder.id != "undefined") &&
                                                                    <a href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveFolderTo({ id: null }, data)}>Library</a>
                                                                }
                                                                {folder.List.map((f, fIndex) => {
                                                                    if (typeof folder.SelectedNewFolder.id == "undefined" && f.id != data.id) {
                                                                        return (
                                                                            <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveFolderTo(f, data)}>{`${f.name} ${f.type == "new" ? "( new document )" : "( library )"}`}</a>
                                                                        )
                                                                    } else {
                                                                        if (folder.SelectedNewFolder.id != f.id && f.id != data.id) {
                                                                            return (
                                                                                <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveFolderTo(f, data)}>{f.name}</a>
                                                                            )
                                                                        }
                                                                    }
                                                                })}
                                                            </div>
                                                        </li>
                                                        <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteFolder(data.id)}>Delete</a></li>
                                                        <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                }
                            })
                        }

                        {
                            document.New.map((data, index) => {
                                let ext = getFilePathExtension(data.origin)
                                let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
                                return (
                                    <tr key={index}>
                                        <td>
                                            <input type="checkbox"
                                            // onChange={ () => this.handleIsCompleted(data , data.isCompleted ) } checked={ data.isCompleted }
                                            />
                                        </td>
                                        <td>
                                            {starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                                ? <span class="glyphicon glyphicon-star" onClick={() => this.starDocument(data, 1)} style={{ cursor: "pointer" }}></span>
                                                : <span class="glyphicon glyphicon-star-empty" onClick={() => this.starDocument(data, 0)} style={{ cursor: "pointer" }}></span>
                                            }
                                        </td>
                                        <td class="new-document"> <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}><span class="glyphicon glyphicon-file"></span>{documentName}</a></td>
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
                                                    <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.duplicateDocument(data)}>Duplicate</a></li>
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
                                                            {folder.List.map((f, fIndex) => {
                                                                return (
                                                                    <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => this.moveTo(f, data)}>{f.name} {`${f.type == "new" ? "( new document )" : "( library )"}`}</a>
                                                                )
                                                            })}
                                                        </div>
                                                    </li>

                                                    <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data.id)}>Delete</a></li>
                                                    <li><a href="javascript:void(0)" data-tip="View" onClick={() => this.viewDocument(data)}>View</a></li>
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
                        ((currentPage != lastPage) && document.New.length > 0 && document.NewDocumentLoading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Documents</a>
                    }
                    {
                        (document.New.length == 0 && folderList.length == 0 && document.NewDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
                {
                    (document.NewDocumentLoading == "RETRIEVING") && <Loading />
                }
            </div>
        </div>
    }
}