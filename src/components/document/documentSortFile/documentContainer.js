import React from "react";
import { postData } from '../../../globalFunction'
import { DragSource, DropTarget } from 'react-dnd';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import moment from "moment";

const itemSource = {
    beginDrag(props) {
        props.handleSelectedFieldDragging(props.selectedFields)
        return props.data
    },
    endDrag(props, monitor) {
        if (!monitor.didDrop()) {
            props.handleSelectedFieldDragging([])
        }
    }
}

const itemTarget = {
    hover(props, monitor) {
        const draggedId = monitor.getItem().id
        if (draggedId !== props.data.id) {
        }
    },
    drop(props, monitor) {
        props.handleSelectedFieldDragging([])
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

    handleRowSelection(cmdKey, shiftKey, index) {
        this.props.handleSelection(index, cmdKey, shiftKey);
    }

    render() {
        const { data, index } = this.props
        let tagCount = 0;
        const selected = this.props.selectedFields.find(field => field.id === data.id);
        const isDraggingField = this.props.selectedFieldsDragging.find(field => field.id === data.id);
        const documentName = `${data.origin}${data.documentNameCount > 0 ? `(${data.documentNameCount})` : ``}`
        const { isDragging, connectDragSource, connectDropTarget, hovered } = this.props
        const opacity = isDraggingField || isDragging ? 0 : 1;
        const backgroundColor = isDragging || selected ? 'lightblue' : '';

        return connectDragSource(
            connectDropTarget(
                <tr class="item" key={index} style={{ opacity, background: backgroundColor }}
                    onClick={(e) => this.handleRowSelection(e.metaKey, e.shiftKey, this.props.index)}
                >
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