import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        global: store.global
    }
})

export default class DocumentStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    componentWillMount() {
        let { socket } = this.props
        socket.emit("GET_WORKSTREAM_COUNT_LIST", { filter: { projectId: project } })
        socket.emit("GET_DOCUMENT_LIST", { filter: { isDeleted: 0, linkId: project, linkType: "project" } });
        socket.emit("GET_APPLICATION_SELECT_LIST", { selectName: "shareList", filter: { linkType: "project", linkId: project } })
    }

    render() {
        let { document, loggedUser, global } = this.props
        let documentList = { newUpload: [], library: [] };
        if (document.List.length > 0) {
            document.List.filter(e => {
                if (e.status == "new") {
                    if (loggedUser.data.userType == "Internal") {
                        documentList.newUpload.push(e)
                    } else {
                        if (e.folderId != null) {
                            let isShared = global.SelectList.shareList.filter(s => {
                                return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.folderId && s.shareType == "folder" && e.status == "new"
                            }).length ? 1 : 0
                            if (isShared || loggedUser.data.id == e.uploadedBy) {
                                documentList.newUpload.push(e)
                            }
                        } else {
                            let isShared = global.SelectList.shareList.filter(s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id && s.shareType == "document" && e.status == "new" }).length ? 1 : 0
                            if (isShared || loggedUser.data.id == e.uploadedBy) {
                                documentList.newUpload.push(e)
                            }
                        }
                    }
                }
                if (e.status == "library") {
                    if (loggedUser.data.userType == "Internal") {
                        documentList.library.push(e)
                    } else {
                        if (e.folderId != null) {
                            let isShared = global.SelectList.shareList.filter(s => {
                                return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.folderId && s.shareType == "folder" && e.status == "library"
                            }).length ? 1 : 0
                            if (isShared || loggedUser.data.id == e.uploadedBy) {
                                documentList.library.push(e)
                            }
                        } else {
                            let isShared = global.SelectList.shareList.filter(s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id && s.shareType == "document" && e.status == "library" }).length ? 1 : 0
                            if (isShared || loggedUser.data.id == e.uploadedBy) {
                                documentList.library.push(e)
                            }
                        }
                    }
                }
            })
        }

        return (
            <table class="table responsive-table m0">
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "275px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>New Uploads</span><span style={{ float: "right" }}>{documentList.newUpload.length}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "275px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>Library</span><span style={{ float: "right" }}>{documentList.library.length}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }
}