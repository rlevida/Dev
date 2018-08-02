import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
    }
})

export default class ProjectStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            
        }
    }

    componentWillMount() {
        this.props.socket.emit("GET_PROJECT_COUNT_LIST",{})
    }

    render() {
        let data = { Client : { Active : 0, OnTrack: 0, Issues: 0}, 
                    Internal: { Active : 0, OnTrack: 0, Issues: 0}, 
                    Private: { Active : 0, OnTrack: 0, Issues: 0} }
        
        this.props.project.CountList.map((e,i)=>{
            data[e.type] = { Active : (typeof e.Active != "undefined")?e.Active:0, 
                            OnTrack: (typeof e.OnTrack != "undefined")?e.OnTrack:0, 
                            Issues: (typeof e.Issues != "undefined")?e.Issues:0}
        })

        return <div style={this.props.style}>
                <table>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Client</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>{data.Client.Active}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>{data.Client.OnTrack}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"80px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>{data.Client.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Internal</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>{data.Internal.Active}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>{data.Internal.OnTrack}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"80px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>{data.Internal.Issues}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style={{padding:"10px 5px",width:"120px"}}>Private</td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#4e9cde",color:"white"}}>
                            <span style={{float:"left"}}>Active</span><span style={{float:"right"}}>{data.Private.Active}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"120px",backgroundColor:"#9eca9f",color:"white"}}>
                            <span style={{float:"left"}}>On-track</span><span style={{float:"right"}}>{data.Private.OnTrack}</span>
                        </td>
                        <td style={{padding:"10px 5px",width:"80px",backgroundColor:"#d4a2a2",color:"white"}}>
                            <span style={{float:"left"}}>Issues</span><span style={{float:"right"}}>{data.Private.Issues}</span>
                        </td>
                    </tr>
                </table>
            </div>
    }
}