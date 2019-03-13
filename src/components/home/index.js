import React from "react";
import MyTaskStatus from "../myTasks/myTaskStatus";
import ProjectSummary from "../project/projectSummary";
import ProjectCompletionTasks from "../project/projectCompletionTasks";

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
            <div>
                <div class="row">
                    <div class="col-lg-8">
                        <div class="card mb20">
                            <div class="card-header">
                                <h4>Tasks Due Today</h4>
                            </div>
                            <div class="card-body">
                                <MyTaskStatus history={history} />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-lg-12">
                        <div class="card mb10">
                            <div class="card-header">
                                <h4>Projects Summary</h4>
                            </div>
                            <div class="card-body">
                                <ProjectSummary />
                            </div>
                        </div>
                    </div>
                </div>
                <ProjectCompletionTasks handleRedirect={this.handleRedirect} />
            </div>
        )
    }
}