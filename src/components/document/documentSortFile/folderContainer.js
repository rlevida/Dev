import React from "react";
import { Link } from 'react-router-dom';
import { displayDateMD, getData, postData, putData, showToast, deleteData } from '../../../globalFunction'
import { DragSource, DropTarget } from 'react-dnd';
import { connect } from "react-redux";
import { withRouter } from "react-router";

var Collapse = require('rc-collapse');
var Panel = Collapse.Panel;
var hoveredId = ''
import Container from "./folderContainer"
// require('rc-collapse/assets/index.css');

const itemSource = {
    beginDrag(props) {
        return props.data
    }
}
const itemTarget = {
    drop(props, monitor) {
        const draggedItem = monitor.getItem()
        if (monitor.isOver({ shallow: true })) {
            props.moveTo(props.data, draggedItem)
        }
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
        hovered: monitor.isOver({ shallow: true }),
        item: monitor.getItem()
    }
})

class FieldContainer extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            hoveredItem: ""
        }
    }
    componentDidMount() {
    }

    async fetchFolder(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedFolderName;
        if (data === "") {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
            await dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
            await dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
            await this.fetchData(1);
            await history.push(`/projects/${projectId}/files`);
        } else if (folder.Selected.id !== data.id) {
            getData(`/api/document?isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&type=folder&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${typeof data.id !== 'undefined' ? data.id : null}&starredUser=${loggedUser.data.id}`, {}, (c) => {
                const { result, count } = { ...c.data }
                if (result.length > 0) {
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

                    let newList = []
                    newList = folder.List.map((a) => {
                        if (a.id === data.id) {
                            if (typeof a.childFolder === 'undefined') {
                                a.childFolder = []
                                a.childFolder = result;
                            } else {
                                a.childFolder.map((y) => {
                                    let b = y
                                    if (b.id === data.id) {
                                        if (typeof b.childFolder === 'undefined') {
                                            b.childFolder = []
                                            b.childFolder = result
                                        }
                                    } else if (typeof b.childFolder !== "undefined") {
                                        b.childFolder.map((c) => {
                                            if (c.id === data.id) {
                                                if (typeof c.childFolder === "undefined") {
                                                    c.childFolder = []
                                                    c.childFolder = result
                                                }
                                            }
                                            return c
                                        })
                                    }
                                    return b
                                })
                            }
                        } else if (typeof a.childFolder !== "undefined") {

                            a.childFolder.map((y) => {
                                let b = y
                                if (b.id === data.id) {
                                    if (typeof b.childFolder === 'undefined') {
                                        b.childFolder = []
                                        b.childFolder = result
                                    }
                                } else if (typeof b.childFolder !== "undefined") {
                                    b.childFolder.map((c) => {
                                        if (c.id === data.id) {
                                            if (typeof c.childFolder === 'undefined') {
                                                c.childFolder = []
                                                c.childFolder = result
                                            }
                                        }
                                        return c
                                    })
                                }
                                return b
                            })
                        }
                        return a
                    })
                    dispatch({ type: 'SET_FOLDER_LIST', list: newList })
                }

                const isAlreadyInList = folder.SelectedFolderName.indexOf(data) > -1 ? true : false
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: isAlreadyInList ? folderList : folder.SelectedFolderName.concat([data]) });
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data })
            });
        }
    }

    renderFolder(data) {
        const { moveTo, document, hovered, folder } = { ...this.props }
        // const isSelected = folder.Selected.id === data.id ? true : false
        return (
            <div class="folder-accordion" id={data.id} style={{ backgroundColor: hovered ? '#e4e4e4' : '' }}>
                <a href="javascript:void(0)"
                    class={`accordion-toggle collapsed`}
                    // id={`${isSelected ? 'isSelected' : ''}`}
                    data-toggle="collapse" href={`#collapse${data.id}`}
                    role="button"
                    aria-expanded="false"
                    aria-controls={`collapse${data.id}`}
                    onClick={() => this.fetchFolder(data)}>
                    <i class="fa-chevron fa fa-chevron-down"></i>
                    <i class="fa fa-fw fa-folder"></i>
                    {data.origin}
                </a>
                <div class="collapse" id={`collapse${data.id}`}>
                    <div class="collapse-folder-child">
                        {typeof data.childFolder !== "undefined" && data.childFolder.length > 0 &&
                            data.childFolder.map((e, index) => { return <Container data={e} moveTo={moveTo} key={index}></Container> })
                        }
                    </div>
                </div>
            </div >
        )
    }

    render() {
        const { data, key, connectDropTarget } = this.props
        return (
            connectDropTarget(
                <div key={key}>
                    {this.renderFolder(data, connectDropTarget)}
                </div>
            )
        )
    }
}

export default withRouter(FieldContainer)