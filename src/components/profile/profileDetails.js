import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

@connect((store) => {
    return {
        loggedUser: store.loggedUser
    }
})
export default class ProfileDetails extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { loggedUser } = { ...this.props };
        const { firstName, lastName, username, emailAddress, phoneNumber, userType, user_role, dateAdded, avatar } = loggedUser.data;
    
        return (
            <div>
                <div class="mt20 mb20">
                    <div class="profile-picture display-flex">
                        <div>
                            <div class="profile-wrapper">
                                <img src={avatar} alt="Profile Picture" class="img-responsive" />
                            </div>
                        </div>
                        <div>
                            <h2 class="m0"><strong>{firstName + " " + lastName}</strong></h2>
                            <p class="m0"><strong>{username}</strong></p>
                        </div>
                    </div>

                </div>
                <div id="profile-details">
                    <p><label>Email:</label> {emailAddress}</p>
                    <p><label>Number:</label> {(phoneNumber != "" && phoneNumber != null) ? phoneNumber : "N/A"}</p>
                    <p><label>User Type:</label> {userType}</p>
                    <p><label>User Role:</label> {user_role[0].role.role}</p>
                    <div class="mt20">
                        <p><label>Date Joined:</label> {moment(dateAdded).format("MMMM DD, YYYY")}</p>
                    </div>
                </div>
            </div>
        )
    }
}