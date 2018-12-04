import React from "react";
import { connect } from "react-redux";
import { postData, showToast } from "../../globalFunction";
import _ from "lodash";
import moment from "moment";

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

    generateList({ title, isActive, index, id, linkType, task = "" }) {
        const { starred } = { ...this.props };
        const { Type } = starred;

        return (
            <tr key={index}>
                <td style={{ maxWidth: 10 }}>
                    <a onClick={() => this.removeStarred(id)}>
                        <span class={`fa ${(isActive == 1) ? "fa-star" : "fa-star-o"}`} />
                    </a>
                </td>
                <td class="text-left">
                    <p style={{ margin: 0 }}>{title}</p>
                </td>
                {
                    (linkType == "task" && Type != "all") && <td class="text-left">
                        {
                            (task.dueDate != null && task.dueDate != "") && <p style={{ margin: 0 }}>{moment(task.dueDate).format("MMM DD, YYYY")}</p>
                        }
                    </td>
                }
                {
                    (Type == "all") && <td class="text-left">
                        <p style={{ textTransform: "capitalize", margin: 0 }}>{linkType}</p>
                    </td>
                }
            </tr>
        );
    }

    render() {
        const { starred } = { ...this.props };
        const { List, Type } = starred;

        return (
            <table id="dataTable" class="table responsive-table">
                <tbody>
                    <tr>
                        <th></th>
                        <th>Item</th>
                        {
                            (Type == "task") && <th>Due Date</th>
                        }
                        {
                            (Type == "all") && <th>Type</th>
                        }
                    </tr>
                    {
                        _.map(List, (listObj, index) => this.generateList({ ...listObj, index }))
                    }
                </tbody>
            </table>
        )
    }
}