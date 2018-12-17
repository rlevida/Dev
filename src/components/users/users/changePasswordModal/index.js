import React from "react";
import { showToast, putData, setDatePicker } from '../../../../globalFunction';

import { connect } from "react-redux"
@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        users: store.users
    }
})
export default class ChangePasswordModal extends React.Component {
    constructor() {
        super()
        this.state = {
            password: "",
            confirmPassword: ""
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
        const self = this;
        $(".form-container").validator();
        setDatePicker(this.handleDate, "birthday");
        $('#changePasswordModal').on('hidden.bs.modal', function (e) {
            self.setState({
                password: "",
                confirmPassword: ""
            })
        })
    }

    handleChange(e) {
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    handleSubmit() {
        const { users } = this.props;
        const { password, confirmPassword } = this.state;

        if (password == "" && confirmPassword == "") {
            showToast('error', 'Please fill all of the necessary fields.');
        } else if (password != confirmPassword) {
            showToast('error', 'Password and confirm password must be the same.');
        } else if (password.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
        } else {
            let data = Object.assign({}, this.state);
            let token = localStorage.getItem('token');
            data.Id = users.SelectedId;

            putData(`/api/user/changePassword/${data.Id}`, data, (c) => {
                if (c.status == 200) {
                    showToast('success', 'Password successfully changed.');
                    $(`#changePasswordModal`).modal('hide');
                } else {
                    showToast('error', 'Something went wrong. Please try again.');
                }
                this.setState({ password: '', confirmPassword: '' })
            })
        }
    }

    render() {
        return <div>
            <div class="modal fade" id="changePasswordModal" tabIndex="-1" role="dialog" aria-labelledby="changePasswordModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h5 class="modal-title" id="changePasswordModalLabel">
                                Set new password
                            </h5>
                        </div>
                        <div class="modal-body">
                            <form class="form-horizontal form-container">
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
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onClick={() => this.handleSubmit()}>Save</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}