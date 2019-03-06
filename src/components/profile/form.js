import React from "react";
import parallel from 'async/parallel';
import { showToast, getData } from '../../globalFunction';
import { HeaderButtonContainer } from "../../globalComponents";
import { connect } from "react-redux";
import _ from 'lodash';

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        users: store.users,
        teams: store.teams,
        workstream: store.workstream,
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        let { dispatch, loggedUser } = this.props;
        $(".form-container").validator();
        parallel({
            projects: (parallelCallback) => {
                getData(`/api/project`, {}, (c) => {
                    dispatch({ type: "SET_PROJECT_LIST", list: c.data.result, count: c.data.count })
                    dispatch({ type: "SET_PROJECT_LOADING", Loading: "" });
                    showToast("success", "Project successfully retrieved.");
                    parallelCallback(null)
                })
            },
            workstreams: (parallelCallback) => {
                getData(`/api/workstream?userType=${loggedUser.data.userType}&userId=${loggedUser.data.id}`, {}, (c) => {
                    if (c.status == 200) {
                        dispatch({ type: "UPDATE_WORKSTREAM_LIST", list: c.data.result, Count: c.data.count })
                        showToast("success", "Workstream successfully retrieved.");
                    } else {
                        showToast("error", "Something went wrong please try again later.");
                    }
                    dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "" });
                    parallelCallback(null)
                });
            },
            teams: (parallelCallback) => {
                getData(`/api/teams?isDeleted=0&userId=${loggedUser.data.id}`, {}, (c) => {
                    dispatch({ type: 'SET_TEAM_LIST', list: c.data.result, Count: c.data.count });
                    dispatch({ type: 'SET_TEAM_LOADING', Loading: '' });
                })
                parallelCallback(null)
            }
        }, (err, result) => {
        })
    }

    handleChange(e) {
        let { dispatch, loggedUser } = this.props
        let tempData = Object.assign({}, loggedUser.data)
        tempData[e.target.name] = e.target.value;
    }

    handleSubmit(e) {
        let { loggedUser } = this.props

        let result = true;
        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }

    }

    render() {
        let { project, loggedUser, teams, workstream } = this.props;
        let user = loggedUser.data;

        return <div>
            <HeaderButtonContainer withMargin={true}>
                {/* <li class="btn btn-info" style={{marginRight:"2px"}} 
                    onClick={(e)=>{
                        // dispatch({type:"SET_PROJECT_FORM_ACTIVE", FormActive: "List" });
                        dispatch({type:"SET_PROJECT_SELECTED", Selected: {} });
                    }} >
                    <span>Back</span>
                </li> */}
                {/* <li class="btn btn-info" onClick={this.handleSubmit} >
                    <span>Save</span>
                </li> */}
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">My Profile</h3>
                        </div>
                        <div class="panel-body">
                            <div class="row pdl20 pdr20 mb20">
                                <div class="col-md-6">
                                    <h4 class="mt20 mb20">Personal Details</h4>
                                    <form style={{ pointerEvents: 'none' }}>
                                        <div class="form-group">
                                            <label for="firstName">First Name:</label>
                                            <input type="text" name="firstName" value="" class="form-control" placeholder="Name" value={user.firstName} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Last Name:</label>
                                            <input type="text" name="lastName" value="" class="form-control" placeholder="FamilyName" value={user.lastName} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Email Address:</label>
                                            <input type="email" name="emailAddress" value="" class="form-control" placeholder="Email" value={user.emailAddress} onChange={this.handleChange} />
                                        </div>
                                        <div class="form-group">
                                            <label for="firstName">Phone Number:</label>
                                            <input type="number" name="phoneNumber" value="" class="form-control" placeholder="Phone number" value={user.phoneNumber != null ? user.phoneNumber : ""} onChange={this.handleChange} />
                                        </div>
                                        {
                                            (user.userType == "External") &&
                                            <div class="form-group">
                                                <label for="company">Company:</label>
                                                <input type="company" name="company" value="" class="form-control" placeholder="Company" value={user.company != null ? user.company : ""} onChange={this.handleChange} />
                                            </div>
                                        }
                                    </form>
                                </div>
                            </div>
                            {
                                (user.userType == 'Internal' || (user.userType == 'External' && project.List.length > 1)) && <div class="row pdl20 pdr20 mb20">
                                    <div class="col-md-6">
                                        <h4 class="mt20 mb20">Projects</h4>
                                        <table id="dataTable" class="table responsive-table mt30">
                                            <tbody>
                                                <tr>
                                                    <th class="text-left">Project</th>
                                                    <th class="text-center">Type</th>
                                                </tr>
                                                {
                                                    project.List.map((data, index) => {
                                                        return (
                                                            <tr key={index}>
                                                                <td class="text-left">{data.project}</td>
                                                                <td>{data.type.type}</td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                        {
                                            (project.List.length == 0) && <p class="text-center m0">No Record Found!</p>
                                        }
                                    </div>
                                </div>
                            }
                            <div class="row pdl20 pdr20 mb20">
                                <div class="col-md-6">
                                    <h4 class="mt20 mb20">Workstreams</h4>
                                    <table id="dataTable" class="table responsive-table mt30">
                                        <tbody>
                                            <tr>
                                                <th class="text-left">Workstreams</th>
                                                <th class="text-center">Type</th>
                                            </tr>
                                            {
                                                workstream.List.map((data, index) => {
                                                    return (
                                                        <tr key={index}>
                                                            <td class="text-left">{data.workstream}</td>
                                                            <td><span class={data.type.type == "Output based" ? "fa fa-calendar" : "glyphicon glyphicon-time"}></span></td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                    {
                                        (workstream.List.length == 0) && <p class="text-center m0">No Record Found!</p>
                                    }
                                </div>
                            </div>
                            {
                                (user.userType == 'Internal') && <div class="row pdl20 pdr20 mb20">
                                    <div class="col-md-6">
                                        <h4 class="mt20 mb20">Teams</h4>
                                        <table id="dataTable" class="table responsive-table mt30">
                                            <tbody>
                                                <tr>
                                                    <th class="text-left">Team</th>
                                                    <th class="text-left">Members</th>
                                                </tr>
                                                {
                                                    teams.List.map((data, index) => {
                                                        return (
                                                            <tr key={index}>
                                                                <td class="text-left">{data.team}</td>
                                                                <td class="text-left"><span title={data.users_team.map((e) => { return `${e.user.firstName} ${e.user.lastName}` }).join("\r\n")}><i class="fa fa-users fa-lg"></i></span></td>
                                                            </tr>
                                                        )
                                                    })
                                                }
                                            </tbody>
                                        </table>
                                        {
                                            (teams.List.length == 0) && <p class="text-center m0">No Record Found!</p>
                                        }
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}