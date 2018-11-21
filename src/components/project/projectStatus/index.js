import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData } from '../../../globalFunction';

@connect((store) => {
    return {
        socket: store.socket.container,
        project: store.project,
        loggedUser: store.loggedUser
    }
})

export default class ProjectStatus extends React.Component {
    componentDidMount() {
        const { dispatch } = this.props;

        getData(`/api/project/status?date=${moment(new Date()).format("YYYY-MM-DD")}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_PROJECT_STATUS_COUNT", count: c.data });
            }
        });
    }

    render() {
        const { project, style } = { ...this.props };
        const data = {
            Client: { Active: 0, OnTrack: 0, Issues: 0 },
            Internal: { Active: 0, OnTrack: 0, Issues: 0 },
            Private: { Active: 0, OnTrack: 0, Issues: 0 }
        }
        project.StatusCount.map((e, i) => {
            data[e.type] = {
                Active: (typeof e.Active != "undefined") ? _.toNumber(e.Active) : 0,
                OnTrack: (typeof e.OnTrack != "undefined") ? _.toNumber(e.OnTrack) : 0,
                Issues: (typeof e.Issues != "undefined") ? _.toNumber(e.Issues) : 0
            }
        });
        return (
            <div class="container-fluid">
                <div class="row" style={(style != "undefined") ? style : ""}>
                    <div class="col-lg-1 col-xs-12 count">
                        <span></span>
                        <span>Client:</span>
                    </div>
                    <div class="col-lg-3 col-xs-12 active-count count">
                        <span class="text-white">{(data.Client.Active - data.Client.Issues) + data.Client.Issues}</span>
                        <span class="text-white">Active Projects:</span>
                    </div>
                    <div class="col-lg-3 col-xs-12 on-time count">
                        <span class="text-white">
                            {data.Client.Active - data.Client.Issues}
                        </span>
                        <span class="text-white">Projects On Time:</span>
                    </div>
                    <div class="col-lg-3 col-xs-12 issues count">
                        <span class="text-white">
                            {(data.Client.Issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                            {data.Client.Issues}
                        </span>
                        <span class="text-white">Projects With Issues:</span>
                    </div>
                </div>
                {
                    (typeof this.props.loggedUser.data.userRole != "undefined" &&
                        (this.props.loggedUser.data.userRole <= 4)) &&
                    <div class="row" style={(style != "undefined") ? style : ""}>
                         <div class="col-lg-1 col-xs-12 count">
                            <span></span>
                            <span>Internal:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 active-count count">
                            <span class="text-white">{(data.Internal.Active - data.Internal.Issues) + data.Internal.Issues}</span>
                            <span class="text-white">Active Projects:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 on-time count">
                            <span class="text-white">
                                {data.Internal.Active - data.Internal.Issues}
                            </span>
                            <span class="text-white">Projects On Time:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 issues count">
                            <span class="text-white">
                                {(data.Internal.Issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                                {data.Internal.Issues}
                            </span>
                            <span class="text-white">Projects With Issues:</span>
                        </div>
                    </div>
                }
                {
                    (typeof this.props.loggedUser.data.userRole != "undefined" &&
                        (this.props.loggedUser.data.userRole <= 4)) &&
                    <div class="row" style={(style != "undefined") ? style : ""}>
                         <div class="col-lg-1 col-xs-12 count">
                            <span></span>
                            <span>Private:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 active-count count">
                            <span class="text-white">{(data.Private.Active - data.Private.Issues) + data.Private.Issues}</span>
                            <span class="text-white">Active Projects:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 on-time count">
                            <span class="text-white">
                                {data.Private.Active - data.Private.Issues}
                            </span>
                            <span class="text-white">Projects On Time:</span>
                        </div>
                        <div class="col-lg-3 col-xs-12 issues count">
                            <span class="text-white">
                                {(data.Private.Issues > 0) && <i class="fa fa-exclamation-circle fa-lg" aria-hidden="true" style={{ marginRight: "5px" }}></i>}
                                {data.Private.Issues}
                            </span>
                            <span class="text-white">Projects With Issues:</span>
                        </div>
                    </div>
                }
            </div>
        )
    }
}