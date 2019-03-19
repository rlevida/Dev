import React from "react";
import { connect } from "react-redux";
import Dropzone from 'react-dropzone';
import _ from "lodash";
import moment from "moment";
import { postData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        document: store.document,
        loggedUser: store.loggedUser
    }
})
export default class ProfileDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "openUpload",
            "onDrop",
            "upload"
        ], (fn) => { this[fn] = this[fn].bind(this); });
    }

    openUpload() {
        $('#upload-picture').modal('show');
    }

    onDrop(picture) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES', Files: picture })
    }

    upload() {
        const { document, loggedUser, dispatch } = { ...this.props };
        let data = new FormData();

        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING", LoadingType: 'Loading' });
        _.map(document.Files, (file) => {
            data.append("file", file);
            data.append('profile_id', loggedUser.data.id);
        });

        postData(`/api/user/upload`, data, (c) => {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' });
            dispatch({ type: "SET_LOGGED_USER_DATA", data: { ...loggedUser.data, avatar: c.data } });
            dispatch({ type: 'SET_DOCUMENT_FILES', Files: "" });
            showToast("success", "Profile picture successfully uploaded.");

            $('#upload-picture').modal('hide');
        })
    }

    render() {
        const { loggedUser, document } = { ...this.props };
        const { firstName, lastName, username, emailAddress, phoneNumber, userType, user_role, dateAdded, avatar } = loggedUser.data;
        const { Files, Loading } = document;

        return (
            <div>
                <div class="mt20 mb20">
                    <div class="profile-picture display-flex">
                        <div>
                            <div class="profile-wrapper">
                                <img src={avatar} alt="Profile Picture" class="img-responsive" />
                                <a onClick={this.openUpload}>
                                    <i class="fa fa-camera"></i>
                                </a>
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
                <div id="upload-picture" class="modal fade upload-modal" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-sm" role="document">
                        <div class="modal-content">
                            <div class="modal-body">
                                <p><strong>Upload Profile Picture</strong></p>
                                <Dropzone
                                    onDrop={this.onDrop}
                                    class="document-file-upload"
                                    multiple={false}
                                >
                                    <div style={{ textAlign: "center", height: "100%", padding: "60px" }}>
                                        <div class="upload-wrapper">
                                            {
                                                (Files.length > 0) ? <img src={Files[0].preview} alt="Profile Picture" class="img-responsive" /> : <p>Drop your best picture here</p>
                                            }
                                        </div>
                                    </div>
                                </Dropzone>
                                <div class="mt20">
                                    <a class="btn btn-violet mr5" onClick={this.upload} disabled={(Loading == "SUBMITTING")}>
                                        <span>
                                            {
                                                (Loading == "SUBMITTING") ? "Uploading..." : "Upload Picture"
                                            }
                                        </span>
                                    </a>
                                    <a class="btn btn-default" data-dismiss="modal" disabled={(Loading == "SUBMITTING")}><span>Cancel</span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}