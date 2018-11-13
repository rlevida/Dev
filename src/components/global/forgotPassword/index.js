import React from "react"
import ReactDOM from "react-dom"

import { showToast, postData } from '../../../globalFunction'

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
        let { socket } = this.props;
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
        showToast("success", "Checking email account ...", 360000);

        socket.emit("SEND_FORGOT_PASSWORD",{ email : this.state.email,type : this.props.type});
    }

    render() {
        return <div class="modal fade" id="modal" tabIndex="-1" role="dialog" aria-labelledby="myModalLabel">
            <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                        <h4 class="modal-title" id="myModalLabel">Forgot Password</h4>
                    </div>
                    <div class="modal-body">
                        <form onSubmit={this.handleSubmit} class="form-container">
                            <div class="form-group">
                                <p class="text-center">Please provide the email address that<br /> you used for your account.</p>
                                <input type="email" name="email" required value={this.state.email} class="form-control" placeholder="email account" onChange={this.handleChange} />
                                <div class="help-block with-errors"></div>
                            </div>
                            <button class="btn btn-primary btn-block" disabled={this.state.disabled}>Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    }
}