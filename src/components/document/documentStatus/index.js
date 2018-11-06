import React from "react"
import ReactDOM from "react-dom"

import { showToast, getData } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        global: store.global,
        loggedUser: store.loggedUser
    }
})

export default class DocumentStatus extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let { dispatch, loggedUser } = this.props;
        getData(`/api/document/getDocumentCount?isDeleted=0&linkId=${project}&linkType=project&status=new&userId=${loggedUser.data.id}&userType=${loggedUser.data.userType}`, {}, (c) => {
            dispatch({ type: "SET_DOCUMENT_NEW_UPLOAD_COUNT", Count: c.data.newUploadCount })
        })
    }

    render() {
        let { document } = this.props
        let documentList = { newUpload: [], library: [] };

        return <div class="pull-right">
            <table>
                <tbody>
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>New Uploads</span><span >{document.NewUploadCount}</span>
                        </td>
                        <td style={{ marginLeft: "20px", padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>By email</span><span style={{ float: "right" }}>0</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

    }
}