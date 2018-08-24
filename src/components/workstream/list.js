import React from "react";
import Tooltip from "react-tooltip";
import { HeaderButtonContainer } from "../../globalComponents";
import WorkstreamStatus from "./workstreamStatus"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_WORKSTREAM_LIST", { filter: { projectId: project } });
        this.props.socket.emit("GET_STATUS_LIST", {});
        this.props.socket.emit("GET_TYPE_LIST", {});
        this.props.socket.emit("GET_USER_LIST",{});
        this.props.socket.emit("GET_TEAM_LIST",{});
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "tagList" , filter : { tagType : "document" } })
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "ProjectMemberList" , filter : { linkId : project, linkType: "project" } })
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{ selectName : "taskFollowerList" , filter : { linkType: "task", memberType : "Follower" } })
    }

    updateActiveStatus(id, active) {
        let { socket, dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_STATUS", record: { id: id, status: (active == 1) ? 0 : 1 } })
        socket.emit("SAVE_OR_UPDATE_WORKSTREAM", { data: { id: id, active: (active == 1) ? 0 : 1 } })
    }

    deleteData(id) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_WORKSTREAM", { id: id })
        }
    }

    render() {
        let { workstream, dispatch, socket , loggedUser } = this.props;
        return <div>
            
            <WorkstreamStatus style={{float:"right",padding:"20px"}} />
            <HeaderButtonContainer withMargin={true}>
            { (loggedUser.data.userRole == 1 
                || loggedUser.data.userRole == 2 
                || loggedUser.data.userRole == 3 
                || loggedUser.data.userRole == 4) &&
                    <li class="btn btn-info" onClick={(e) => dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Workstream</span>
                    </li>
            }
            </HeaderButtonContainer>
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th style={{textAlign:"center"}}>Workstream</th>
                        <th style={{textAlign:"center"}}>Pending</th>
                        <th style={{textAlign:"center"}}>Completed</th>
                        <th style={{textAlign:"center"}}>Issues</th>
                        <th style={{textAlign:"center"}}>New Docs</th>
                        <th style={{textAlign:"center"}}>Members</th>
                        <th style={{textAlign:"center"}}>Type</th>
                        { (loggedUser.data.userRole == 1 
                            || loggedUser.data.userRole == 2 
                            || loggedUser.data.userRole == 3 
                            || loggedUser.data.userRole == 4) &&
                                <th></th>
                        }
                    </tr>
                    {
                        (workstream.List.length == 0) &&
                        <tr>
                            <td style={{ textAlign: "center" }} colSpan={8}>No Record Found!</td>
                        </tr>
                    }
                    {
                        workstream.List.map((data, index) => {
                            return <tr key={index}>
                                <td>{(data.isActive == 0) && <span class="fa fa-exclamation-circle fa-lg" style={{color:"#000"}}></span>}{(data.isActive == 1)?<span class="fa fa-exclamation-circle fa-lg" style={{color:(data.Issues>0)?"#d4a2a2":(data.OnTrack>0)?"#dee054d9":"#9eca9f"}}></span>:""}</td>
                                <td>{data.workstream}</td>
                                <td>{data.OnTrack}</td>
                                <td>{data.Completed}</td>
                                <td>{data.Issues}</td>
                                <td></td>
                                <td><span style={{color:"#46b8da"}}><i class="fa fa-user fa-lg"></i></span>&nbsp;&nbsp;<span style={{color:"#006400"}}><i class="fa fa-user fa-lg"></i></span></td>
                                <td><span class={data.type_type=="Project - Output base"?"fa fa-calendar":"glyphicon glyphicon-time"}></span></td>
                                <td><span><i class="fa fa-users fa-lg"></i></span></td>
                                { (loggedUser.data.userRole == 1 
                                    || loggedUser.data.userRole == 2 
                                    || loggedUser.data.userRole == 3 
                                    || loggedUser.data.userRole == 4) &&
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT"
                                                onClick={(e) => socket.emit("GET_WORKSTREAM_DETAIL", { id: data.id })}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete == 0 ? 'hide' : 'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            <Tooltip />
                                        </td>
                                }
                            </tr>
                        })
                    }
                </tbody>
            </table>
        </div>
    }
}