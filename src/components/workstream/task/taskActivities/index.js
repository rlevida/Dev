import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import moment from "moment";

import { getData } from "../../../../globalFunction";

@connect(({ task, activityLog }) => {
    return {
        task,
        activityLog
    }
})

export default class TaskActivities extends React.Component {
    constructor(props) {
        super(props);

        this.generateCreate = this.generateCreate.bind(this);
        this.generateModified = this.generateModified.bind(this);
        this.getNextResult = this.getNextResult.bind(this);
        this.fetchData = this.fetchData.bind(this);
    }

    componentDidMount() {
        const { activityLog } = { ...this.props };
        const { Count } = activityLog;
        
        if (_.isEmpty(Count)) {
            this.fetchData(1);
        } else if (Count.current_page != Count.last_page) {
            this.fetchData(Count.current_page + 1);
        }
    }

    getNextResult() {
        const { activityLog } = { ...this.props };
        this.fetchData(activityLog.Count.current_page + 1);
    }

    fetchData(page) {
        const { task, dispatch } = { ...this.props };

        getData(`/api/activityLog?taskId=${task.Selected.id}&page=${page}&includes=user`, {}, (c) => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "UPDATE_ACTIVITYLOG_LIST", list: data.result, count: data.count });
            }
        })
    }

    generateCreate(params) {
        const { user } = params;
        const { firstName, lastName, dateAdded } = user;
        return (
            <div>
                <p class="m0">Task Created</p>
                <p style={{ marginTop: 5, fontSize: 10, marginBottom: 0 }}>
                    {`${moment(dateAdded).format("MMM DD, YYYY")} - ${firstName} ${lastName}`}
                </p>
            </div>
        );
    }

    generateModified(params) {
        const { user } = params;
        const { firstName, lastName, dateAdded } = user;
        const oldValue = (params.old != "" && params.old != null) ? JSON.parse(params.old) : [];
        const newValue = (params.new != "" && params.new != null) ? JSON.parse(params.new) : [];
        const modifiedObject = _.keys(oldValue)[0];
        const attributeEdited = (modifiedObject.replace('_', ' '));

        return (
            <div>
                <p class="m0">Task Updated</p>
                <p style={{ marginTop: 5, marginBottom: 5, fontSize: 10 }}>
                    {`Edited ${attributeEdited.replace(/_/g, ' ').replace(/(?: |\b)(\w)/g, function (key) { return key.toUpperCase() })}`}
                </p>
                {
                    _.map(oldValue[modifiedObject], (objectValues, key) => {
                        let fromValue = (objectValues != null) ? objectValues : "";
                        let toValue = (typeof newValue[modifiedObject][key] != "undefined" && newValue[modifiedObject][key] != null) ? newValue[modifiedObject][key] : "";


                        if (Array.isArray(fromValue) || Array.isArray(toValue)) {
                            return (
                                <div key={key} >
                                    <p style={{ fontSize: 10, margin: 0 }}>From:</p>
                                    {
                                        (fromValue.length > 0) && _.map(fromValue, (fromValueObj, index) => {
                                            return (
                                                <p key={index} style={{ fontSize: 10, marginTop: 0, marginBottom: 0, marginLeft: 5 }}>{fromValueObj.value}</p>
                                            )
                                        })
                                    }
                                    {
                                        (fromValue.length == 0) && <p style={{ fontSize: 10, marginTop: 0, marginBottom: 0, marginLeft: 5 }}>""</p>
                                    }

                                    <p style={{ fontSize: 10, margin: 0 }}>To:</p>
                                    {
                                        (toValue.length > 0) && _.map(toValue, (toValueObj, index) => {
                                            return (
                                                <p key={index} style={{ fontSize: 10, marginTop: 0, marginBottom: 0, marginLeft: 5 }}>{toValueObj.value}</p>
                                            )
                                        })
                                    }
                                    {
                                        (toValue.length == 0) && <p style={{ fontSize: 10, marginTop: 0, marginBottom: 0, marginLeft: 5 }}>""</p>
                                    }
                                </div>
                            )
                        } else {
                            if ((key.toLowerCase()).includes('date')) {
                                fromValue = (fromValue != "") ? moment(fromValue).format("MMM DD, YYYY") : "";
                                toValue = (toValue != "") ? moment(toValue).format("MMM DD, YYYY") : "";
                            }

                            return (
                                <p key={key} style={{ fontSize: 10, margin: 0 }}>{`From: ${(fromValue != "") ? fromValue : "''"} To: ${(toValue != "") ? toValue : "''"}`}</p>
                            );
                        }
                    })
                }
                <p style={{ marginTop: 5, fontSize: 10, marginBottom: 0 }}>
                    {`${moment(dateAdded).format("MMM DD, YYYY")} - ${firstName} ${lastName}`}
                </p>
            </div>
        );
    }

    render() {
        const { activityLog } = { ...this.props };
        const currentPage = (typeof activityLog.Count.current_page != "undefined") ? activityLog.Count.current_page : 1;
        const lastPage = (typeof activityLog.Count.last_page != "undefined") ? activityLog.Count.last_page : 1;

        return (
            <div>
                {
                    _.map(activityLog.List, (activityLogObj, index) => {
                        return (
                            <div key={index} style={{ marginLeft: 15, padding: 5, backgroundColor: (index % 2) ? "#ddd" : "fff" }}>
                                {
                                    (activityLogObj.actionType == "created") && this.generateCreate(activityLogObj)
                                }
                                {
                                    (activityLogObj.actionType == "modified") && this.generateModified(activityLogObj)
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