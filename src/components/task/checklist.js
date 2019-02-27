import React from "react";
import { connect } from "react-redux";

import { HeaderButtonContainer } from "../../globalComponents";
import { showToast, postData } from '../../globalFunction';

@connect((store) => {
    return {
        checklist: store.checklist,
        task: store.task,
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
        let result = true;

        $('#checklist-form *').validator('validate');
        $('#checklist-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Please fill up the required fields.");
        } else {
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

            $("#task-form").validator('destroy');

            postData(`/api/checklist/`, toBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "ADD_CHECKLIST", data: c.data.checklist });
                    dispatch({ type: "SET_CHECKLIST_ACTION", action: undefined });
                    showToast("success", "Checklist successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }
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
            <form class="full-form" id="checklist-form">
                <div class="mt10 row">
                    <div class="col-lg-8 col-sm-12">
                        <div class="form-group input-inline">
                            <label>Item:<span class="text-red">*</span></label>
                            <input
                                required
                                type="text"
                                name="checklist"
                                class="form-control"
                                placeholder="Add Item"
                                onChange={this.handleChange}
                                value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}
                            />
                        </div>
                        <div class="form-group input-inline">
                            <label class="custom-checkbox">
                                <input
                                    type="checkbox"
                                    checked={checklist.Selected.isDocument ? true : false}
                                    onChange={() => { }}
                                    onClick={(f) => { this.handleCheckbox("isDocument", (checklist.Selected.isDocument) ? 0 : 1) }}
                                />
                                <span class="checkmark"></span>
                                Document
                            </label>
                        </div>
                    </div>
                </div>
                <a class="btn btn-violet" onClick={this.handleSubmit}>
                    <span>Create Subtask</span>
                </a>
            </form>
        )
    }
}