import React from "react";
import { connect } from "react-redux";
import { postData, showToast } from "../../globalFunction";
import _ from "lodash";

@connect(({ starred }) => {
    return {
        starred
    }
})
export default class List extends React.Component {
    constructor(props) {
        super(props);
        this.generateList = this.generateList.bind(this);
        this.removeStarred = this.removeStarred.bind(this);
    }

    removeStarred(id) {
        const { starred, dispatch } = { ...this.props };
        const { List } = starred;

        postData(`/api/starred/`, { id }, (c) => {
            if (c.status == 200) {
                const updatedList = _.remove(List, (listObj) => { return listObj.id != id });
                dispatch({ type: "SET_STARRED_LIST", list: updatedList });
                showToast("success", `Item successfully unstarred.`);
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    generateList({ title, isActive, index, id }) {
        return (
            <tr key={index}>
                <td style={{ maxWidth: 10 }}>
                    <a onClick={() => this.removeStarred(id)}>
                        <span class={`fa ${(isActive == 1) ? "fa-star" : "fa-star-o"}`} />
                    </a>
                </td>
                <td class="text-left">{title}</td>
            </tr>
        );
    }

    render() {
        const { starred } = { ...this.props };
        const { List } = starred;

        return (
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th>Item</th>
                    </tr>
                    {
                        _.map(List, (listObj, index) => this.generateList({ ...listObj, index }))
                    }
                </tbody>
            </table>
        )
    }
}