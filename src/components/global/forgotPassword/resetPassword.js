import React from "react";
import ReactDOM from "react-dom";
import { showToast, getParameterByName } from '../../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            newPassword: '',
            confirmPassword: '',
            disabled: false
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    handleSubmit(e) {
        e.preventDefault();
        let { socket } = this.props

        showToast("success", "Updating password...", 360000);

        if (this.state.newPassword != this.state.confirmPassword) {
            showToast("error", "Password and confirm password must be the same.");
            this.setState({ newPassword: '', confirmPassword: '', disabled: false });
        } else if (this.state.newPassword.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
            this.setState({ newPassword: '', confirmPassword: '', disabled: false });
        } else {
            let url = window.location;
            let hash = getParameterByName('hash', url);

            socket.emit("COMPLETE_FORGOT_PASSWORD",{ newPassword: this.state.newPassword, hash: hash })
        }
    }

    render () {
        return ( <div class="container">
                <div class="row">
                    <div class="col-lg-12 col-md-12 col-xs-12 text-center">
                        <div class="form">
                            <h1>Reset Password</h1>
                            <form class="reset-form" onSubmit={this.handleSubmit}>
                                <input type="password" placeholder="new password" value={this.state.newPassword} name="newPassword" onChange={this.handleChange} />
                                <input type="password" placeholder="confirm password" value={this.state.confirmPassword} name="confirmPassword" onChange={this.handleChange} />
                                <button class="btn-success" disabled={this.state.disabled}>Submit</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}