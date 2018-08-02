import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
    }
})

export default class ProjectStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    render() {
        return <div style={{float:"right",padding:"20px"}}>
                <table>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Client</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"80px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>0</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Internal</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>0</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Private</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>0</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>0</span>
                        </td>
                    </tr>
                </table>
            </div>
    }
}