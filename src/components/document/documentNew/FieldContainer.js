import React from "react";
import { Link } from 'react-router-dom';
import { displayDateMD, getData, postData, putData, showToast } from '../../../globalFunction'
import { DragSource, DropTarget } from 'react-dnd';
import { connect } from "react-redux"

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
        if (props.data.type === 'folder' && props.data.status == 'new' && props.data.id !== draggedItem.id && draggedItem.status === 'new') {
            props.moveTo(props.data, monitor.getItem())
        }
    }
}

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
        project: store.project
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

export default class FieldContainer extends React.Component {
    constructor(props) {
        super(props)
    }

    archiveDocument(data) {
        const { dispatch, loggedUser } = this.props;
        if (!data.isArchived) {
            if (confirm("Do you really want to archive this record?")) {
                putData(`/api/document/${data.id}`, { isArchived: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: project, type: data.type, actionType: "deleted", title: 'Document archived' }, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: c.data.result, Status: data.status, });
                        dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                        showToast("success", "Successfully Archived.");
                    } else {
                        showToast("error", "Delete failed. Please try again later.");
                    }
                })
            }
        }
    }

    deleteDocument(data) {
        const { dispatch, loggedUser } = this.props;
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
                dispatch({ type: "ADD_DOCUMENT_LIST", List: c.data.result, DocumentType: 'New' });
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                if (data.status == 'new') {
                    dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: document.NewUploadCount + 1 })
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
                dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'new', count: document.Status.new - 1 })
                dispatch({ type: "SET_DOCUMENT_STATUS_COUNT", status: 'library', count: document.Status.library + 1 })
                dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
                showToast("success", "Successfully Updated.")
            } else {
                showToast("error", "Updating failed. Please try again.")
            }
        })
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
        const { dispatch, loggedUser, folder,project } = this.props;

        if (data.type !== 'folder') {
            dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "DocumentViewer" });
            dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data });
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
            dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: 'RETRIEVING', LoadingType: 'NewDocumentLoading' });
            getData(`/api/document?isDeleted=0&linkId=${project.Selected.id}&linkType=project&page=${1}&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_DOCUMENT_LIST", list: c.data.result, DocumentType: 'New', Count: { Count: c.data.count }, CountType: 'NewCount' });
                    dispatch({ type: 'SET_DOCUMENT_LOADING', Loading: '', LoadingType: 'NewDocumentLoading' });
                    dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data, Type: 'SelectedNewFolder' });
                    dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folder.SelectedNewFolderName.concat([data]), Type: 'SelectedNewFolderName' });
                    showToast('success', 'Documents successfully retrieved.');
                }
            });
        }
    }

    render() {
        const { document, dispatch, loggedUser, data, index, moveTo, project } = this.props
        let tagCount = 0;
        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDragging ? 0 : 1;
        const backgroundColor = hovered ? 'lightblue' : '';

        return connectDragSource(
            connectDropTarget(
                <tr class="item" key={index} style={{ opacity, background: backgroundColor }}>
                    <td>
                        <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                            <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                        </a>
                    </td>
                    <td class="document-name">
                        {data.type === "document" ?
                            <Link to={`/projects/${project.Selected.id}/files/${data.id}`}>{documentName}</Link>
                            :
                            <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                                {data.type === "document" ?
                                    <span class="mr10" style={{ fontSize: '18px' }}>&bull;</span> :
                                    <span class="mr10 fa fa-folder fa-lg"></span>
                                }
                                {documentName}
                            </a>
                        }
                    </td>
                    <td class="avatar"><img src="/images/user.png" title={`${data.user.emailAddress}`} /></td>
                    <td>{displayDateMD(data.dateAdded)}</td>
                    <td>{
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
                        <span class={`document-action ${data.isArchived ? 'document-archived' : 'document-active'}`} title="Archive"><i class="fa fa-archive fa-lg"></i></span>

                        <span class="document-action document-active dropdown dropdown-library" title="Move">
                            <i class="fa fa-folder fa-lg"></i>
                            <div class="dropdown-content dropdown-menu-right">
                                {(loggedUser.data.userRole != 6) &&
                                    <a href="javascript:void(0)" style={{ textDecoration: "none" }} data-tip="Move to library" onClick={() => this.moveToLibrary(data)}>Move to library</a>
                                }
                                {
                                    _.filter(document.New, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                        let folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
                                        return (
                                            <a key={fIndex} href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo(f, data)}>{folderName}</a>
                                        )
                                    })
                                }
                            </div>
                        </span>
                        <span class="document-action document-active" title="Delete" data-toggle="modal" data-target="#deleteModal" onClick={() => dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data })}><i class="fa fa-trash fa-lg"></i></span>
                        <div class="dropdown document-action-more">
                            <button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu2" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">&#8226;&#8226;&#8226;</button>
                            <ul class="dropdown-menu  pull-right" aria-labelledby="dropdownMenu2">
                                {(loggedUser.data.userType == "Internal") &&
                                    <li><a href="javascript:void(0)" data-toggle="modal" data-target="#shareModal" onClick={() => dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })}>Share</a></li>
                                }
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
                            </ul>
                        </div>
                    </td>
                </tr>
            )
        )
    }
}