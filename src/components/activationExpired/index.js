import React from "react"
import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
    }
})

export default class ActivationExpired extends React.Component {
    back() {
        window.location.replace('/');
    }
    render() {
        return (
            <div id="login">
                <div class="form-signin">
                    <div class="logo">
                        <h4 class="text-center mb0">Activation link expired. Contact your Admin</h4>
                        <a class="btn btn-lg btn-violet btn-block mt20" onClick={() => this.back()}>Back</a>
                    </div>
                </div>
            </div>
        )
    }
}