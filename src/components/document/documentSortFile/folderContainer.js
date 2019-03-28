import React from "react";
import { Link } from 'react-router-dom';
import { displayDateMD, getData, postData, putData, showToast, deleteData } from '../../../globalFunction'
import { DragSource, DropTarget } from 'react-dnd';
import { connect } from "react-redux";
import { withRouter } from "react-router";

var Collapse = require('rc-collapse');
var Panel = Collapse.Panel;

import Container from "./folderContainer"
// require('rc-collapse/assets/index.css');

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
        if (monitor.isOver()) {
            props.moveTo(props.data, draggedItem)
        }
        // if (props.data.type === 'folder' && props.data.status == 'new' && props.data.id !== draggedItem.id && draggedItem.status === 'new') {
        //     props.moveTo(props.data, monitor.getItem())
        // }
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
    }

    async fetchFolder(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;
        let folderList = folder.SelectedFolderName;
        // if (data === "") {
        //     dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
        //     await dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: [] });
        //     await dispatch({ type: 'SET_FOLDER_SELECTED', Selected: {} });
        //     await this.fetchData(1);
        //     await history.push(`/projects/${projectId}/files`);
        // } else if (folder.Selected.id !== data.id) {
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

                let isSelectedFolder = true;
                let newList = []
                // while (isSelectedFolder) {
                newList = folder.List.map((x) => {
                    let a = Object.assign({}, x)
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
                                console.log(b)

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
                // }
                console.log(result)

                dispatch({ type: 'SET_FOLDER_LIST', list: newList })
                dispatch({ type: 'SET_FOLDER_SELECTED', Selected: data })
                dispatch({ type: 'SET_SELECTED_FOLDER_NAME', List: folderList });
            }
        });
        // }
    }

    renderFolder(data) {
        const { moveTo } = { ...this.props }
        return (
            <div id={data.id}>
                <p>
                    <a href="javascript:void(0)" class="btn btn-primary" data-toggle="collapse" href={`#collapseExample${data.id}`} role="button" aria-expanded="false" aria-controls={`collapseExample${data.id}`} onClick={() => this.fetchFolder(data)}>
                        {data.origin}
                    </a>
                </p>
                <div class="collapse" id={`collapseExample${data.id}`}>
                    <div class="collapse-folder-child">
                        {typeof data.childFolder !== "undefined" && data.childFolder.length > 0 &&
                            data.childFolder.map((e, index) => { return <Container data={e} moveTo={moveTo} key={index}></Container> })
                        }
                    </div>
                </div>
            </div>
        )
    }

    render() {
        const { document, dispatch, loggedUser, data, key, moveTo, match } = this.props
        const projectId = match.params.projectId;
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDragging ? 0 : 1;
        const backgroundColor = hovered ? 'lightblue' : '';
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