import React from "react"

import { showToast, postData } from '../../../globalFunction'
import { HeaderButtonContainer, DropDown } from "../../../globalComponents"

import { connect } from "react-redux";
import _ from "lodash";

@connect((store) => {
    return {
        socket: store.socket.container,
        users: store.users,
        members: store.members,
        teams: store.teams,
        project: store.project,
        loggedUser: store.loggedUser,
        global: store.global
    }
})

export default class MembersForm extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            showAllUsers : false
        }
        this.handleSubmit = this.handleSubmit.bind(this)
        this.setDropDown = this.setDropDown.bind(this)
    }

    handleSubmit(e) {
        let { socket, members, type, dispatch, project, users , teams , global } = this.props
        let result = true;

        $('.member-form-container *').validator('validate');
        $('.member-form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });
        
        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

        if (_.has(members.Selected, 'userTypeLinkId') == false || members.Selected.userTypeLinkId == '') {
            showToast("error", "All members are assigned.")
            return;
        }
        members.Selected.memberType = 1;

        let dataToSubmit = {
            usersType: members.Selected.type,
            userTypeLinkId: members.Selected.userTypeLinkId,
            linkType: "project",
            linkId: project.Selected.id,
            memberType: 'assignedTo'
        }

        postData(`/api/project/projectMember`, { data: dataToSubmit }, (c) => {
           if(members.Selected.type == "users"){
                dispatch({type:"ADD_MEMBER_TO_LIST", list : c.data })
           }else{
                dispatch({type:"ADD_TEAM_TO_LIST", list : c.data })
           }
           showToast("success","Successfully Added.")
           dispatch({type:"SET_MEMBERS_SELECTED", Selected: {}})
           this.setState({ showAllUsers: false })
        })
    }

    setDropDown(name, value) {
        let { dispatch, members } = this.props
        let Selected = { ...members.Selected }

        if (name == 'type') {
            Selected = {
                ...Selected,
                [name]: value,
                userTypeLinkId: '',
                memberType: ''
            }
        } else {
            Selected = {
                ...Selected,
                [name]: value
            }
        }

        dispatch({ type: "SET_MEMBERS_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }
    
    render() {
        let { users, members, teams, project, loggedUser, global } = this.props;
        let { showAllUsers } = this.state
        let memberList = []

        if(typeof members.Selected.type != "undefined"){
            if(members.Selected.type == 'users'){
                if(!showAllUsers){
                    global.SelectList.teamList.map((e) => {
                        if(e.teamLeaderId == loggedUser.data.id && e.users_team.length > 0){
                            e.users_team.map((t) => {
                                let index = _.findIndex(members.List,{ userTypeLinkId : t.user.id })
                                if(index < 0){
                                    memberList.push({ id: t.user.id , name:`${t.user.firstName} ${t.user.lastName}`})
                                }
                            })
                        }
                    })
                }else{
                    users.List.map((e) => {
                        let index = _.findIndex(members.List,{ userTypeLinkId : e.id })
                        if(index < 0){
                            memberList.push({ id: e.id , name: `${e.firstName} ${e.lastName}`})
                        }
                    })
                }
            }else if(members.Selected.type == 'team'){
                global.SelectList.teamList.map((e) => {
                    let index = _.findIndex(teams.List,{ userTypeLinkId : e.id })
                    if(index < 0){
                        memberList.push({ id: e.id, name: e.team })
                    }
                })
            }
        }

        
        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" onClick={this.handleSubmit} data-toggle="modal" data-target="#projectModal">
                        <span>Save</span>
                    </li>
                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <form onSubmit={this.handleSubmit} class="form-horizontal member-form-container">
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Member Type</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={[
                                            { id: 'users', name: 'User' },
                                            { id: 'team', name: 'Team' }
                                        ]}
                                        selected={(typeof members.Selected.type == "undefined") ? "" : members.Selected.type}
                                        onChange={(e) => {
                                            this.setDropDown("type", e.value);
                                        }}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                            { members.Selected.type == 'users' && 
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Show all users</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="checkbox"
                                            style={{ width: "15px", marginTop: "10px" }}
                                            checked={showAllUsers}
                                            onChange={() => { }}
                                            onClick={(f) => this.setState({ showAllUsers : !showAllUsers })}
                                        />
                                    </div>
                                </div>
                            }
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Member</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={false}
                                        required={true}
                                        options={memberList}
                                        selected={(typeof members.Selected.userTypeLinkId == "undefined") ? "" : members.Selected.userTypeLinkId}
                                        onChange={(e) => {
                                            this.setDropDown("userTypeLinkId", e.value);
                                        }}
                                    />
                                    <div class="help-block with-errors"></div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div >
        )
    }
}