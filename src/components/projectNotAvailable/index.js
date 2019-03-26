import React from "react";
import MyTaskStatus from "../myTasks/myTaskStatus";
import ProjectSummary from "../project/projectSummary";
import ProjectCompletionTasks from "../project/projectCompletionTasks";
import ProfilePerformance from "../profile/profilePerformance";

export default class Component extends React.Component {
    constructor(props) {
        super(props);
        this.handleRedirect = this.handleRedirect.bind(this);
    }

    handleRedirect(url) {
        this.props.history.push(url)
    }

    render() {
        const { history } = { ...this.props };
        return (
                <div class="row">
                     <div class="col-lg-12 col-md-12 col-sm-12">
                        <div class="no-project">
                            <span>No Assigned Project</span>
                        </div>
                    </div>
                </div>
        )
    }
}