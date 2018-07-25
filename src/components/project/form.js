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
        project: store.project,
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
        let { socket, dispatch, project } = this.props
        let Selected = Object.assign({},project.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({type:"SET_PROJECT_SELECTED",Selected:Selected})
    }

    handleSubmit(e) {
        let { socket, project } = this.props

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

        socket.emit("SAVE_OR_UPDATE_PROJECT",{data:project.Selected});
    }
    
    setDropDown(name,value) {
        let { socket, dispatch, project } = this.props
        let Selected = Object.assign({},project.Selected)
        Selected[name] = value;
        dispatch({type:"SET_PROJECT_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        this.setState({
            [name]: JSON.stringify(values?values:[])
        });
    }

    render() {
        let { dispatch, project, loggedUser } = this.props

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_PROJECT_SELECTED", Selected: {} });
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
                            <h3 class="panel-title">Project {(project.Selected.id)?" > Edit > ID: " + project.Selected.id:" > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Project *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="project" required value={(typeof project.Selected.project == "undefined")?"":project.Selected.project} class="form-control" placeholder="Project" onChange={this.handleChange} />
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