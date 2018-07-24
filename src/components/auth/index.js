import React from "react"
import ReactDOM from "react-dom"
import axios from "axios"
import { showToast } from '../../globalFunction'
import ForgotPassword from  "../global/forgotPassword"

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

        this.checkRememberMe = this.checkRememberMe.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this)
    }

    componentDidMount() {
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
        showToast("success", "Logging in, please wait ...", 360000)
        localStorage.setItem('username', Login.username)
        localStorage.setItem('rememberMe', Login.rememberMe)
        socket.emit("USER_LOGGED_IN",{username:Login.username,password:Login.password});
    }

    render() {
        let { Login, dispatch } = this.props;
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