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
        const { type = "", starred } = { ...this.props };
        if (typeof starred.Count[type] == "undefined" || _.isEmpty(starred.Count[type])) {
            this.fetchData({ page: 1, type });
        }
    }
    componentWillUnmount() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_STARRED_LIST", list: [], count: {} });
    }
    fetchData({ page, type }) {
        const { loggedUser, dispatch, starred, project_id = "" } = { ...this.props };
        const { List, Count } = starred;
        const reqUrl = `/api/starred?page=${page}&userId=${loggedUser.data.id}&isActive=1&type=${type}&projectId=${project_id}`;

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
    renderList({ id, title, workstream = "" }) {
        return (
            <div class="starred">
                <div class="action-link">
                    <a class="mr10" onClick={() => this.removeStarred(id)}>
                        <span>
                            <i title="FAVORITE" class="fa fa-star text-yellow" aria-hidden="true"></i>
                        </span>
                    </a>
                    <div>
                        <p class="mb0 title">
                            {title}
                        </p>
                        {
                            (workstream != "") && <p class="ml20">{workstream}</p>
                        }
                    </div>
                </div>
            </div>
        )
    }
    getNextResult() {
        const { starred, type = "" } = { ...this.props };
        this.fetchData({ page: starred.Count[type].current_page + 1, type });
    }
    render() {
        const { starred, type = "", label = "" } = { ...this.props };
        const starredList = _.filter(starred.List, (o) => { return o.type == type });
        const currentPage = (typeof starred.Count[type] != "undefined" && _.isEmpty(starred.Count[type]) == false) ? starred.Count[type].current_page : 1;
        const lastPage = (typeof starred.Count[type] != "undefined" && _.isEmpty(starred.Count[type]) == false) ? starred.Count[type].last_page : 1;

        return (
            <div>
                <h5 class="mb20 mt0"><strong>{`${label}`}</strong></h5>
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