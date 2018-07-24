import React from "react"
import ReactDOM from "react-dom"

import { showToast } from '../../../globalFunction'

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
            email : '',
            disabled : false
        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    handleSubmit(e) {
        let { socket } = this.props;
        e.preventDefault()
        showToast("success", "Checking email account ...", 360000);

        socket.emit("SEND_FORGOT_PASSWORD",{email : this.state.email,type : this.props.type});
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
                            <form onSubmit={this.handleSubmit}>
                                <div class="form-group">
                                    <p class="text-center">Please provide the email address that<br/> you used for your account.</p>
                                    <input class="form-control" type="text" placeholder="email account" value={this.state.email} name="email" onChange={this.handleChange} />
                                    <button class="btn btn-primary btn-block"  disabled={this.state.disabled}>Submit</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
    }
}