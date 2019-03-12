import React from "react";
import { connect } from "react-redux";
import { DragSource, DropTarget } from 'react-dnd';
import { displayDateMD, getData, postData, putData, showToast } from '../../../globalFunction';

const itemSource = {
    beginDrag(props) {
        return props.data
    }
}
const itemTarget = {
    hover(props, monitor) {
        const draggedId = monitor.getItem().id
        if (draggedId !== props.data.id) {
        }
    },
    drop(props, monitor) {
        const draggedItem = monitor.getItem()
        if (props.data.type === 'folder' && props.data.status === 'library' && props.data.id !== draggedItem.id && draggedItem.status === 'library') {
            props.moveTo(props.data, monitor.getItem())
        }

        if (draggedItem.status === 'new' && props.data.type === 'document' && props.data.id !== draggedItem.id) {
            draggedItem.folderId = null
            props.moveToLibrary(draggedItem)
        }

        if (draggedItem.status === 'new' && props.data.type === 'folder' && props.data.id !== draggedItem.id) {
            draggedItem.folderId = props.data.id
            props.moveToLibrary(draggedItem)
        }
    }
}

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder
    }
})

@DragSource('item', itemSource, (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    }
})

@DropTarget('item', itemTarget, (connect, monitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        hovered: monitor.isOver(),
        item: monitor.getItem()
    }
})

export default class DocumentLibrary extends React.Component {
    constructor(props) {
        super(props)
        this.starredDocument = this.starredDocument.bind(this);
    }

    componentDidMount() {
        const { dispatch, document, loggedUser } = this.props;
        // automatically move to selected folder
        if (folderParams !== "" && folderParamsStatus === "library" && folderParamsOrigin !== "") {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${folderParams}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [{ id: folderParams, name: folderParamsOrigin }], Type: 'SelectedLibraryFolderName' });

                    showToast('success', 'Documents successfully retrieved.');
                } else {
                    showToast('success', 'Something went wrong!')
                }
            });
        } else if (_.isEmpty(document.LibraryCount.Count)) {
            this.fetchData(1)
        }
    }

    archiveDocument(data) {
        const { dispatch, loggedUser } = this.props;
        if (confirm("Do you really want to archive this record?")) {
            putData(`/api/document/${data.id}`, { isArchived: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: project, type: data.type, actionType: "deleted", title: 'Document deleted' }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data.result, Status: data.status, });
                    dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            })
        }
    }

    deleteDocument(data) {
        const { dispatch, loggedUser } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${data.id}`, { isDeleted: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: project, type: data.type, actionType: "deleted", title: 'Document deleted' }, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "REMOVE_DELETED_DOCUMENT_LIST", DocumentType: 'Library', Id: data.id })
                    dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                    showToast("success", "Successfully Deleted.");
                } else {
                    showToast("error", "Delete failed. Please try again later.");
                }
            })
        }
    }

    downloadDocument(data) {
        if (data.type === 'document') {
            window.open(encodeURI(`/api/downloadDocument?fileName=${data.name}&origin=${data.origin}`));
        } else {
            window.open(encodeURI(`/api/downloadFolder?folder=${data.id}&folderName=${`${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`}`));
        }
    }

    duplicateDocument(data) {
        const { dispatch, document, loggedUser } = this.props;
        const dataToSubmit = [{ name: data.name, origin: data.origin, project: project, uploadedBy: loggedUser.data.id, status: data.status, tags: JSON.stringify(data.tags), type: 'document' }]

        postData(`/api/document?isDuplicate=true`, dataToSubmit, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'Library' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                if (data.status == 'new') {
                    dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'library', count: document.NewUploadCount + 1 })
                }
                showToast("success", "Successfully Added.")
            } else {
                showToast("error", "Saving failed. Please Try again later.")
            }
        })
    }

    editDocument(data, type) {
        const { dispatch } = this.props;
        const newData = { ...data, workstreamId: data.tagWorkstream };
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...newData, oldDocument: type === 'tags' ? data.tagWorkstream.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    editFolder(data, type) {
        const { dispatch } = this.props;

        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type })
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
                const updatedDocumentList = _.map([...document.Library], (documentObj, index) => {
                    if (id == documentObj.id) {
                        documentObj["isStarred"] = isStarredValue;
                    }
                    return documentObj;
                });
                dispatch({ type: "SET_DOCUMENT_LIST", list: updatedDocumentList, DocumentType: 'Library' });
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
            dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: "DocumentViewer" });
            // if (!data.readOn) {
            //     let dataToSubmit = { readOn: new Date() };
            //     putData(`/api/document/readOn/${data.id}?starredUser=${loggedUser.data.id}`, dataToSubmit, (c) => {
            //         dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: c.data });
            //         dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data, Status: data.status, });
            //     })
            // } else {
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
            // }
        } else {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: 'SET_DOCUMENT_LIST', list: c.data.result, DocumentType: 'Library', Count: { Count: c.data.count }, CountType: 'LibraryCount' })
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'LibraryDocumentLoading' })
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedLibraryFolder' })
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedLibraryFolderName.concat([data]), Type: 'SelectedLibraryFolderName' })
                    showToast('success', 'Documents successfully retrieved.')
                }
            });
        }
    }

    render() {
        const { document, dispatch, loggedUser, data, index, folder, moveTo } = this.props
        let tagCount = 0;
        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDragging ? 0 : 1;
        const backgroundColor = hovered ? 'lightblue' : '';

        return connectDragSource(
            connectDropTarget(
                <tr class="item" key={index} style={{ opacity, background: backgroundColor }}>
                    {/* <td>
                        <input type="checkbox"
                        />
                    </td> */}
                    <td>
                        <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                            <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                        </a>
                    </td>
                    {/* <td><span class={data.type !== "folder" ? 'glyphicon glyphicon-file' : 'fa fa-folder'}></span></td> */}
                    <td>
                        <div class="document-name">
                            <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                {data.type === "document" ?
                                    <span class="mr10" style={{ fontSize: '18px' }}>&bull;</span> :
                                    <span class="mr10 fa fa-folder fa-lg"></span>
                                }
                                <span>{documentName}</span>
                            </a>
                        </div>
                    </td>
                    <td class="avatar"><img src="/images/user.png" title={`${data.user.emailAddress}`} /></td>
                    <td>{displayDateMD(data.dateUpdated)}</td>
                    <td>
                        {
                            data.tagWorkstream.length > 0 &&
                            data.tagWorkstream.map((t, tIndex) => {
                                tagCount += t.label.length
                                let tempCount = tagCount;
                                if (tagCount > 16) { tagCount = 0 }
                                return <span key={tIndex} ><label class="label label-primary" style={{ margin: "5px" }}>{t.label}</label>{tempCount > 16 && <br />}</span>
                            })
                        }
                    </td>
                    <td>{data.readOn ? displayDateMD(data.readOn) : '--'}</td>
                    <td style={{ display: 'flex' }}>
                        <span class="document-action document-active" title="Download" onClick={() => this.downloadDocument(data)}><i class="fa fa-download fa-lg"></i></span>
                        <span class={`document-action ${data.isArchived ? 'document-archived' : 'document-active'}`} title="Archive" onClick={e => this.archiveDocument(data)}><i class="fa fa-archive fa-lg"></i></span>

                        <span class="document-action document-active dropdown dropdown-library" title="Move">
                            <i class="fa fa-folder fa-lg"></i>
                            <div class="dropdown-content dropdown-menu-right">
                                {(loggedUser.data.userRole != 6) &&
                                    <a href="javascript:void(0)" style={{ textDecoration: "none" }} data-tip="Move to library" onClick={() => this.moveToLibrary(data)}>Move to library</a>
                                }
                                {
                                    _.filter(document.Library, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                        const folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                        return (
                                            <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo(f, data)}>{folderName}</a>
                                        )
                                    })
                                }
                            </div>
                        </span>
                        {/* onClick={e => this.deleteDocument(data)} */}
                        <span class="document-action document-active" title="Delete" data-toggle="modal" data-target="#deleteModal"><i class="fa fa-trash fa-lg"></i></span>
                        <div class="dropdown">
                            <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                            <ul class="dropdown-menu  pull-right document-actions" aria-labelledby="dropdownMenu2" >
                                <li><a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>View</a></li>
                                {(loggedUser.data.userType == "Internal") &&
                                    <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={() => dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })}>Share</a></li>
                                }
                                {/* <li class="dropdown dropdown-library">
                                    <span class="test" style={{ marginLeft: "20px", color: "#333", lineHeight: "1.42857143", cursor: "pointer" }}>Move to</span>
                                    <div class="dropdown-content">
                                        {(typeof folder.SelectedLibraryFolder.id != "undefined") &&
                                            <a href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo({ id: null }, data)}>Library</a>
                                        }
                                        {
                                            _.filter(document.Library, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                                const folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                                return (
                                                    <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo(f, data)}>{folderName}</a>
                                                )
                                            })
                                        }
                                    </div>
                                </li> */}
                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                {/* <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(data)}>Download</a></li> */}
                                {(data.type != 'folder') &&
                                    <li><a href="javascript:void(0);" data-tip="Duplicate" onClick={e => this.duplicateDocument(data)}>Duplicate</a></li>
                                }
                                <li>
                                    <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                        {data.isStarred ? 'Unstarred' : 'Star'}
                                    </a>
                                </li>
                                {/* <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data)}>Delete</a></li> */}
                            </ul>
                        </div>
                    </td>
                    {/* <td>
                        <span class="fa fa-users" data-tip data-for={`follower${index}`}
                            title={`${data.members.map((e, i) => { return `${e.firstName} ${e.lastName}` }).join(',')}`}>
                        </span>
                    </td>
                    <td>
                        <ul style={{ listStyleType: "none", padding: "0" }}>
                            {(data.tags.length > 0) &&
                                data.tags.map((t, tIndex) => {
                                    tagCount += t.label.length
                                    const tempCount = tagCount;
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
                                            <a href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo({ id: null }, data)}>Library</a>
                                        }
                                        {
                                            _.filter(document.Library, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                                const folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                                return (
                                                    <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo(f, data)}>{folderName}</a>
                                                )
                                            })
                                        }
                                    </div>
                                </li>
                                <li><a href="javascript:void(0)" data-tip="Edit" onClick={() => this.editDocument(data, "tags")}>Edit Tags</a></li>
                                <li><a href="javascript:void(0)" data-tip="Download" onClick={() => this.downloadDocument(data)}>Download</a></li>
                                {(data.type != 'folder') &&
                                    <li><a href="javascript:void(0);" data-tip="Duplicate" onClick={e => this.duplicateDocument(data)}>Duplicate</a></li>
                                }
                                <li>
                                    <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                                        {data.isStarred ? 'Unstarred' : 'Star'}
                                    </a>
                                </li>
                                <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data)}>Delete</a></li>
                            </ul>
                        </div>
                    </td> */}
                </tr>
            )
        )
    }
}