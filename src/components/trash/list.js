import React from "react";
import Tooltip from "react-tooltip";
import { showToast,displayDate,numberFormat } from '../../globalFunction';
import { HeaderButtonContainer,HeaderButton, DropDown, OnOffSwitch } from "../../globalComponents";
import moment from 'moment'
import FileUpload from 'react-fileupload';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            tempData : []
        }
        this.deleteData = this.deleteData.bind(this)
        this.updateActiveStatus = this.updateActiveStatus.bind(this)
    }

    componentWillMount() {
        this.props.socket.emit("GET_DOCUMENT_LIST", { filter : { isDeleted : 1 , linkId : project , linktype : "project" }});
        this.props.socket.emit("GET_STATUS_LIST",{});
        this.props.socket.emit("GET_TYPE_LIST",{});
    }

    updateActiveStatus(id,active){
        let { socket, dispatch } = this.props;
        dispatch({type:"SET_DOCUMENT_STATUS",record:{id:id,status:(active==1)?0:1}})
        socket.emit("SAVE_OR_UPDATE_DOCUMENT",{data : {id:id,active:(active==1)?0:1}})
    }

    deleteData(id){
        let { socket } = this.props;
        if(confirm("Do you really want to delete this record?")){
            socket.emit("DELETE_DOCUMENT",{id:id})
        }
    }

    saveData(){
        let { socket } = this.props
        let { tempData } = this.state
        socket.emit("SAVE_OR_UPDATE_DOCUMENT", { data:tempData , loggedUser : "" })
    }

    undoData(){

    }

    render() {
        let { document, dispatch, socket } = this.props;
        let data = [] , tempData = []
        return <div>
                <HeaderButtonContainer  withMargin={true}>
                    <li class="btn btn-info" onClick={(e)=>dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "Form" })} >
                        <span>New Document</span>
                    </li>
                </HeaderButtonContainer>
                <table id="dataTable" class="table responsive-table">
                    <tbody>
                        <tr>
                            <th>Name</th>
                            <th>Uploaded</th>
                            <th>By</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                        {
                            (document.List.length == 0) &&
                            <tr>
                                <td style={{textAlign:"center"}} colSpan={8}>No Record Found!</td>
                            </tr>
                        }
                        {
                            document.List.map((data, index) => {
                                return <tr key={index}>
                                        <td>{data.origin}</td>
                                        <td>{ moment(data.dateAdded).format('L') }</td>
                                        <td>{data.uploadedBy}</td>
                                        <td><i class="fa fa-tag" aria-hidden="true"></i></td>
                                        <td class="text-center">
                                            <a href="javascript:void(0);" data-tip="Undo"
                                                onClick={e => this.undoData(data.id)}
                                                class={ data.allowedDelete==0 ? 'hide' : 'btn btn-primary btn-sm ml10' }>
                                                <span class="glyphicon glyphicon-refresh"></span></a>
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