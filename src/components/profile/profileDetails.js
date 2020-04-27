import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { getData } from "../../globalFunction";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        settings: store.settings
    }
})
export default class ProfileDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map(["fetchUserTeam"], (fn) => {
            this[fn] = this[fn].bind(this);
        })
    }

    componentDidMount() {
        this.fetchUserTeam();
    }

    fetchUserTeam() {
        const { loggedUser, dispatch } = { ...this.props };

        getData(`/api/teams?&userId=${loggedUser.data.id}`, {}, (c) => {
            dispatch({ type: "SET_LOGGED_USER_DATA", data: { ...loggedUser.data, teams: c.data.result } })
        });
    }

    render() {
        const { loggedUser, settings } = { ...this.props };
        const { id, firstName, lastName, username, emailAddress, phoneNumber, userType, user_role, dateAdded, avatar, teams = [] } = loggedUser.data;
        const supervisors = _(teams)
            .filter(({ teamLeaderId }) => { return teamLeaderId != id })
            .map(({ teamLeader, team }) => { return { ...teamLeader, team } })
            .value();
        return (
            <div>
                <div class="mt20 mb20">
                    <div class="profile-picture display-flex">
                        <div>
                            <div class="profile-wrapper">
                                <img src={`${settings.site_url}api/file/profile_pictures/${avatar}`} alt="Profile Picture" class="img-responsive" />
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
                    <p><label>Supervisor/s:</label></p>
                    <div class="ml15">
                        {
                            _.map(supervisors, ({ firstName, lastName, avatar, team }, index) => {
                                return (
                                    <div key={index} class="profile-div">
                                        <div class="thumbnail-profile">
                                            <img src={`${settings.site_url}api/file/profile_pictures/${avatar}`} alt="Profile Picture" class="img-responsive" />
                                        </div>
                                        <div>
                                            <p class="m0">{firstName + " " + lastName}</p>
                                            <p class="note">{team}</p>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                    <div class="mt20">
                        <p><label>Date Joined:</label> {moment(dateAdded).format("MMMM DD, YYYY")}</p>
                    </div>
                </div>
            </div>
        )
    }
}