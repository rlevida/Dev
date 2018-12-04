import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData, showToast } from "../../globalFunction";
import { Loading } from "../../globalComponents";
import List from "./list"

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

        this.fetchData = this.fetchData.bind(this);
        this.getNextResult = this.getNextResult.bind(this);
        this.setType = this.setType.bind(this);
    }

    componentDidMount() {
        const { starred, dispatch } = { ...this.props }
        const { Count } = starred;

        if (_.isEmpty(Count)) {
            dispatch({ type: "SET_STARRED_TYPE", starred_type: "task" });
            this.fetchData({ page: 1, type: "task" });
        }
    }

    fetchData({ page, type }) {
        const { loggedUser, dispatch, starred } = { ...this.props };
        const { List } = starred;
        let reqUrl = `/api/starred?page=${page}&userId=${loggedUser.data.id}&isActive=1`

        if (type != "all") {
            reqUrl += `&type=${type}`
        }

        getData(reqUrl, {}, (c) => {
            if (c.status == 200) {
                const { result, count } = c.data;
                dispatch({ type: "SET_STARRED_LIST", list: [...List, ...result], count: count });
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    getNextResult() {
        const { starred } = { ...this.props };
        const { Count, Type } = starred;
        this.fetchData({ page: Count.current_page + 1, type: Type });
    }

    setType(type) {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_STARRED_LIST", list: [] });
        dispatch({ type: "SET_STARRED_LOADING", Loading: "RETRIEVING" });
        dispatch({ type: "SET_STARRED_TYPE", starred_type: type });

        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchData({ page: 1, type });
        }, 1500);
    }

    render() {
        const { starred } = { ...this.props };
        const {
            current_page: currentPage = 1,
            last_page: lastPage = 1
        } = starred.Count;

        return (
            <div>
                <ul class="list-inline">
                    <li class="list-inline-item"><a onClick={() => this.setType("all")}><i class="fa fa-list" aria-hidden="true"></i> All</a></li>|
                    <li class="list-inline-item"><a onClick={() => this.setType("task")}><i class="fa fa-tasks" aria-hidden="true"></i> Task</a></li>|
                    <li class="list-inline-item"><a onClick={() => this.setType("notes")}><i class="fa fa-comments" aria-hidden="true"></i> Notes</a></li>|
                    <li class="list-inline-item"><a onClick={() => this.setType("document")}><i class="fa fa-calendar" aria-hidden="true"></i> Documents</a></li>
                    <li></li>
                </ul>
                <List />
                {
                    (starred.Loading == "RETRIEVING") && <Loading />
                }
                <div class="text-center">
                    {
                        (currentPage != lastPage && starred.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Focus</a>
                    }
                    {
                        (starred.List.length == 0 && starred.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}