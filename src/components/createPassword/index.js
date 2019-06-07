import React from "react"
import { showToast, putData, getParameterByName } from '../../globalFunction'
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
    }
})

export default class NewPassword extends React.Component {
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
        e.preventDefault();

        showToast("success", "Updating password...", 360000);

        if (this.state.newPassword != this.state.confirmPassword) {
            showToast("error", "Password and confirm password must be the same.");
            this.setState({ newPassword: '', confirmPassword: '', disabled: false });
        } else if (this.state.newPassword.length < 6) {
            showToast("error", "Passwords at least 6 characters.");
            this.setState({ newPassword: '', confirmPassword: '', disabled: false });
        } else if (this.state.captchaPayload == "" && process.env.NODE_ENV != "development") {
            showToast("error", "Please confirm your not a robot.", 360000)
        } else {
            let url = window.location;
            let hash = getParameterByName('hash', url);

            putData(`/createPassword/create`, { newPassword: this.state.newPassword, hash: hash }, (c) => {
                if (c.data) {
                    showToast('success', "Password successfully created. You'll be redirect to login page.")
                    setTimeout(function (e) {
                        window.location.replace('/');
                    }, 1000);
                } else {
                    showToast('error', 'Something went wrong. Please try again.')
                }
            })
        }
    }

    render() {
        const { email, disabled } = { ...this.state };
        return (
            <div id="login">
                <div class="form-signin">
                    <div class="logo">
                        <h1 class="text-center mb0">Create Password</h1>
                        <p class="text-center">All with <span class="text-red">*</span> are required.</p>
                    </div>
                    <form class="reset-form">
                        <div class="form-group">
                            <label class="m0">New Password: <span class="text-red">*</span></label>
                            <p class="note">Passwords at least 6 characters.</p>
                            <input type="password" placeholder="Enter new password" value={this.state.newPassword} name="newPassword" onChange={this.handleChange} class="form-control bottom" />
                        </div>
                        <div class="form-group mb20">
                            <label>Confirm Password: <span class="text-red">*</span></label>
                            <input type="password" placeholder="Confirm password" value={this.state.confirmPassword} name="confirmPassword" onChange={this.handleChange} class="form-control bottom" />
                        </div>
                        <a class="btn btn-lg btn-violet btn-block mt20" onClick={this.handleSubmit}>Submit</a>
                    </form>
                </div>
            </div>
        )
    }
}