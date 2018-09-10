import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser
    }
})

export default class ProjectStatus extends React.Component {
    constructor(props) {
        super(props)
        this.state = {

        }
    }

    componentWillMount() {
        let countInterval = setInterval(() => {
            let { loggedUser } = this.props
            if (typeof loggedUser.data.userRole != "undefined") {
                let filter = {}
                if (loggedUser.data.userRole != "1" && loggedUser.data.userRole != "2") {
                    filter = { filter: { projectIds: loggedUser.data.projectIds } }
                }
                this.props.socket.emit("GET_PROJECT_COUNT_LIST", filter)
                clearInterval(countInterval);
            }
        }, 1000)
    }

    render() {
        let data = {
            Client: { Active: 0, OnTrack: 0, Issues: 0 },
            Internal: { Active: 0, OnTrack: 0, Issues: 0 },
            Private: { Active: 0, OnTrack: 0, Issues: 0 }
        }

        this.props.project.CountList.map((e, i) => {
            data[e.type] = {
                Active: (typeof e.Active != "undefined") ? e.Active : 0,
                OnTrack: (typeof e.OnTrack != "undefined") ? e.OnTrack : 0,
                Issues: (typeof e.Issues != "undefined") ? e.Issues : 0
            }
        })

        return <div style={this.props.style}>
            <table>
                <tr>
                    <td style={{ padding: "10px 5px", width: "120px" }}>Client</td>
                    <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                        <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{(data.Client.Active - data.Client.Issues) + data.Client.Issues}</span>
                    </td>
                    <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                        <span style={{ float: "left" }}>On-track</span><span style={{ float: "right" }}>{data.Client.Active - data.Client.Issues}</span>
                    </td>
                    <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                        <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.Client.Issues}</span>
                    </td>
                </tr>
                {typeof this.props.loggedUser.data.userRole != "undefined" &&
                    (this.props.loggedUser.data.userRole == "1" ||
                        this.props.loggedUser.data.userRole == "2" ||
                        this.props.loggedUser.data.userRole == "3" ||
                        this.props.loggedUser.data.userRole == "4") &&
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Internal</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{(data.Internal.Active - data.Internal.Issues) + data.Internal.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>On-track</span><span style={{ float: "right" }}>{data.Internal.Active - data.Internal.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.Internal.Issues}</span>
                        </td>
                    </tr>
                }
                {typeof this.props.loggedUser.data.userRole != "undefined" &&
                    (this.props.loggedUser.data.userRole == "1" ||
                        this.props.loggedUser.data.userRole == "2" ||
                        this.props.loggedUser.data.userRole == "3" ||
                        this.props.loggedUser.data.userRole == "4") &&
                    <tr>
                        <td style={{ padding: "10px 5px", width: "120px" }}>Private</td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#4e9cde", color: "white" }}>
                            <span style={{ float: "left" }}>Active</span><span style={{ float: "right" }}>{(data.Private.Active - data.Private.Issues) + data.Private.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "120px", backgroundColor: "#9eca9f", color: "white" }}>
                            <span style={{ float: "left" }}>On-track</span><span style={{ float: "right" }}>{data.Private.Active - data.Private.Issues}</span>
                        </td>
                        <td style={{ padding: "10px 5px", width: "80px", backgroundColor: "#d4a2a2", color: "white" }}>
                            <span style={{ float: "left" }}>Issues</span><span style={{ float: "right" }}>{data.Private.Issues}</span>
                        </td>
                    </tr>
                }

            </table>
        </div>
    }
}