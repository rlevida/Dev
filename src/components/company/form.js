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
        company: store.company,
        loggedUser: store.loggedUser
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
        let { socket, dispatch, company } = this.props
        let Selected = Object.assign({},company.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({type:"SET_COMPANY_SELECTED",Selected:Selected})
    }

    handleSubmit(e) {
        let { socket, company } = this.props

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

        socket.emit("SAVE_OR_UPDATE_COMPANY",{data:company.Selected});
    }
    
    setDropDown(name,value) {
        let { socket, dispatch, company } = this.props
        let Selected = Object.assign({},company.Selected)
        Selected[name] = value;
        dispatch({type:"SET_COMPANY_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        this.setState({
            [name]: JSON.stringify(values?values:[])
        });
    }

    render() {
        let { dispatch, company, loggedUser } = this.props

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        dispatch({type:"SET_COMPANY_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_COMPANY_SELECTED", Selected: {} });
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
                            <h3 class="panel-title">Company {(company.Selected.id)?" > Edit > ID: " + lpad(company.Selected.id+"","0","4"):" > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Company Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="companyName" required value={(typeof company.Selected.companyName == "undefined")?"":company.Selected.companyName} class="form-control" placeholder="Company Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Industry</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="industry" value={(typeof company.Selected.industry == "undefined")?"":company.Selected.industry} class="form-control" placeholder="Industry" onChange={this.handleChange} />
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