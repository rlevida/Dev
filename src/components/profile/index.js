import React from "react";
import { connect } from "react-redux";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import Dropzone from 'react-dropzone';
import _ from "lodash";

import ProfileDetails from "./profileDetails";
import ProfilePerformance from "./profilePerformance";
import ProfileTask from "./profileTask";
import ProfileProject from "./profileProject";
import UserForm from "../users/users/userForm";
import ProfileNotification from "./profileNotification";

import { postData, showToast } from "../../globalFunction";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        document: store.document,
        users: store.users
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "onDrop",
            "upload"
        ], (fn) => { this[fn] = this[fn].bind(this); });
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_USER_SELECTED', Selected: "" });
    }

    componentDidMount() {
        const { dispatch, loggedUser } = this.props;
        dispatch({ type: 'SET_USER_SELECTED', Selected: loggedUser.data });
    }

    onDrop(picture) {
        const { dispatch } = this.props;
        dispatch({ type: 'SET_DOCUMENT_FILES', Files: picture })
    }

    upload() {
        const { document, loggedUser, dispatch, users } = { ...this.props };
        let data = new FormData();

        dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "SUBMITTING", LoadingType: 'Loading' });
        _.map(document.Files, (file) => {
            data.append("file", file);
            data.append('profile_id', loggedUser.data.id);
        });

        postData(`/api/user/upload`, data, (c) => {
            dispatch({ type: "SET_DOCUMENT_LOADING", Loading: "", LoadingType: 'Loading' });
            dispatch({ type: "SET_LOGGED_USER_DATA", data: { ...loggedUser.data, avatar: c.data } });
            dispatch({ type: 'SET_USER_SELECTED', Selected: { ...users.Selected, avatar: c.data } });
            dispatch({ type: 'SET_DOCUMENT_FILES', Files: "" });
            showToast("success", "Profile picture successfully uploaded.");

            $('#upload-picture').modal('hide');
        });
    }

    render() {
        const { document } = { ...this.props };
        const { Files, Loading } = document;

        return (
            <div class="row">
                <div class="col-lg-12">
                    <div class="card">
                        <Tabs>
                            <TabList>
                                <Tab>Profile</Tab>
                                <Tab>Account Settings</Tab>
                                <Tab>Notifications</Tab>
                            </TabList>
                            <TabPanel>
                                <div class="mt20">
                                    <div class="bt">
                                        <div class="row content-row mb20" id="profile">
                                            <div class="col-md-5">
                                                <ProfileDetails />
                                            </div>
                                            <div class="col-md-7" id="performance">
                                                <ProfilePerformance />
                                            </div>
                                        </div>
                                        <div class="row content-row">
                                            <div class="col-md-3">
                                                <ProfileProject />
                                            </div>
                                            <div class="col-md-9">
                                                <ProfileTask />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel>
                                <div class="mt20">
                                    <div class="bt">
                                        <UserForm profileEdit={true} />
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel class="bt">
                                <ProfileNotification/>
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
                <div id="upload-picture" class="modal fade upload-modal" data-backdrop="static" data-keyboard="false">
                    <div class="modal-dialog modal-sm" role="document">
                        <div class="modal-content">
                            <div class="modal-body">
                                <p><strong>Upload Profile Picture</strong></p>
                                <Dropzone
                                    accept=".jpg,.png,.jpeg"
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