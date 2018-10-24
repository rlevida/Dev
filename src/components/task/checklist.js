import React from "react";
import { connect } from "react-redux";

import { HeaderButtonContainer } from "../../globalComponents";
import { showToast, postData } from '../../globalFunction';

@connect((store) => {
    return {
        checklist: store.checklist,
        task: store.task,
        socket: store.socket.container,
        loggedUser: store.loggedUser,
    }
})

export default class Checklist extends React.Component {
    constructor(props) {
        super(props);

        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    handleSubmit() {
        const { checklist, task, loggedUser, dispatch } = this.props;
        const toBeSubmitted = {
            description: checklist.Selected.checklist,
            types: (typeof checklist.Selected.types != "undefined") ? checklist.Selected.types : "",
            taskId: task.Selected.id,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            createdBy: loggedUser.data.id,
            isDocument: (typeof checklist.Selected.isDocument != "undefined" && checklist.Selected.isDocument != "") ? checklist.Selected.isDocument : 0
        };

        postData(`/api/checklist/`, toBeSubmitted, (c) => {
            if (c.status == 200) {
                dispatch({ type: "ADD_CHECKLIST", data: c.data });
                dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                showToast("success", "Checklist successfully updated.");
            } else {
                showToast("error", "Something went wrong please try again later.");
            }
        });
    }

    handleChange(e) {
        const { checklist, dispatch } = { ...this.props };
        let Selected = Object.assign({}, checklist.Selected);
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected });
    }

    handleCheckbox(name, value) {
        const { checklist, dispatch } = { ...this.props };
        let Selected = Object.assign({}, checklist.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: Selected });
    }

    setDropDownMultiple(name, values) {
        const { checklist, dispatch } = { ...this.props };
        dispatch({ type: "SET_CHECKLIST_SELECTED", Selected: { ...checklist.Selected, [name]: values } });
    }

    render() {
        const { checklist } = { ...this.props };

        return (
            <div>
                <HeaderButtonContainer withMargin={true}>
                    <li class="btn btn-info" onClick={this.handleSubmit} data-toggle="modal" data-target="#checklistModal">
                        <span>Save</span>
                    </li>
                </HeaderButtonContainer>
                <div class="row">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <form onSubmit={this.handleSubmit} class="form-horizontal member-form-container">
                            <div class="form-group">
                                <div class="col-md-12 col-xs-12">
                                    <label class="checkbox-inline pd0" style={{ fontWeight: "bold" }}>Item *</label>
                                    <input type="text" name="checklist"
                                        class="form-control"
                                        placeholder="Add Item"
                                        onChange={this.handleChange}
                                        value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}

                                    />
                                    <label class="checkbox-inline pd0" style={{ fontWeight: "bold" }}>
                                        Document ?
                                                    <input type="checkbox"
                                            checked={checklist.Selected.isDocument ? true : false}
                                            onChange={() => { }}
                                            onClick={(f) => { this.handleCheckbox("isDocument", (checklist.Selected.isDocument) ? 0 : 1) }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}