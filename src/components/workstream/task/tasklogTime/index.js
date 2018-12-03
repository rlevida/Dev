import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { getData } from "../../../../globalFunction";

@connect(({ tasktimeLog, task }) => {
    return {
        tasktimeLog,
        task,
        loggedUser
    }
})

export default class TaskTimelog extends React.Component {
    constructor(props) {
        super(props);

        this.fetchData = this.fetchData.bind(this);
        this.generateList = this.generateList.bind(this);
    }

    getNextResult() {
        const { tasktimeLog } = { ...this.props };
        this.fetchData(tasktimeLog.Count.current_page + 1);
    }

    fetchData(page) {
        const { task, dispatch, loggedUser } = { ...this.props };
        let requestUrl = `/api/taskTimeLogs?taskId=${task.Selected.id}&page=${page}&includes=user`;

        if (loggedUser.user_role[0].roleId >= 3) {
            requestUrl += `&userId=${loggedUser.id}`
        }

        getData(requestUrl, {}, (c) => {
            if (c.status == 200) {
                const { data } = c;
                const totalCount = _(data.total_hours)
                    .map((totalObj) => {
                        if (totalObj.period == "hours") {
                            totalObj.value = totalObj.value * 60
                        }
                        return totalObj;
                    })
                    .value();

                dispatch({ type: "UPDATE_TASKTIMELOG_LIST", list: data.result, count: data.count });
                dispatch({ type: "SET_TOTAL_HOURS", list: data.result, hours: _.round(_.divide(_.sumBy(totalCount, 'value'), 60), 2) });
            }
        })
    }

    generateList(params) {
        const {
            user,
            time,
            period,
            description,
            dateAdded
        } = params;
        const {
            firstName,
            lastName
        } = user;
        return (
            <div>
                <p style={{ marginTop: 0, marginBottom: 0, fontSize: 10 }}>Log Time: <strong>{time}</strong></p>
                <p style={{ marginTop: 0, marginBottom: 0, fontSize: 10 }}>Period: <strong>{period}</strong></p>
                <p style={{ marginTop: 0, marginBottom: 0, fontSize: 10 }}>Description: {description}</p>
                <p style={{ marginTop: 5, marginBottom: 0, fontSize: 10, }}>
                    {`${moment(dateAdded).format("MMM DD, YYYY HH:mm:ss")} - ${firstName} ${lastName}`}
                </p>
            </div>
        )
    }

    render() {
        const { tasktimeLog } = { ...this.props };
        const {
            current_page: currentPage = 1,
            last_page: lastPage = 1
        } = tasktimeLog.Count;
        return (
            <div>
                <p style={{ marginLeft: 15 }}>Total Logged Time: {tasktimeLog.TotalHours} Hours</p>
                {
                    _.map(tasktimeLog.List, (tasktimeLogObj, index) => {
                        return (
                            <div key={index} style={{ marginLeft: 15, padding: 5, backgroundColor: (index % 2) ? "#ddd" : "fff" }}>
                                {
                                    this.generateList(tasktimeLogObj)
                                }
                            </div>
                        )

                    })
                }
                <div style={{ marginLeft: 15, textAlign: "center" }}>
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>See More</a>
                    }
                </div>
            </div>
        )
    }
}