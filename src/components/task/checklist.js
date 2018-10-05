import React from "react";
import { connect } from "react-redux";

import { HeaderButtonContainer, DropDown } from "../../globalComponents";

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
        const { checklist, task, socket, loggedUser } = this.props;
        const toBeSubmitted = {
            description: checklist.Selected.checklist,
            types: (typeof checklist.Selected.types != "undefined") ? checklist.Selected.types : "",
            taskId: task.Selected.id,
            periodTask: (task.Selected.periodTask == null) ? task.Selected.id : task.Selected.periodTask,
            isPeriodicTask: task.Selected.periodic,
            taskDueDate: task.Selected.dueDate,
            createdBy: loggedUser.data.id
        };

        socket.emit("SAVE_OR_UPDATE_CHECKLIST", { data: toBeSubmitted });
    }

    handleChange(e) {
        const { checklist, dispatch } = { ...this.props };
        let Selected = Object.assign({}, checklist.Selected);
        Selected[e.target.name] = e.target.value;
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
                    <li class="btn btn-info" onClick={this.handleSubmit} data-toggle="modal" data-target="#projectModal">
                        <span>Save</span>
                    </li>
                </HeaderButtonContainer>
                <div class="row mt10">
                    <div class="col-lg-12 col-md-12 col-xs-12">
                        <form onSubmit={this.handleSubmit} class="form-horizontal member-form-container">
                            <div class="form-group">
                                <label class="col-md-3 col-xs-12 control-label">Item *</label>
                                <div class="col-md-7 col-xs-12">
                                    <input type="text" name="checklist"
                                        class="form-control"
                                        placeholder="Add Item"
                                        onChange={this.handleChange}
                                        value={(typeof checklist.Selected.checklist != "undefined") ? checklist.Selected.checklist : ""}

                                    />
                                </div>
                            </div>
                            <div class="form-group mb20">
                                <label class="col-md-3 col-xs-12 control-label">Checklist type</label>
                                <div class="col-md-7 col-xs-12">
                                    <DropDown multiple={true}
                                        required={false}
                                        options={_.map(['Mandatory', 'Document'], (o) => { return { id: o, name: o } })}
                                        selected={(typeof checklist.Selected.types == "undefined" || checklist.Selected.types == "") ? [] : checklist.Selected.types}
                                        onChange={(e) => this.setDropDownMultiple("types", e)}
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        )
    }
}