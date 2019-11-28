import React from "react";
import { connect } from "react-redux";
import { Route, Switch } from "react-router-dom";

import WorkstreamList from "./workstreamList";
import WorkstreamDetails from "./workstreamDetails";
import WorkstreamForm from "./workstreamForm";
import _ from "lodash";
import moment from "moment";
@connect(store => {
    return {
        workstream: store.workstream,
        project: store.project,
        task: store.task
    };
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        // const instanceArray = [
        //     {
        //         id: 1,
        //         taskId: 1,
        //         date: moment(new Date())
        //             .add(1, "days")
        //             .format("MMM DD YY")
        //     },
        //     {
        //         id: 2,
        //         taskId: 1,
        //         date: moment(new Date())
        //             .add(2, "days")
        //             .format("MMM DD YY")
        //     },
        //     {
        //         id: 3,
        //         taskId: 1,
        //         date: moment(new Date())
        //             .add(3, "days")
        //             .format("MMM DD YY")
        //     },
        //     {
        //         id: 4,
        //         date: moment(new Date())
        //             .add(4, "days")
        //             .format("MMM DD YY")
        //     }
        // ];
        // const group = _.groupBy(instanceArray, "taskId");
        // const sorted = _.values(
        //     _.mapValues(group, e => {
        //         if (e.length > 0) {
        //             return _.orderBy(e, ["date"], ["desc"])[0];
        //         } else {
        //             return e[0];
        //         }
        //     })
        // );
    }
    componentWillUnmount() {
        const { dispatch, task, project } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_WORKSTREAM_LOADING", Loading: "RETRIEVING" });

        if (project.FormActive != "Form" && task.FormActive != "Form") {
            dispatch({ type: "SET_WORKSTREAM_LIST", list: [], Count: {} });
            dispatch({ type: "SET_TASK_LIST", list: [], count: {} });
        }
        window.stop();
    }

    render() {
        const { workstream } = { ...this.props };
        return (
            <div>
                {workstream.FormActive == "Form" && <WorkstreamForm />}
                {workstream.FormActive == "List" && (
                    <Switch>
                        <Route exact={true} path={`${this.props.match.path}`} component={WorkstreamList} />
                        <Route path={`${this.props.match.path}/:workstreamId`} component={WorkstreamDetails} />
                    </Switch>
                )}
            </div>
        );
    }
}
