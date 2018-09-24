import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document : store.document,
        global : store.global,
        loggedUser : store.loggedUser        
    }
})

export default class DocumentStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    componentWillMount() {
        this.props.socket.emit("GET_WORKSTREAM_COUNT_LIST",{filter:{projectId:project}})
    }

    render() {
        let { document , global , loggedUser } = this.props
        let documentList = { newUpload : [] , library : [] };

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

                // if (e.status == "library") {
                //     if (loggedUser.data.userType == "Internal") {
                //         documentList.library.push(e)
                //     } else {
                //         if (e.folderId != null) {
                //             let isShared = global.SelectList.shareList.filter(s => {
                //                 return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.folderId && s.shareType == "folder" && e.status == "library"
                //             }).length ? 1 : 0
                //             if (isShared || loggedUser.data.id == e.uploadedBy) {
                //                 documentList.library.push(e)
                //             }
                //         } else {
                //             let isShared = global.SelectList.shareList.filter(s => { return s.userTypeLinkId == loggedUser.data.id && s.shareId == e.id && s.shareType == "document" && e.status == "library" }).length ? 1 : 0
                //             if (isShared || loggedUser.data.id == e.uploadedBy) {
                //                 documentList.library.push(e)
                //             }
                //         }
                //     }
                // }
            })
        }
        return  <div class="pull-right">
                    <table>
                        <tbody>
                            <tr>
                                <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                                    <span style={{float:"left"}}>New Uploads</span><span >{ documentList.newUpload.length }</span>
                                </td>
                                <td style={{ marginLeft: "20px",padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                                    <span style={{float:"left"}}>By email</span><span style={{float:"right"}}>0</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
               
    }
}