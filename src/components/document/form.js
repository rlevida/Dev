import React from "react"
import ReactDOM from "react-dom"
import Select from 'react-select'
import moment from 'moment'

import { showToast,displayDate,setDatePicker } from '../../globalFunction'
import { HeaderButtonContainer,HeaderButton,DropDown } from "../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
    }

    componentDidMount() {
        $(".form-container").validator();
    }

    handleChange(e) {
        let { socket, dispatch, document } = this.props
        let Selected = Object.assign({},document.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({type:"SET_DOCUMENT_SELECTED",Selected:Selected})
    }

    handleSubmit(e) {
        let { socket, document } = this.props

        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function(){
            if($(this).hasClass('has-error')){
                result = false;
            }
        });
        if(!result){
            showToast("error","Form did not fullfill the required value.")
            return;
        }

        socket.emit("SAVE_OR_UPDATE_document",{data:document.Selected});
    }
    
    setDropDown(name,value) {
        let { socket, dispatch, document } = this.props
        let Selected = Object.assign({},document.Selected)
        Selected[name] = value;
        dispatch({type:"SET_DOCUMENT_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        this.setState({
            [name]: JSON.stringify(values?values:[])
        });
    }

    render() {
        let { dispatch, document, loggedUser, status, type } = this.props

        let statusList = [], typeList = []
        status.List.map((e,i)=>{ if(e.linkType=="document"){statusList.push({id:e.id,name:e.status})} })
        type.List.map((e,i)=>{ if(e.linkType=="document"){typeList.push({id:e.id,name:e.type})} })

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        dispatch({type:"SET_DOCUMENT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_DOCUMENT_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li>
                <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li>
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">DOCUMENT {(document.Selected.id)?" > Edit > ID: " + document.Selected.id:" > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Status</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false} 
                                            required={false}
                                            options={ statusList } 
                                            selected={(typeof document.Selected.statusId == "undefined")?"":document.Selected.statusId} 
                                            onChange={(e)=>this.setDropDown("statusId",e.value)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Document *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="origin" required value={(typeof document.Selected.origin == "undefined")?"":document.Selected.origin} class="form-control" placeholder="Document" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Type</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false} 
                                            required={false}
                                            options={ typeList } 
                                            selected={(typeof document.Selected.typeId == "undefined")?"":document.Selected.typeId} 
                                            onChange={(e)=>this.setDropDown("typeId",e.value)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}