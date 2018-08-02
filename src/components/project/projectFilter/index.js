import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'
import { DropDown } from "../../../globalComponents"

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        status: store.status,
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
       this.props.socket.emit("GET_PROJECT_LIST",myFilter);
    }

    render() {
        let { status, type } = this.props
        let typeList = [ {id:"",name:"All Project Types"} ];
        let statusList = [
            {id:"",name:"All Status"},
            {id:"Active",name:"Active"},
            {id:"On-Track",name:"On-track"},
            {id:"Issues",name:"Issues"}
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
                <div class="col-md-1" >
                    <span class="fa fa-plus-circle" title="New Project" style={{cursor:"pointer",fontSize:"20px",paddingTop:"8px"}} onClick={(e)=>this.props.dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "Form" })}></span>
                </div>
            </div>
    }
}