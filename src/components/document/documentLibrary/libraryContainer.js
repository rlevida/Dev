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
            props.moveToLibrary(draggedItem);
        } else if (draggedItem.folderId != null) {
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
                    <td colSpan="8">
                        {
                            (document.Library.length == 0 && document.LibraryDocumentLoading != "RETRIEVING") && <p>No Records Found</p>
                        }
                        {
                            (document.Library.length > 0 && document.LibraryDocumentLoading != "RETRIEVING") && <p>move to library</p>
                        }
                    </td>
                </tr>
            )
        )
    }
}