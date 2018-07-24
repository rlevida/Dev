import React from "react";
import ReactDOM from "react-dom";
import Select from 'react-select';

import { showToast } from '../../../globalFunction';
import { DropDown, HeaderButtonContainer } from "../../../globalComponents";

export default class PasswordForm extends React.Component {
    constructor() {
        super()
        this.state = {
            password : "",
            confirmPassword : ""
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleSubmit(e) {
        e.preventDefault();
        this.props.onSubmitForm(this.state);
    }

    render() {
        return <form onSubmit={this.handleSubmit} class="form-horizontal">
                        <HeaderButtonContainer withMargin={true}>
                            <li class="btn btn-info" style={{marginRight:"2px"}} onClick={this.props.backToList} >
                                <span>Back</span>
                            </li>
                            <li onClick={this.handleSubmit} >
                                <button class="btn btn-info" >Submit</button>
                            </li>
                        </HeaderButtonContainer>
                        <div class="col-lg-12 col-md-12 col-xs-12 mt10">
                    
                        <div class="panel panel-default">
                            <div class="panel-heading">
                                <h3 class="panel-title">Set New Password</h3>
                            </div>
                            <div class="panel-body">
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">New Password</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="password" name="password" value={this.state.password} class="form-control" placeholder="New Password" onChange={this.handleChange} />
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label class="col-md-3 col-xs-12 control-label">Confirm Password</label>
                                    <div class="col-md-7 col-xs-12">
                                        <input type="password" name="confirmPassword" value={this.state.confirmPassword} class="form-control" placeholder="Confirm Password" onChange={this.handleChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
    }
}