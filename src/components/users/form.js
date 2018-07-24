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
        users: store.users,
        loggedUser: store.loggedUser,
        position: store.position,
        company: store.company,
        branch: store.branch,
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

        if( name == "companyId" ){
            Selected["positionId"] = ""
            Selected["branchId"] = ""
        }
        if(name == "userType"){
            setDatePicker(this.handleDate, "birthday");
        }
        dispatch({type:"SET_USER_SELECTED",Selected:Selected})
    }

    setDropDownMultiple(name,values) {
        this.setState({
            [name]: JSON.stringify(values?values:[])
        });
    }

    render() {
        let { dispatch, users, loggedUser, company, position, branch , global} = this.props
        let userType = [];
        if( typeof loggedUser.data.userType != "undefined" && loggedUser.data.userType == "admin" ){
            userType.push({ id:"admin", name : "Admin" });
            userType.push({ id: "trainer", name : "Trainer" });
            userType.push({ id: "participant", name : "Participant" });
        }
        if( typeof loggedUser.data.userType != "undefined" && loggedUser.data.userType == "trainer" ){
            userType.push({ id: "participant", name : "Participant" });
        }

        return <div>
            <HeaderButtonContainer withMargin={true}>
                <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        dispatch({type:"SET_USER_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_USER_SELECTED", Selected: {} });
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
                                        <input type="email" name="email" required value={(typeof users.Selected.email == "undefined")?"":users.Selected.email} class="form-control" placeholder="Email" onChange={this.handleChange} />
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
                                { (typeof users.Selected.userType != "undefined" && users.Selected.userType == "participant") &&
                                    <div>
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
                                            <label class="col-md-3 col-xs-12 control-label">tel</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="number" name="tel" value={(typeof users.Selected.tel != "undefined" && users.Selected.tel)?users.Selected.tel:"" } class="form-control" placeholder="Phone Number" onChange={this.handleChange} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Birthday: </label>
                                            <div class="col-md-7 col-xs-12">
                                                <div class="input-group date">
                                                    <input type="text"
                                                        class="form-control datepicker"
                                                        style={{ backgroundColor: "#eee" }}
                                                        id="birthday"
                                                        name="birthday"
                                                        value={(typeof users.Selected.birthday != "undefined" && users.Selected.birthday)?displayDate(users.Selected.birthday):""}
                                                        onChange={() => { }}
                                                        required={false}
                                                    />
                                                    <span class="input-group-addon"><span class="glyphicon glyphicon-time"></span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div class="help-block with-errors"></div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Nationality</label>
                                            <div class="col-md-7 col-xs-text">
                                                <DropDown multiple={false} 
                                                    required={false}
                                                    options={ global.NationalityList } 
                                                    selected={(typeof users.Selected.nationality == "undefined")?"":users.Selected.nationality} 
                                                    onChange={(e)=>this.setDropDown("nationality",e.value)} /> 
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Company</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown multiple={false} 
                                                    required={false}
                                                    options={ company.List.map((e,i)=>{ return {id:e.id,name:e.companyName}}) } 
                                                    selected={(typeof users.Selected.companyId == "undefined")?"":users.Selected.companyId} 
                                                    onChange={(e)=>this.setDropDown("companyId",e.value)} /> 
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                    </div>
                                }
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}