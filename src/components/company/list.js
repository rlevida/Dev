import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        company: store.company,
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
        this.props.socket.emit("GET_COMPANY_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_COMPANY_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_COMPANY",{data : {id:id,active:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_COMPANY",{id:id})
        }
    }

    render() {
        let { company, dispatch, socket } = this.props;
        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_COMPANY_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Company</span>
                    </li>
                </HeaderButtonContainer>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>ID</th>
                            <th>Company Name</th>
                            <th>Industry</th>
                            <th></th>
                        </tr>
                        {
                            (company.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={5}>No Record Found!</td>
                            </tr>
                        }
                        {
                            company.List.map((data, index) => {
                                return <tr key={index}>
                                        <td>{lpad(data.id+"","0","4")}</td>
                                        <td>{data.companyName}</td>
                                        <td>{data.industry}</td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="EDIT" 
                                                onClick={(e) => socket.emit("GET_COMPANY_DETAIL",{id:data.id})}
                                                class="btn btn-info btn-sm">
                                                <span class="glyphicon glyphicon-pencil"></span></a>
                                            <a href="javascript:void(0);" data-tip="DELETE"
                                                onClick={e => this.deleteData(data.id)}
                                                class={data.allowedDelete==0?'hide':'btn btn-danger btn-sm ml10'}>
                                                <span class="glyphicon glyphicon-trash"></span></a>
                                            {/*<OnOffSwitch Active={data.active} Action={()=>this.updateActiveStatus(data.id,data.active)} />*/}
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