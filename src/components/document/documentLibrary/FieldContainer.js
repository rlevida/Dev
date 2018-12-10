import React from "react";
import Tooltip from "react-tooltip";
import { connect } from "react-redux";
import { DragSource, DropTarget } from 'react-dnd';
import { displayDate, getData, postData, putData, showToast } from '../../../globalFunction';

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
    }
}

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

    deleteDocument(data) {
        let { dispatch, loggedUser } = this.props;
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
        const newData = { ...data, tags: data.tags };

        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: { ...newData, oldDocument: type === 'tags' ? data.tags.map((e) => { return e.label }).join(',') : newData.origin } });
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type });
        $(`#editModal`).modal('show');
    }

    editFolder(data, type) {
        let { dispatch } = this.props;
        dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" });
        dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: data })
        dispatch({ type: "SET_DOCUMENT_EDIT_TYPE", EditType: type })
    }

    // moveTo(folderData, documentData) {
    //     let { dispatch, loggedUser } = this.props;
    //     let dataToSubmit = {
    //         status: folderData.status,
    //         folderId: folderData.id,
    //         actionType: "moved",
    //         oldDocument: documentData.origin,
    //         newDocument: "",
    //         title: `${documentData.type === 'document' ? 'Document' : 'Folder'} moved to folder ${folderData.origin}`,
    //         projectId: project,
    //         usersId: loggedUser.data.id
    //     };

    //     putData(`/api/document/${documentData.id}`, dataToSubmit, (c) => {
    //         if (c.status == 200) {
    //             dispatch({ type: "REMOVE_DOCUMENT_FROM_LIST", UpdatedData: c.data.result, Status: documentData.status })
    //             dispatch({ type: "ADD_ACTIVITYLOG_DOCUMENT", activity_log_document: c.data.activityLogs })
    //             showToast("success", "Successfully Updated.")
    //         } else {
    //             showToast("danger", "Updating failed. Please try again")
    //         }
    //         dispatch({ type: "SET_DOCUMENT_SELECTED", Selected: {} })
    //         dispatch({ type: "SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" })
    //     })
    // }

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
        let { dispatch, loggedUser, folder } = this.props;
        if (data.type !== 'folder') {
            dispatch({ type: 'SET_DOCUMENT_FORM_ACTIVE', FormActive: "DocumentViewer" });
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: data });
        } else {
            getData(`/api/document?isDeleted=0&linkId=${project}&linkType=project&page=${1}&status=library&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${data.id}`, {}, (c) => {
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
        let { document, starred, dispatch, loggedUser, data, index, folder, moveTo } = this.props
        let tagCount = 0;
        let documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDragging ? 0 : 1;
        const backgroundColor = hovered ? 'lightblue' : '';

        return connectDragSource(
            connectDropTarget(
                <tr class="item" key={index} style={{ opacity, background: backgroundColor }}>
                    <td>
                        <input type="checkbox"
                        />
                    </td>
                    <td>
                        <a onClick={() => this.starredDocument({ isStarred: data.isStarred, id: data.id, origin: data.origin })}>
                            <span class={`fa ${data.isStarred ? "fa-star" : "fa-star-o"}`} />
                        </a>
                    </td>
                    <td><span class={data.type !== "folder" ? 'glyphicon glyphicon-file' : 'fa fa-folder'}></span></td>
                    <td class="library-document"><a href="javascript:void(0)" onClick={() => this.viewDocument(data)}>{documentName}</a></td>
                    <td>{displayDate(data.dateUpdated)}</td>
                    <td>
                        <span class="fa fa-users" data-tip data-for={`follower${index}`}
                            title={`${data.members.map((e, i) => { return `${e.firstName} ${e.lastName}` }).join(',')}`}>
                        </span>
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
                                            <a href="javascript:void(0)" style={{ textDecoration: "none" }} onClick={() => moveTo({ id: null }, data)}>Library</a>
                                        }
                                        {
                                            _.filter(document.Library, (d) => { return d.type == 'folder' && d.id != data.id }).map((f, fIndex) => {
                                                let folderName = `${f.origin}${f.documentNameCount > 0 ? `(${f.documentNameCount})` : ``}`
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
                                    <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.duplicateDocument(data)}>Duplicate</a></li>
                                }
                                <li>
                                    {starred.List.filter(s => { return s.linkId == data.id }).length > 0
                                        ? <a href="javascript:void(0)" data-tip="Unstarred" onClick={() => this.starDocument(data, 1)}>Unstarred</a>
                                        : <a href="javascript:void(0)" data-tip="Star" onClick={() => this.starDocument(data, 0)}>Star</a>
                                    }
                                </li>
                                <li><a href="javascript:void(0);" data-tip="Delete" onClick={e => this.deleteDocument(data)}>Delete</a></li>
                            </ul>
                        </div>
                    </td>
                </tr>
            )
        )
    }
}