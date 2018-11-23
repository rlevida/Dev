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

        this.generateCreateorDelete = this.generateCreateorDelete.bind(this);
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

    generateCreateorDelete(params) {
        const { user, title, linkType, actionType, dateAdded } = params;
        const { firstName, lastName } = user;
        const objValue = (params.new != null) ? JSON.parse(params.new) : JSON.parse(params.old);
        const modifiedObject = _.keys(objValue)[0];
        const attributeEdited = (modifiedObject.replace('_', ' '));
        const actionLabel = actionType.charAt(0).toUpperCase() + actionType.slice(1).toLowerCase();
        const linkTypeLabel = linkType.charAt(0).toUpperCase() + linkType.slice(1).toLowerCase();

        return (
            <div>
                <p style={{ marginTop: 0, marginBottom: 0 }} class="m0">
                    {actionLabel + " " + attributeEdited.replace(/_/g, ' ').replace(/(?: |\b)(\w)/g, function (key) { return key.toUpperCase() })}
                </p>
                <p style={{ marginTop: 0, marginBottom: 0, fontSize: 10 }}>{linkTypeLabel + ": "}<strong>{title}</strong></p>
                <p style={{ marginTop: 5, marginBottom: 0, fontSize: 10, }}>
                    {`${moment(dateAdded).format("MMM DD, YYYY HH:mm:ss")} - ${firstName} ${lastName}`}
                </p>
            </div>
        );
    }

    generateModified(params) {
        const { user, title, linkType, dateAdded } = params;
        const { firstName, lastName } = user;
        const oldValue = (params.old != "" && params.old != null) ? JSON.parse(params.old) : [];
        const newValue = (params.new != "" && params.new != null) ? JSON.parse(params.new) : [];
        const modifiedObject = _.keys(newValue)[0];
        let attributeEdited = (modifiedObject.replace('_', ' '));
        attributeEdited = attributeEdited.replace(/_/g, ' ').replace(/(?: |\b)(\w)/g, function (key) { return key.toUpperCase() });
        const linkTypeLabel = linkType.charAt(0).toUpperCase() + linkType.slice(1).toLowerCase();

        return (
            <div>
                <p style={{ marginTop: 0, marginBottom: 0 }} class="m0">{`Edited ${attributeEdited}`}</p>
                {
                    (title != null && title != "") && <p style={{ marginTop: 0, marginBottom: 0, fontSize: 10 }}>{linkTypeLabel + ": "}<strong>{title}</strong></p>
                }
                {
                    _.map(newValue[modifiedObject], (objectValues, key) => {
                        let toValue = (objectValues != null) ? objectValues : "";
                        let fromValue = (typeof oldValue[modifiedObject][key] != "undefined" && oldValue[modifiedObject][key] != null) ? oldValue[modifiedObject][key] : "";

                        if (Array.isArray(fromValue) || Array.isArray(toValue)) {
                            return (
                                <div key={key} >
                                    {
                                        (toValue.length == 0 && fromValue.length > 0) && <div>
                                            <p style={{ fontSize: 10, marginTop: 0, marginBottom: 0 }}>Removed:</p>
                                            {
                                                (fromValue.length > 0) && _.map(fromValue, (fromValueObj, index) => {
                                                    return (
                                                        <p key={index} style={{ fontSize: 10, marginTop: 0, marginBottom: 0 }}><strong>{fromValueObj.value}</strong></p>
                                                    )
                                                })
                                            }
                                        </div>
                                    }
                                    {
                                        (toValue.length > 0 && fromValue.length == 0) && <div>
                                            <p style={{ fontSize: 10, marginTop: 0, marginBottom: 0 }}>Added:</p>
                                            {
                                                (toValue.length > 0) && _.map(toValue, (toValueObj, index) => {
                                                    return (
                                                        <p key={index} style={{ fontSize: 10, marginTop: 0, marginBottom: 0 }}><strong>{toValueObj.value}</strong></p>
                                                    )
                                                })
                                            }
                                        </div>
                                    }

                                </div>
                            )
                        } else {
                            if ((key.toLowerCase()).includes('date')) {
                                fromValue = (fromValue != "") ? moment(fromValue).format("MMM DD, YYYY") : "";
                                toValue = (toValue != "") ? moment(toValue).format("MMM DD, YYYY") : "";
                            }
                            return (
                                <div key={key}>
                                    {
                                        (toValue != "" && fromValue == "") && <div>
                                            <p style={{ fontSize: 10, marginTop: 0, marginBottom: 0 }}>Updated: {key.replace(/_/g, ' ').replace(/(?: |\b)(\w)/g, function (key) { return key.toUpperCase() })}</p>
                                            <p style={{ fontSize: 10, margin: 0 }}><strong>{toValue}</strong></p>
                                        </div>
                                    }
                                    {
                                        (toValue != "" && fromValue != "") && <p style={{ fontSize: 10, margin: 0 }}>To: <strong>{toValue}</strong> From: <strong>{fromValue}</strong></p>
                                    }
                                </div>
                            );
                        }
                    })
                }
                <p style={{ marginTop: 5, fontSize: 10, marginBottom: 0 }}>
                    {`${moment(dateAdded).format("MMM DD, YYYY HH:mm:ss")} - ${firstName} ${lastName}`}
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
                                    (activityLogObj.actionType == "created" || activityLogObj.actionType == "deleted" || activityLogObj.actionType == "added") && this.generateCreateorDelete(activityLogObj)
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