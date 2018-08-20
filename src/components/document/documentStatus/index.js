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
        this.props.socket.emit("GET_WORKSTREAM_COUNT_LIST",{filter:{projectId:project}})
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

        return  <div class="pull-right">
                    <table>
                        <tr>
                            <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                                <span style={{float:"left"}}>New Uploads</span><span style={{float:"right"}}>{ documentList.newUpload.length }</span>
                            </td>
                            <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                                <span style={{float:"left"}}>Library</span><span style={{float:"right"}}>{documentList.library.length}</span>
                            </td>
                        </tr>
                    </table>
                </div>
               
    }
}