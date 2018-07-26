import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
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
        this.props.socket.emit("GET_USER_LIST",{});
        this.props.socket.emit("GET_ROLE_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_USER_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_USER",{data : {id:id,isActive:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_USER",{id:id})
        }
    }

    handleSelectCompany(e){
        let { socket, users, dispatch } = this.props;
    }

    render() {
        let { users, dispatch, socket } = this.props;

        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_USER_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Users</span>
                    </li>
                </HeaderButtonContainer>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>User Id</th>
                            <th>Email Address</th>
                            <th>Type</th>
                            <th></th>
                        </tr>
                        {
                            (users.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={5}>No Record Found!</td>
                            </tr>
                        }
                        {
                            users.List.map((data, index) => {
                                return <tr key={index}>
                                        <td>{data.id}</td>
                                        <td>{data.username}</td>
                                        <td>{data.emailAddress}</td>
                                        <td>{data.userType}</td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT" 
                                                onClick={(e) => socket.emit("GET_USER_DETAIL",{id:data.id})}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete==0?'hide':'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            <a href="javascript:void(0);"
                                                data-tip='CHANGE PASSWORD'
                                                onClick={e => {
                                                    dispatch({type:"SET_USER_ID", SelectedId : data.id}) 
                                                    dispatch({type: "SET_USER_FORM_ACTIVE", FormActive: "ChangePassword" })
                                                }} class="btn btn-info btn-sm ml10">
                                                <span class="glyphicon glyphicon-lock"></span>
                                            </a>
                                            <OnOffSwitch Active={data.isActive} Action={()=>this.updateActiveStatus(data.id,data.isActive)} />
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