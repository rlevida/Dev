import React from "react";
import { showToast, postData, getData } from "../../globalFunction";
import ForgotPassword from "../forgotPassword";
import Captcha from "react-captcha";

import TermsAndConditionsModal from "./termsAndConditions";

import { connect } from "react-redux";
@connect(store => {
    return {
        socket: store.socket.container,
        Login: store.login
    };
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            captchaPayload: "",
            yourIp: "",
            userDetails: {}
        };
        this.checkRememberMe = this.checkRememberMe.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleCaptcha = this.handleCaptcha.bind(this);
    }

    componentDidMount() {
        $.getJSON("https://api.ipify.org?format=json", data => {
            this.setState({ yourIp: data.ip });
        });
        this.checkRememberMe();
    }

    checkRememberMe() {
        let { dispatch } = this.props;
        var rememberMe = localStorage.getItem("rememberMe");
        if (rememberMe == "true") {
            var username = localStorage.getItem("username");
            dispatch({ type: "SET_LOGIN_DATA", name: "username", value: username });
            dispatch({ type: "SET_LOGIN_DATA", name: "rememberMe", value: true });
            dispatch({ type: "SET_LOGIN_DATA", name: "disabled", value: false });
        }
    }

    async handleSubmit(e) {
        let { Login } = this.props;
        e.preventDefault();

        if (Login.username == "" || Login.password == "") {
            showToast("error", "Username and password is required.", 360000);
            return;
        }

        if (Login.username == "default" && Login.password == "default") {
            showToast("error", "User does not exist.", 360000);
            return;
        }

        // if (this.state.captchaPayload == "" && process.env.NODE_ENV != "development") {
        //     showToast("error", "Please confirm your not a robot.", 360000);
        //     return;
        // }

        showToast("success", "Logging in, please wait ...", 360000);

        localStorage.setItem("username", Login.username);
        localStorage.setItem("rememberMe", Login.rememberMe);

        postData(`/auth/login`, { username: Login.username, password: Login.password, ipAddress: this.state.yourIp }, c => {
            if (c.data.status) {
                if (c.data.userDetails.termsAndConditions === 0) {
                    toastr.remove();
                    this.getTermsAndConditions(c.data.userDetails);
                } else if (c.data.userDetails.projectId.length > 1 || c.data.userDetails.userRole <= 4) {
                    window.location.replace("/");
                } else {
                    window.location.replace(`/account#/projects/${c.data.userDetails.projectId[0]}`);
                }
            } else {
                showToast("error", c.data.message, 360000);
            }
        });
    }

    getTermsAndConditions(userDetails) {
        getData(`/termsAndConditions`, {}, getTermsAndConditionsResponse => {
            try {
                if (getTermsAndConditionsResponse.data && getTermsAndConditionsResponse.data.termsAndConditions) {
                    const { termsAndConditions } = { ...getTermsAndConditionsResponse.data }
                    this.setState({ termsAndConditions: termsAndConditions })
                    $(`#termsAndCondition`).modal("show");
                }
            } catch (err) {
                showToast('error', 'Something went wrong. Please try again.')
            }
        })
    }

    handleCaptcha(value) {
        if (value && value.length > 0) {
            this.setState({
                captchaPayload: value
            });
        }
    }

    render() {
        const { termsAndConditions } = { ...this.state }
        let { Login, dispatch } = this.props;
        let captchaUI = null;
        if (process.env.NODE_ENV != "development") {
            captchaUI = <Captcha sitekey="6LcZ95kUAAAAAN2oDsWH8TVbTNTrROSzFVaI7a5g" lang="en" theme="light" type="image" callback={this.handleCaptcha} size={"invisible"} />;
        }
        return (
            <div id="login">
                <div class="form-signin">
                    <div class="logo">
                        <img src="/images/blue-logo.png" class="img-responsive" />
                    </div>
                    <form class="login-form">
                        <div class="form-group">
                            <label for="project-type">Username</label>
                            <input type="text" placeholder="Enter username" name="UserName" value={Login.username} onChange={e => dispatch({ type: "SET_LOGIN_DATA", name: "username", value: e.target.value })} class="form-control top" />
                        </div>
                        <div class="form-group mb20">
                            <label for="project-type">Password</label>
                            <input type="password" placeholder="Enter password" name="Password" value={Login.password} onChange={e => dispatch({ type: "SET_LOGIN_DATA", name: "password", value: e.target.value })} class="form-control bottom" />
                        </div>
                        {captchaUI}
                        <a disabled={Login.disabled} class="btn btn-lg btn-violet btn-block mt20" onClick={this.handleSubmit}>
                            Login
                        </a>
                        <div class="row mt20">
                            <div class="col-md-6">
                                <label class="custom-checkbox">
                                    Remember Me
                                    <input type="checkbox" checked={Login.rememberMe} onChange={() => dispatch({ type: "SET_LOGIN_DATA", name: "rememberMe", value: Login.rememberMe ? false : true })} />
                                    <span class="checkmark" />
                                </label>
                            </div>
                            <div class="col-md-6">
                                <a href="#" style={{ float: "right" }} type="button" data-toggle="modal" data-target="#modal">
                                    Forgot Password?
                                </a>
                            </div>
                        </div>
                    </form>
                </div>
                <ForgotPassword type={"client"} />
                <TermsAndConditionsModal termsAndConditions={termsAndConditions} ipAddress={this.state.yourIp} />
            </div>
        );
    }
}
