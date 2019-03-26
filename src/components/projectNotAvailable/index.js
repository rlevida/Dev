import React from "react";
import { connect } from "react-redux";
import { showToast, deleteData } from '../../globalFunction';
import { withRouter } from 'react-router'
@connect((store) => {
    return {
        user: store.loggedUser.data,
        project: store.project,
        reminder: store.reminder,
        loggedUser: store.loggedUser
    }
})

class Component extends React.Component {
    constructor(props) {
        super(props);
        this.handleLogout = this.handleLogout.bind(this);
    }


    handleLogout() {
        const { loggedUser, dispatch } = this.props;
        deleteData(`/api/login/${loggedUser.data.id}`, {}, (c) => {
            setTimeout(function () {
                window.location.replace('/');
            }, 1000);
            dispatch({
                type: "SET_LOGGED_USER_DATA", data: {
                    username: "",
                    emailAddress: "",
                    userType: ""
                }
            })
            showToast("success", 'Successfully logout.');
        })
    }

    render() {
        const { location } = { ...this.props };
        return (
            <div class="row">
                <div class="col-lg-12 col-md-12 col-sm-12">
                    <div class="no-project">
                        <span>Project Not Available</span>
                        {location.pathname !== "/projectNotAvailable" &&
                            <a class="" onClick={this.handleLogout}>
                                <i class="fa mr10 fa-power-off" aria-hidden="true"></i>
                                Logout
                        </a>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(Component)