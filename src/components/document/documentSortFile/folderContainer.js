import React from "react";
import { getData } from "../../../globalFunction";
import { DragSource, DropTarget } from "react-dnd";
import { connect } from "react-redux";
import { withRouter } from "react-router";

import Container from "./folderContainer";
// require('rc-collapse/assets/index.css');

const itemSource = {
    beginDrag(props) {
        return props.data;
    }
};
const itemTarget = {
    drop(props, monitor) {
        const { document } = { ...props };
        const draggedItem = monitor.getItem();
        if (monitor.isOver({ shallow: true })) {
            const item = document.SelectedFields.length > 0 ? document.SelectedFields : [draggedItem];
            props.moveTo(props.data, item);
        }
    }
};

@connect(store => {
    return {
        document: store.document,
        loggedUser: store.loggedUser,
        folder: store.folder
    };
})
@DragSource("item", itemSource, (connect, monitor) => {
    return {
        connectDragSource: connect.dragSource(),
        connectDragPreview: connect.dragPreview(),
        isDragging: monitor.isDragging()
    };
})
@DropTarget("item", itemTarget, (connect, monitor) => {
    return {
        connectDropTarget: connect.dropTarget(),
        hovered: monitor.isOver({ shallow: true }),
        item: monitor.getItem()
    };
})
class FieldContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hoveredItem: ""
        };
    }

    getNestedChildren(arr, parent, dataObj) {
        var out = [];
        for (var i in arr) {
            if (arr[i].id == parent) {
                if (typeof arr[i].childFolder === "undefined") {
                    arr[i].childFolder = [];
                }
                arr[i].childFolder = dataObj;
                out.push(arr[i]);
            } else {
                if (typeof arr[i].childFolder === "undefined") {
                    arr[i].childFolder = [];
                }
                if (arr[i].childFolder.length > 0) {
                    this.getNestedChildren(arr[i].childFolder, parent, dataObj);
                }
                out.push(arr[i]);
            }
        }
        return out;
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
        dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
        dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
    }
    async fetchFolder(data) {
        const { dispatch, loggedUser, folder, history, match } = this.props;
        const projectId = match.params.projectId;

        if (data === "") {
            dispatch({ type: "SET_DOCUMENT_LIST", list: [], count: { current_page: 0, last_page: 0, total_page: 0 } });
            dispatch({ type: "SET_SELECTED_FOLDER_NAME", List: [] });
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
            this.fetchData(1);
            history.push(`/projects/${projectId}/files`);
        } else if (folder.Selected.id !== data.id) {
            getData(
                `/api/document?isActive=1&isDeleted=0&linkId=${projectId}&linkType=project&page=${1}&type=folder&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}&folderId=${
                typeof data.id !== "undefined" ? data.id : null
                }&starredUser=${loggedUser.data.id}`,
                {},
                c => {
                    const { result } = { ...c.data };
                    if (result.length > 0) {
                        const newList = this.getNestedChildren(folder.List, data.id, result);
                        dispatch({ type: "SET_FOLDER_LIST", list: newList });
                    }
                }
            );
        } else if (folder.Selected.id === data.id) {
            dispatch({ type: "SET_FOLDER_SELECTED", Selected: {} });
        }
    }

    renderFolder(data) {
        const { moveTo, document, hovered, folder } = { ...this.props };
        const fileName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`;
        return (
            <div class="folder-accordion" id={data.id} style={{ backgroundColor: hovered ? "#e4e4e4" : "" }}>
                <a
                    class={`accordion-toggle collapsed`}
                    data-toggle="collapse"
                    href={`#collapse-${data.id}`} 
                    role="button"
                    aria-expanded="false"
                    aria-controls={`collapse-${data.id}`}
                    onClick={() => this.fetchFolder(data)}
                >
                    <i class="fa-chevron fa fa-chevron-down" />
                    <i class="fa fa-fw fa-folder" />
                    {fileName}
                </a>
                <div class="collapse" id={`collapse-${data.id}`}>
                    <div class="collapse-folder-child">
                        {typeof data.childFolder !== "undefined" &&
                            data.childFolder.length > 0 &&
                            data.childFolder.map((e, index) => {
                                return <Container data={e} moveTo={moveTo} key={index} />;
                            })}
                    </div>
                </div>
            </div>
        );
    }

    render() {
        const { data, key, connectDropTarget } = this.props;
        return connectDropTarget(<div key={key}>{this.renderFolder(data, connectDropTarget)}</div>);
    }
}

export default withRouter(FieldContainer);
