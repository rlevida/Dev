import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
        loggedUser: store.loggedUser,
        type: store.type
    }
})

export default class ProjectFilter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            projectStatus : "",
            typeId: ""
        }
        this.setDropDown = this.setDropDown.bind(this)
    }
    
    setDropDown(name,e) {
        this.setState({[name]:e})
       
       let myFilter = {filter:{}}

      
        if(this.state.projectStatus != "" && name != "projectStatus"){
            if( this.state.projectStatus == "Active" ){
                myFilter.filter.isActive = 1
            }else{
                myFilter.filter.projectStatus = this.state.projectStatus
            }
            
        }
        if(this.state.typeId != "" && name != "typeId"){
            myFilter.filter.typeId = this.state.typeId
        }
        if( name == "projectStatus" ){
            if(e == "Active"){
                myFilter.filter.isActive = 1
            }else if(e != ""){
                myFilter.filter.projectStatus = this.state.projectStatus
            }
        }else if( name == "typeId" ){
            if(e != ""){
                myFilter.filter[name] = e
            }
        }
       let intervalLoggedUser = setInterval(()=>{
            if(typeof this.props.loggedUser.data.id != "undefined"){
                if(this.props.loggedUser.data.userRole != "1" && this.props.loggedUser.data.userRole != "2"){
                    myFilter.filter.id = {name: "id", value: this.props.loggedUser.data.projectIds, condition: " IN "}
                }
                this.props.socket.emit("GET_PROJECT_LIST",myFilter);
                clearInterval(intervalLoggedUser)
            }
        },0)
    }

    render() {
        let { status, type, loggedUser , dispatch} = this.props
        let typeList = [ {id:"",name:"All Project Types"} ];
        let statusList = [
            {id:"",name:"All Status"},
            {id:"Active",name:"Active"},
            // {id:"On-Track",name:"On-track"},
            // {id:"Issues",name:"Issues"}
        ];
        type.List.map((e,i)=>{ if(e.linkType=="project"){typeList.push({id:e.id,name:e.type})} });


        return <div style={{float:"left",minWidth:"40%",Width:"40%"}}>
                <div class="col-md-1">
                    <span class="fa fa-filter"></span>
                </div>
                <div class="col-md-2">
                    <span>Filters:</span>
                </div>
                <div class="col-md-4">
                    <DropDown multiple={false} 
                        required={false}
                        options={ typeList } 
                        selected={this.state.typeId} 
                        onChange={(e)=>this.setDropDown("typeId",e.value)} /> 
                </div>
                <div class="col-md-4">
                    <DropDown multiple={false} 
                        required={false}
                        options={ statusList } 
                        selected={this.state.projectStatus} 
                        onChange={(e)=>this.setDropDown("projectStatus",e.value)} /> 
                </div>
                { (loggedUser.data.userRole == 1 
                                        || loggedUser.data.userRole == 2 
                                        || loggedUser.data.userRole == 3 
                                        || loggedUser.data.userRole == 4) &&
                <div class="col-md-1" >
                    <span class="fa fa-plus-circle" title="New Project" style={{cursor:"pointer",fontSize:"20px",paddingTop:"8px"}} 
                        onClick={(e)=> { 
                            dispatch({type:"SET_PROJECT_SELECTED",Selected:{}}),
                            dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })} 
                    }>
                    </span>
                </div>
                }
            </div>
    }
}