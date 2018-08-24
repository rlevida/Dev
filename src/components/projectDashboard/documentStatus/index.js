import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document : store.document        
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
            socket.emit("GET_WORKSTREAM_COUNT_LIST",{filter:{projectId:project}})
            socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted : 0 , linkId : project , linkType : "project" }});
    }

    render() {
        let { document } = this.props
        let documentList = { newUpload : [] , library : [] };

            if( document.List.length > 0 ){
                document.List.filter( e =>{
                    if( e.status == "new" && e.isCompleted != 1 ){
                        documentList.newUpload.push(e)
                    }
                    if( e.status == "library" && e.isCompleted != 1 ){
                        documentList.library.push(e)
                    }
                })
            }

        return  <div class="col-lg-6 col-md-6 col-sm-6">
                    <h3>Documents 
                        <a class="pull-right" style={{fontSize: "14px" , marginTop: "10px" , textDecoration: "none"}} href={"/project/documents/"+project}> + More</a>
                    </h3>
                    <table>
                        <tr>
                            <td style={{padding:"10px 5px",width:"275px",backgroundColor:"#4e9cde",color:"white"}}>
                                <span style={{float:"left"}}>New Uploads</span><span style={{float:"right"}}>{ documentList.newUpload.length }</span>
                            </td>
                            <td style={{padding:"10px 5px",width:"275px",backgroundColor:"#9eca9f",color:"white"}}>
                                <span style={{float:"left"}}>Library</span><span style={{float:"right"}}>{documentList.library.length}</span>
                            </td>
                        </tr>
                    </table>
                </div>
    }
}