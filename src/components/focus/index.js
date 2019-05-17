import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData, showToast, postData } from "../../globalFunction";
import { Loading } from "../../globalComponents";

let keyTimer = "";

@connect(({ loggedUser, starred }) => {
    return {
        loggedUser,
        starred
    }
})
export default class Component extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "fetchData",
            "renderList",
            "removeStarred",
            "getNextResult"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }
    componentDidMount() {
        const { type = "", starred, project_id } = { ...this.props };
        if (typeof starred.Count[type] == "undefined" || _.isEmpty(starred.Count[type])) {
            this.fetchData({ page: 1, type, project_id });
        }
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_STARRED_LIST", list: [], count: {} });
    }

    componentWillReceiveProps(props) {
        const { type = "", starred, project_id } = { ...props };
        if (props.project_id != this.props.project_id) {
            this.fetchData({ page: 1, type, project_id });
        }
    }

    fetchData({ page, type, project_id: projectId }) {
        const { loggedUser, dispatch, starred } = { ...this.props };
        const { Count } = starred;
        const reqUrl = `/api/starred?page=${page}&userId=${loggedUser.data.id}&isActive=1&type=${type}&projectId=${projectId}`;

        dispatch({ type: "SET_STARRED_LOADING", Loading: { [type]: "RETRIEVING" } });
        getData(reqUrl, {}, (c) => {
            if (c.status == 200) {
                const { result, count } = c.data;
                dispatch({ type: "UPDATE_DATA_STARRED_LIST", List: result, count: { ...Count, [type]: count } });
                dispatch({ type: "SET_STARRED_LOADING", Loading: { [type]: "" } });
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    removeStarred(id) {
        const { starred, dispatch } = { ...this.props };
        const { List } = starred;

        postData(`/api/starred/`, { id }, (c) => {
            if (c.status == 200) {
                const updatedList = _.remove(List, (listObj) => { return listObj.id != id });
                dispatch({ type: "SET_STARRED_LIST", list: updatedList });
                showToast("success", `Item successfully removed.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }
    renderList(obj) {
        const { id, title, workstream = "" } = { ...obj };
        return (
            <div class="starred">
                <div class="action-link">
                    <a class="mr10" onClick={() => this.removeStarred(id)}>
                        <span>
                            <i title="FAVORITE" class="fa fa-star text-yellow" aria-hidden="true"></i>
                        </span>
                    </a>
                    <div>
                        <a href="javascript:void(0)" class="mb0 title" onClick={() => this.renderStarred(obj)}>
                            {title.substring(0, 30)}{(title.length > 30) ? "..." : ""}
                        </a>
                        {
                            (workstream != "") && <p class="m0 note">{workstream}</p>
                        }
                    </div>
                </div>
            </div>
        )
    }
    renderStarred(obj) {
        switch (obj.linkType) {
            case 'task':
                this.openTaskDetails(obj.linkId);
                break;
            case 'document':
                this.openFileViewer(obj);
                break
            case 'notes':
                this.openNotes(obj);
                break
        }
    }
    openTaskDetails(id) {
        const { dispatch, loggedUser } = { ...this.props };
        dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });

        getData(`/api/activityLog?taskId=${id}&page=1&includes=user`, {}, (c) => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_ACTIVITYLOG_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/conversation/getConversationList?page=1&linkType=task&linkId=${id}`, {}, (c) => {
            if (c.status == 200) {
                const { data } = c;
                dispatch({ type: "SET_COMMENT_LIST", list: data.result, count: data.count });
            }
        });

        getData(`/api/task/detail/${id}?starredUser=${loggedUser.data.id}`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASK_SELECTED", Selected: c.data });
                dispatch({ type: "SET_TASK_LOADING", Loading: "" });
                $(`#task-details`).modal('show');
            }
        });

        getData(`/api/taskTimeLogs?taskId=${id}&page=1`, {}, (c) => {
            if (c.status == 200) {
                dispatch({ type: "SET_TASKTIMELOG_LIST", list: c.data.result, count: c.data.count });
                dispatch({ type: "SET_TOTAL_HOURS", total: c.data.total_hours });
            }
        });
    }
    openFileViewer({ document, linkId }) {
        const { dispatch } = { ...this.props };
        $(`#documentViewerModal`).modal('show');
        getData(`/api/conversation/getConversationList?page=${1}&linkType=document&linkId=${linkId}`, {}, (c) => {
            dispatch({ type: 'SET_DOCUMENT_SELECTED', Selected: document });
            dispatch({ type: 'SET_COMMENT_LIST', list: c.data.result, count: c.data.count });
            dispatch({ type: 'SET_COMMENT_LOADING', Loading: "" });
        })
    }
    openNotes(obj) {
        const { history, project_id } = { ...this.props };
        history.push(`/projects/${project_id}/messages?note-id=${obj.linkId}`)
    }
    getNextResult() {
        const { starred, type = "", project_id } = { ...this.props };
        this.fetchData({ page: starred.Count[type].current_page + 1, type, project_id });
    }
    render() {
        const { starred, type = "", label = "" } = { ...this.props };
        const starredList = _.filter(starred.List, (o) => { return o.type == type });
        const currentPage = (typeof starred.Count[type] != "undefined" && _.isEmpty(starred.Count[type]) == false) ? starred.Count[type].current_page : 1;
        const lastPage = (typeof starred.Count[type] != "undefined" && _.isEmpty(starred.Count[type]) == false) ? starred.Count[type].last_page : 1;
        return (
            <div>
                <h5 class="mt0"><strong>{`${label}`}</strong></h5>
                <div class={((starred.Loading[type] == "RETRIEVING" || _.isEmpty(starred.Loading)) && starredList.length == 0) ? "linear-background" : ""}>
                    {
                        _.map(starredList, (o, index) => {
                            return (
                                <div key={index}>
                                    {
                                        this.renderList(o)
                                    }
                                </div>
                            )
                        })
                    }
                </div>
                {
                    (currentPage != lastPage && starred.Loading[type] != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More</a>
                }
                {
                    (starredList.length == 0 && starred.Loading[type] != "RETRIEVING") && <p>No Records Found</p>
                }
            </div>
        )
    }
}