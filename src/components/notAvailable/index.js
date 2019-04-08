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

export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <div class="row">
                <div class="col-lg-12 col-md-12 col-sm-12">
                    <div class="no-project">
                        <i class="fa fa-exclamation" aria-hidden="true"></i>
                        <span>Page Not Available</span>
                    </div>
                </div>
            </div>
        )
    }
}