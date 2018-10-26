import React from "react"
import ReactDOM from "react-dom"
import axios from "axios"
import { showToast, getData } from '../../globalFunction'
import ForgotPassword from  "../global/forgotPassword"
import Captcha from 'react-captcha';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        Login: store.login
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            captchaPayload: "",
            yourIp : ""
        }
        this.checkRememberMe = this.checkRememberMe.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
        this.handleCaptcha = this.handleCaptcha.bind(this)
    }

    componentDidMount() {
        $.getJSON('https://api.ipify.org?format=json', (data)=>{
            this.setState({yourIp:data.ip})
        });
        this.checkRememberMe()
    }

    checkRememberMe() {
        let { dispatch } = this.props
        var rememberMe = localStorage.getItem('rememberMe')
         if(rememberMe == "true"){
            var username = localStorage.getItem('username')
            dispatch({type:"SET_LOGIN_DATA" , name : "username", value : username})
            dispatch({type:"SET_LOGIN_DATA" , name : "rememberMe", value : true})
            dispatch({type:"SET_LOGIN_DATA" , name : "disabled", value : false})
         }
    }

    handleSubmit(e) {
        let { socket, Login, dispatch } = this.props;
        e.preventDefault();
        
        if(Login.username == "" || Login.password == ""){
            showToast("error", "Username/Password is required.", 360000)
            return;
        }
        if(this.state.captchaPayload == "" && process.env.NODE_ENV != "development"){
            showToast("error", "Please confirm your not a robot.", 360000)
            return;
        }
        showToast("success", "Logging in, please wait ...", 360000)
        localStorage.setItem('username', Login.username)
        localStorage.setItem('rememberMe', Login.rememberMe)
        
        socket.emit("USER_LOGGED_IN",{username:Login.username,password:Login.password,ipAddress:this.state.yourIp});
    }

    handleCaptcha(value) {
        if(value && value.length > 0) {
            this.setState({
                captchaPayload : value
            });
        }
    }

    render() {
        let { Login, dispatch } = this.props;
        let captchaUI = null;
        if(process.env.NODE_ENV != "development") {
            captchaUI = <Captcha 
                                sitekey='6LeTGG0UAAAAAJNrNp2uNlwYiwGf39V4lJyCdBwg'
                                lang='en'
                                theme='light'
                                type='image'
                                callback={ this.handleCaptcha } 
                            />
        }
        return <div class="form-signin">
                    <div class="text-center">
                        <h3>Cloud CFO</h3>
                    </div>
                    <hr />
                    <div class="tab-content">
                        <div class="tab-pane active">
                            <form class="login-form" onSubmit={this.handleSubmit}>
                                <p class="text-muted text-center">
                                    Enter your username and password
                                </p>
                                <input type="text" placeholder="Username" name="UserName" value={Login.username} onChange={(e)=>dispatch({type:"SET_LOGIN_DATA" , name : "username", value : e.target.value})} class="form-control top" />
                                <input type="password" placeholder="Password" name="Password" value={Login.password} onChange={(e)=>dispatch({type:"SET_LOGIN_DATA" , name : "password", value : e.target.value})} class="form-control bottom" />
                                { captchaUI }
                                <p>
                                    <span><input type="checkbox" checked={Login.rememberMe} onChange={()=>dispatch({type:"SET_LOGIN_DATA" , name : "rememberMe", value : (Login.rememberMe)?false:true})} /> Remember Me</span>
                                    <a href="#" style={{float:'right'}} type="button" data-toggle="modal" data-target="#modal">
                                        Forgot Password?
                                    </a>
                                </p>
                                <button disabled={Login.disabled} class="btn btn-lg btn-primary btn-block">Sign in</button>
                            </form>
                        </div>
                    </div>
                    <ForgotPassword type={"client"} />
                </div>
    }
}