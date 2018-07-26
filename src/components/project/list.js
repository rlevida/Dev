import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
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
        this.props.socket.emit("GET_PROJECT_LIST",{});
        this.props.socket.emit("GET_STATUS_LIST",{});
        this.props.socket.emit("GET_TYPE_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_PROJECT_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_PROJECT",{data : {id:id,isActive:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_PROJECT",{id:id})
        }
    }

    render() {
        let { project, dispatch, socket } = this.props;
        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Project</span>
                    </li>
                </HeaderButtonContainer>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>Status</th>
                            <th>Project</th>
                            <th>Type</th>
                            <th>New Docs</th>
                            <th>Notification</th>
                            <th>Active Workstream</th>
                            <th>Late Workstream</th>
                            <th></th>
                        </tr>
                        {
                            (project.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            project.List.map((data, index) => {
                                return <tr key={index}>
                                        <td>{data.status_status}</td>
                                        <td><a href={"/project/"+data.id}>{data.project}</a></td>
                                        <td>{data.type_type}</td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td></td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT" 
                                                onClick={(e) => socket.emit("GET_PROJECT_DETAIL",{id:data.id})}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete==0?'hide':'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            {/*<OnOffSwitch Active={data.isActive} Action={()=>this.updateActiveStatus(data.id,data.isActive)} />*/}
                                            <Tooltip />
                                        </td>
                                    </tr>
                            })
                        }
                    </tbody>
                </table>
            </div>
    }
}