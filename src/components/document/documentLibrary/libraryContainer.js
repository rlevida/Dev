import React from "react";
import { connect } from "react-redux";
import { DragSource, DropTarget } from 'react-dnd';

const itemSource = {
    beginDrag(props) {
        return props.data
    }
}
const itemTarget = {
    drop(props, monitor) {
        const draggedItem = monitor.getItem();
        if (draggedItem.status !== 'library') {
            if (draggedItem.folderId !== null) {
                draggedItem.folderId = null;
                props.moveToLibrary(draggedItem);
            } else {
                props.moveToLibrary(draggedItem);
            }
        }

        if (draggedItem.folderId !== null) {
            draggedItem.folderId = null;
            props.moveToLibrary(draggedItem);
        }
    }
}

@connect((store) => {
    return {
        document: store.document,
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
    }

    render() {
        const { document } = this.props
        const { connectDropTarget, hovered } = this.props
        const backgroundColor = hovered ? 'lightblue' : '';
        return (
            connectDropTarget(
                <tr class="item" style={{ background: backgroundColor }}>
                    <td colSpan="7">
                        {
                            (document.LibraryDocumentLoading != "RETRIEVING") && <div class="document-drop-file">Drop files here</div>
                        }
                    </td>
                </tr>
            )
        )
    }
}