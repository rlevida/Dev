import React from "react";
import { connect } from "react-redux";
import _ from "lodash";

import TaskTimeline from "../task/taskTimeline";

@connect((store) => {
    return {
        workstream: store.workstream
    }
})
export default class WorkstreamDetails extends React.Component {
    constructor(props) {
        super(props);
        _.map([
            "getList"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidMount() {
        this.getList(1);
    }
    getList(page) {
        // const { loggedUser, dispatch, date, task } = this.props;
        // const { Filter } = task;

        // let fromDate = "";
        // let toDate = "";

        // let fetchUrl = `/api/task?page=${page}&userId=${loggedUser.data.id}&type=${Filter.type}`;

        // switch (date) {
        //     case "Today":
        //         fromDate = moment().startOf('year').format("YYYY-MM-DD");
        //         toDate = moment().format("YYYY-MM-DD");
        //         break;
        //     case "This week":
        //         fromDate = moment().add('days', 1).format("YYYY-MM-DD");
        //         toDate = moment().add('days', 8).format("YYYY-MM-DD");
        //         break;
        //     case "This month":
        //         fromDate = moment().add('days', 9).format("YYYY-MM-DD");
        //         toDate = moment().add('days', 38).format("YYYY-MM-DD");
        //         break;
        //     case "Succeeding month":
        //         fromDate = moment().add('days', 39).format("YYYY-MM-DD");
        //         toDate = moment().endOf("year").format("YYYY-MM-DD");
        //         break;
        //     default:
        // }

        // if (typeof date != "undefined" && date != "") {
        //     fetchUrl += `&dueDate=${JSON.stringify({ opt: "between", value: [fromDate, toDate] })}`;
        // } else {
        //     fetchUrl += `&dueDate=null`
        // }

        // getData(fetchUrl, {}, (c) => {
        //     this.setState({ count: c.data.count, loading: "" }, () => dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result }));
        //     showToast("success", "Task successfully retrieved.");
        // });
    }
    render() {
        const { match } = { ...this.props };
        const projectId = match.params.projectId;
        const workstreamId = match.params.workstreamId;
        return (
            <div>
                <TaskTimeline workstream_id={workstreamId} project_id={projectId} />
            </div>
        )
    }
}