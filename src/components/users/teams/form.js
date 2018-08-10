import React from "react"
import ReactDOM from "react-dom"
import Select from 'react-select'
import moment from 'moment'

import { showToast,displayDate,setDatePicker } from '../../../globalFunction'
import { HeaderButtonContainer,HeaderButton,DropDown } from "../../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        teams: store.teams,
        loggedUser: store.loggedUser,
        role: store.role,
        global: store.global
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            nationalityList: []
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
        this.handleDate = this.handleDate.bind(this)
    }

    componentWillMount(){
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{selectName:"usersList"});
    }

    componentDidMount() {
        $(".form-container").validator();
    }

    handleDate(e) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({},teams.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({type:"SET_TEAM_SELECTED",Selected:Selected})
    }

    handleChange(e) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({},teams.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({type:"SET_TEAM_SELECTED",Selected:Selected})
    }

    handleSubmit(e) {
        let { socket, teams } = this.props

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

        if(typeof teams.Selected.avatar == "undefined" || !teams.Selected.avatar ){
            teams.Selected.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }
        socket.emit("SAVE_OR_UPDATE_TEAM",{data:teams.Selected});
    }
    
    setDropDown(name,value) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({},teams.Selected)
        Selected[name] = value;
        dispatch({type:"SET_TEAM_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        let { socket, dispatch, teams } = this.props
        let Selected = Object.assign({},teams.Selected)
        Selected[name] = JSON.stringify(values?values:[])
        dispatch({type:"SET_TEAM_SELECTED",Selected:Selected})
    }

    render() {
        let { dispatch, teams, loggedUser, role , global} = this.props
        
        let usersList = []
        if(typeof global.SelectList["usersList"] != "undefined"){
            global.SelectList["usersList"].map((e,i)=>{
                usersList.push({id:e.id,name:e.firstName + " " + e.lastName })
            })
        }

        return <div style={{marginBottom:"50px"}}>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Team {(teams.Selected.id)?" > Edit > ID: " + teams.Selected.id :" > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="team" required value={(typeof teams.Selected.team == "undefined")?"":teams.Selected.team} class="form-control" placeholder="Team" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={true} 
                                            required={false}
                                            options={ usersList } 
                                            selected={(typeof teams.Selected.users == "undefined")?[]:JSON.parse(teams.Selected.users)} 
                                            onChange={(e)=>this.setDropDownMultiple("users",e)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                            <a class="btn btn-primary" style={{float:"left",cursor:"pointer",margin:"10px"}}  onClick={(e)=>{
                                        dispatch({type:"SET_TEAM_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({type:"SET_TEAM_SELECTED", Selected: {} });
                                    }} ><span>Back</span>
                            </a>
                            <a class="btn btn-primary" style={{float:"right",cursor:"pointer",margin:"10px"}}   onClick={this.handleSubmit}  >
                                <span>Save</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    }
}