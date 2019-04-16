import React from "react"

import { showToast, postData, getData } from '../../globalFunction'

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
    }
})

export default class ForgotPassword extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            email: '',
            disabled: false
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }
    componentDidMount() {
        $(".form-container").validator();
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    handleSubmit(e) {
        e.preventDefault()
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

        this.setState({ disabled: true }, () => {
            showToast("success", "Checking email account ...", 360000);
            getData(`/auth/forgotPassword?email=${this.state.email}&type=${this.props.type}`, {}, (c) => {
                this.setState({
                    disabled: false
                }, () => {
                    if (c.data) {
                        $('#modal').modal('hide');
                        showToast('success', 'Forgot password successfully send.');
                    } else {
                        showToast('error', `${this.state.email} does not exist.`);
                    }
                })
            })
        });

    }

    render() {
        const { email, disabled } = { ...this.state };
        return (
            <div class="modal fade" id="modal" data-backdrop="static" data-keyboard="false">
                <div class="modal-dialog modal-md">
                    <div class="modal-content">
                        <div class="modal-header">
                            <a class="text-grey" data-dismiss="modal" aria-label="Close">
                                <span>
                                    <i class="fa fa-chevron-left mr10" aria-hidden="true"></i>
                                    <strong>Back</strong>
                                </span>
                            </a>
                        </div>
                        <div class="modal-body">
                            <h2 class="m0">Forgot Password</h2>
                            <form onSubmit={this.handleSubmit} class="form-container mt20 mb20 center-div" id="forgot-password">
                                <div class="form-group">
                                    <label for="project-type">Email Address<span class="text-red">*</span></label>
                                    <input type="email" name="email" required value={email} class="form-control" placeholder="Enter email address" onChange={this.handleChange} />
                                </div>
                                <button class="btn btn-violet btn-block btn-lg" disabled={disabled}>{(disabled) ? 'Submitting ...' : 'Submit'}</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}