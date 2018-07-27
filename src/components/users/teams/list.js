import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)

        this.deleteData = this.deleteData.bind(this)
        this.handleSelectCompany = this.handleSelectCompany.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_TEAM_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_TEAM_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_TEAM",{data : {id:id,isActive:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_TEAM",{id:id})
        }
    }

    handleSelectCompany(e){
        let { socket, teams, dispatch } = this.props;
    }

    render() {
        let { teams, dispatch, socket } = this.props;

        return <div>
                <a class="btn btn-primary" style={{float:"right",cursor:"pointer",margin:"10px"}} onClick={(e)=>dispatch({type:"SET_TEAM_FORM_ACTIVE", FormActive: "Form" })} ><span>New Team</span></a>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Team</th>
                            <th></th>
                        </tr>
                        {
                            (teams.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={5}>No Record Found!</td>
                            </tr>
                        }
                        {
                            teams.List.map((data, index) => {
                                return <tr key={index}>
                                        <td>{data.id}</td>
                                        <td>{data.team}</td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT" 
                                                onClick={(e) => socket.emit("GET_TEAM_DETAIL",{id:data.id})}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete==0?'hide':'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
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