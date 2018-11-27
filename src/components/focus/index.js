import React from "react";
import { connect } from "react-redux";
import _ from "lodash";
import { getData, showToast } from "../../globalFunction";
import { Loading } from "../../globalComponents";
import List from "./list"

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
    }

    componentDidMount() {
        const { starred } = { ...this.props }
        const { Count } = starred;

        if (_.isEmpty(Count)) {
            this.fetchData({ page: 1, type: "task" })
        }
    }

    fetchData({ page, type }) {
        const { loggedUser, dispatch, starred } = { ...this.props };
        const { List } = starred;

        getData(`/api/starred?page=${page}&type=${type}&userId=${loggedUser.data.id}&isActive=1`, {}, (c) => {
            if (c.status == 200) {
                const { result, count } = c.data;
                dispatch({ type: "SET_STARRED_LIST", list: [...List, ...result], count: count });
                dispatch({ type: "SET_STARRED_TYPE", starred_type: type });
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

    render() {
        const { starred } = { ...this.props };
        const {
            current_page: currentPage = 1,
            last_page: lastPage = 1
        } = starred.Count;


        return (
            <div>
                <ul class="list-inline">
                    <li class="list-inline-item"><a>Task</a></li>|
                    <li class="list-inline-item"><a>Notes</a></li>
                </ul>
                <List />
                {
                    (starred.Loading == "RETRIEVING") && <Loading />
                }
                <div class="text-center">
                    {
                        (currentPage != lastPage) && <a onClick={() => this.getNextResult()}>Load More Focus</a>
                    }
                    {
                        (starred.List.length == 0 && starred.Loading != "RETRIEVING") && <p>No Records Found</p>
                    }
                </div>
            </div>
        )
    }
}