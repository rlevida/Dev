import React from "react";
import { Link } from 'react-router-dom';
import { displayDateMD, getData, postData, putData, showToast, deleteData } from '../../../globalFunction'
import { DragSource, DropTarget, DragPreviewImage } from 'react-dnd';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { getEmptyImage } from 'react-dnd-html5-backend'
import moment from "moment";

const itemSource = {
    beginDrag(props) {
        return props.data
    },
}
const itemTarget = {
    hover(props, monitor) {
        const draggedId = monitor.getItem().id
        if (draggedId !== props.data.id) {
        }
    },
    drop(props, monitor) {
        const draggedItem = monitor.getItem()
    }
}

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder,
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

class FieldContainer extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {

        const img = new Image()
        img.width = 50
        img.height = 50
        img.src = '/images/document-icon.png';
        img.onload = () => this.props.connectDragPreview(img);

    }
    archiveDocument(data) {
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;

        if (!data.isArchived) {
            if (confirm("Do you really want to archive this record?")) {
                putData(`/api/document/${data.id}`, { isArchived: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: projectId, type: data.type, actionType: "deleted", title: 'Document archived' }, (c) => {
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
        const { dispatch, loggedUser, match } = this.props;
        const projectId = match.params.projectId;

        if (confirm("Do you really want to delete this record?")) {
            putData(`/api/document/${data.id}`, { isDeleted: 1, usersId: loggedUser.data.id, oldDocument: data.origin, projectId: projectId, type: data.type, actionType: "deleted", title: 'Document deleted' }, (c) => {
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
        const { dispatch, document, loggedUser, match } = this.props;
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
        const { dispatch, document, loggedUser, match } = this.props;
        const projectId = match.params.projectId;

        const dataToSubmit = {
            id: data.id,
            status: "library",
            actionType: "moved",
            oldDocument: data.origin,
            newDocument: "",
            title: "Document moved to library",
            projectId: projectId,
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
        const { document, loggedUser, dispatch, match } = this.props;
        const projectId = match.params.projectId;
        const isStarredValue = (isStarred > 0) ? 0 : 1;

        postData(`/api/starred?projectId=${projectId}&document=${origin}`, {
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
                showToast("success", `Document successfully ${(isStarredValue > 0) ? "starred" : "unstarred"}.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    viewDocument(data) {
        const { dispatch, loggedUser } = this.props;
        if (data.document_read.length === 0) {
            const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 };
            postData(`/api/document/read`, dataToSubmit, (ret) => {
                dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: { ...data, document_read: [ret.data], isRead: 1 } });
                dispatch({ type: 'UPDATE_DATA_DOCUMENT_LIST', UpdatedData: { ...data, document_read: [ret.data], isRead: 1 } })
                $(`#documentViewerModal`).modal('show')
            });
        } else {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
            $(`#documentViewerModal`).modal('show')
        }
    }

    readDocument(data, action) {
        const { dispatch, loggedUser } = this.props;
        const dataToSubmit = { usersId: loggedUser.data.id, documentId: data.id, isDeleted: 0 }
        if (action === "read") {
            postData(`/api/document/read`, dataToSubmit, (c) => {
                const documentObj = { ...data, isRead: 1, document_read: [c.data] }
                dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: documentObj, Status: documentObj.status });
                showToast('success', 'Document successfully mark as read.');
            })
        } else {
            deleteData(`/api/document/read/${data.id}?usersId=${loggedUser.data.id}&documentId=${data.id}`, {}, (c) => {
                const documentObj = { ...data, isRead: 0, document_read: [] }
                dispatch({ type: "UPDATE_DATA_DOCUMENT_LIST", UpdatedData: documentObj, Status: documentObj.status });
                showToast('success', 'Document successfully mark as unread.');
            })
        }
    }

    render() {
        const { document, dispatch, loggedUser, data, index, moveTo, match } = this.props
        const projectId = match.params.projectId;
        let tagCount = 0;
        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDragging ? 0 : 1;
        const backgroundColor = hovered ? 'lightblue' : '';

        return connectDragSource(
            connectDropTarget(
                <tr class="item" key={index} style={{ opacity, background: backgroundColor }}>
                    <td class="document-name">
                        <a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>
                            < span class={data.isRead ? 'read' : 'unread'}>{documentName}</span>
                        </a>
                    </td>
                    <td><p class="m0">{data.user.firstName + " " + data.user.lastName}</p></td>
                    <td>{moment(data.dateAdded).format("MMMM DD, YYYY")}</td>
                    <td>{
                        data.tagWorkstream.length > 0 &&
                        data.tagWorkstream.map((t, tIndex) => {
                            tagCount += t.label.length
                            let tempCount = tagCount;
                            if (tagCount > 16) { tagCount = 0 }
                            return <span key={tIndex} >{t.label}{tempCount > 16 && <br />}</span>
                        })
                    }
                    </td>
                </tr>
            )
        )
    }
}

export default withRouter(FieldContainer)