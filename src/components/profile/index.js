import React from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import _ from "lodash";

import ProfileDetails from "./profileDetails";
import ProfilePerformance from "./profilePerformance";
import ProfileTask from "./profileTask";
import ProfileProject from "./profileProject";

export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
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
                            <TabPanel class="bt">
                                <div class="row content-row" id="profile">
                                    <div class="col-md-5">
                                        <ProfileDetails />
                                    </div>
                                    <div class="col-md-7" id="performance">
                                        <ProfilePerformance />
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-md-3">
                                        <ProfileProject />
                                    </div>
                                    <div class="col-md-9">
                                        <ProfileTask />
                                    </div>
                                </div>
                            </TabPanel>
                            <TabPanel class="bt">
                                <h2>Account Settings</h2>
                            </TabPanel>
                            <TabPanel class="bt">
                                <h2>Notifications</h2>
                            </TabPanel>
                        </Tabs>
                    </div>
                </div>
            </div>
        )
    }
}