import React from "react";
import moment from "moment";
import _ from "lodash";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { showToast, getData } from "../../globalFunction";

@connect(store => {
    return {
        notes: store.notes
    };
})
export default class ConversationList extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            "fetchNotes",
            "getNextResult",
            "handleChange",
            "clearSearch"
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidUpdate(prevProps) {
        const { notes } = { ...this.props };

        if (_.isEqual(prevProps.notes.Filter, notes.Filter) == false) {
            this.fetchNotes(1);
        }
    }

    componentDidMount() {
        this.fetchNotes(1);
    }

    fetchNotes(page) {
        const { projectId, dispatch, notes } = { ...this.props };
        const { List, Filter } = notes;
        let requestUrl = `/api/conversation?page=${page}&projectId=${projectId}`;

        if (Filter.title != "") {
            requestUrl += `&title=${Filter.title}`;
        }

        getData(requestUrl, {}, (c) => {
            dispatch({ type: "SET_NOTES_LIST", list: [...List, ...c.data.result], count: c.data.count });
            dispatch({ type: "SET_NOTES_LOADING", Loading: "" });
        });
    }

    getNextResult() {
        const { notes, dispatch } = { ...this.props };
        const { Count } = notes;

        dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
        this.fetchNotes(Count.current_page + 1);
    }

    handleChange(e) {
        const { dispatch, notes } = this.props;
        const { Filter } = notes;

        if ((typeof e.key != "undefined" && e.key === 'Enter' && e.target.value != "") && Filter.title != e.target.value) {
            dispatch({ type: "SET_NOTES_LIST", list: [] });
            dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
            dispatch({
                type: "SET_NOTES_FILTER", filter: {
                    title: e.target.value
                }
            });
        }
    }

    clearSearch() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_NOTES_LIST", list: [] });
        dispatch({ type: "SET_NOTES_FILTER", filter: { title: "" } });
    }


    render() {
        const { notes } = { ...this.props };
        const { List, Count, Filter } = notes;
        const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;

        return (
            <div id="message_list">
                <div class="mb20 display-flex">
                    <input
                        type="text"
                        name="search"
                        class="form-control"
                        placeholder="Search topic"
                        onKeyPress={this.handleChange}
                    />
                    {
                        (typeof Filter.title != "undefined" && Filter.title != "") && <a
                            class="logo-action text-grey"
                            onClick={this.clearSearch}
                        >
                            <i class="fa fa-times-circle-o ml5" aria-hidden="true"></i>
                        </a>
                    }
                </div>
                <div class={`pd10 ${(notes.Loading == "RETRIEVING" && (notes.List).length == 0) ? "linear-background" : ""}`}>
                    {
                        (List.length > 0) && <div>
                            {
                                _.map(List, ({ note, noteWorkstream }, index) => {
                                    return (
                                        <div key={index} class="message-div bb display-flex">
                                            <a class="logo-action text-grey" onClick={() => this.starredTask()}>
                                                <i title="FAVORITE" class={`fa fa-star`} aria-hidden="true"></i>
                                            </a>
                                            <div>
                                                <p class="note mb0">{noteWorkstream.workstream}</p>
                                                <h3>{note}</h3>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    }
                    {
                        (notes.Loading == "RETRIEVING" && (List).length > 0) && <Loading />
                    }
                    {
                        (currentPage != lastPage && notes.Loading != "RETRIEVING") && <p class="mb0 text-center"><a onClick={() => this.getNextResult()}>Load More Projects</a></p>
                    }
                    {
                        ((List).length == 0 && notes.Loading != "RETRIEVING") && <p class="mb0 text-center"><strong>No Records Found</strong></p>
                    }
                </div>
            </div>
        );
    }
}
