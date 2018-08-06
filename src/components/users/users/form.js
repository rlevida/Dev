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
        users: store.users,
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
        this.props.socket.emit("GET_APPLICATION_SELECT_LIST",{selectName:"teamList"});
    }

    componentDidMount() {
        $(".form-container").validator();
        setDatePicker(this.handleDate, "birthday");
    }

    componentDidUpdate(){
        setDatePicker(this.handleDate, "birthday");
    }

    handleDate(e) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({},users.Selected)
        Selected[e.target.name] = e.target.value + " UTC";
        dispatch({type:"SET_USER_SELECTED",Selected:Selected})
    }

    handleChange(e) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({},users.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({type:"SET_USER_SELECTED",Selected:Selected})
    }

    handleSubmit(e) {
        let { socket, users } = this.props

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

        if(typeof users.Selected.avatar == "undefined" || !users.Selected.avatar ){
            users.Selected.avatar = "https://s3-ap-northeast-1.amazonaws.com/marine-performer/avatars/user.png";
        }
        users.Selected.firstName = users.Selected.firstName.trim()
        users.Selected.lastName = users.Selected.lastName.trim()
        socket.emit("SAVE_OR_UPDATE_USER",{data:users.Selected});
    }
    
    setDropDown(name,value) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({},users.Selected)
        Selected[name] = value;

        if(name == "userType"){
            Selected["userRole"] = ""
        }
        dispatch({type:"SET_USER_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        let { socket, dispatch, users } = this.props
        let Selected = Object.assign({},users.Selected)
        Selected[name] = JSON.stringify(values?values:[])
        dispatch({type:"SET_USER_SELECTED",Selected:Selected})
    }

    render() {
        let { dispatch, users, loggedUser, role , global} = this.props
        let userType = [{ id:"Internal", name : "Internal" },{ id:"External", name : "External" }];

        let userRole = []
        role.List.map((e,i)=>{
            if( e.roleType == users.Selected.userType ){
                console.log(e.id,loggedUser.data.userRole,loggedUser.data.userRole == 3, (e.id == 1 || e.id == 2 || e.id == 3 ));
                if(loggedUser.data.userRole == 2 && e.id == 1){ 
                    // master admin can be created by master admin only
                }else if(loggedUser.data.userRole == 3 && (e.id == 1 || e.id == 2 || e.id == 3 )){ 
                    // manager can only create standard user and external user
                }else{
                    userRole.push({id:e.id,name:e.role})
                }
            }
        })

        let teamList = []
        if(typeof global.SelectList["teamList"] != "undefined"){
            global.SelectList["teamList"].map((e,i)=>{
                teamList.push({id:e.id,name:e.team})
            })
        }
        


        return <div>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">User {(users.Selected.id)?" > Edit > ID: " + users.Selected.id :" > Add"}</h3>
                        </div>
                        <div class="panel-body">
                            <form onSubmit={this.handleSubmit} class="form-horizontal form-container">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">User Id *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="username" required value={(typeof users.Selected.username == "undefined")?"":users.Selected.username} class="form-control" placeholder="User Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Email Address *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="email" name="emailAddress" required value={(typeof users.Selected.emailAddress == "undefined")?"":users.Selected.emailAddress} class="form-control" placeholder="email Address" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Name *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="text" name="firstName" required value={(typeof users.Selected.firstName != "undefined" && users.Selected.firstName)?users.Selected.firstName:""} class="form-control" placeholder="Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Family Name</label>
                                    <div class="col-md-7 col-xs-text">
                                        <input type="text" name="lastName" value={(typeof users.Selected.lastName != "undefined" && users.Selected.lastName)?users.Selected.lastName:""} class="form-control" placeholder="Family Name" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Phone No.</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="number" name="phoneNumber" value={(typeof users.Selected.phoneNumber != "undefined" && users.Selected.phoneNumber)?users.Selected.phoneNumber:"" } class="form-control" placeholder="Phone Number" onChange={this.handleChange} />
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">User Type *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false} 
                                            required={true}
                                            options={ userType } 
                                            selected={(typeof users.Selected.userType == "undefined")?"":users.Selected.userType} 
                                            onChange={(e)=>this.setDropDown("userType",e.value)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">User Role *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={false} 
                                            required={true}
                                            options={ userRole } 
                                            selected={(typeof users.Selected.userRole == "undefined")?"":users.Selected.userRole} 
                                            onChange={(e)=>this.setDropDown("userRole",e.value)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Team *</label>
                                    <div class="col-md-7 col-xs-12">
                                        <DropDown multiple={true} 
                                            required={false}
                                            options={ teamList } 
                                            selected={(typeof users.Selected.team == "undefined")?[]:JSON.parse(users.Selected.team)} 
                                            onChange={(e)=>this.setDropDownMultiple("team",e)} /> 
                                        <div class="help-block with-errors"></div>
                                    </div>
                                </div>
                            </form>
                            
                            <a class="btn btn-primary" style={{float:"left",cursor:"pointer",margin:"10px"}}  onClick={(e)=>{
                                        dispatch({type:"SET_USER_FORM_ACTIVE", FormActive: "List" });
                                        dispatch({type:"SET_USER_SELECTED", Selected: {} });
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