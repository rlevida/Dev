import React from "react";
import ReactDOM from "react-dom";
import Select from 'react-select';
import Tooltip from 'react-tooltip';
import { saveData, showToast } from './globalFunction';

export const DropDown = React.createClass({
    getInitialState: function () {
        return {
            records: [],
            selected: (this.props.multiple) ? [] : "",
            disabled: (this.props.disabled) ? true : false
        };
    },
    componentWillReceiveProps: function (props) {
        var records = props.options.map((d, index) => { return { value: d.id, label: d.name }; });
        if (!props.multiple && records.length == 0) {
            records.unshift({ value: "", label: "(None)" })
        }
        this.setState({ records: records });

        if (typeof props.selected != "undefined") {
            if (props.multiple) {
                var selected = props.selected.map((d, index) => { return d.value });
                this.setState({ selected: selected });
            } else {
                this.setState({ selected: props.selected });
            }
        }
    },
    componentWillMount: function () {
        var records = this.props.options.map((d, index) => { return { value: d.id, label: d.name }; });
        this.setState({ records: records });

        if (typeof this.props.selected != "undefined") {
            if (this.props.multiple) {
                var selected = this.props.selected.map((d, index) => { return d.value });
                this.setState({ selected: selected });
            } else {
                this.setState({ selected: this.props.selected });
            }
        }
    },
    render: function () {

        var self = this;

        var handleChange = function (option) {
            self.props.onChange(option);
            self.setState({ selected: (self.props.multiple) ? option : option ? option.value : "" });
        };
        return (
            <Select multi={this.props.multiple}
                disabled={this.state.disabled}
                options={self.state.records}
                style={this.props.style}
                value={this.state.selected} onChange={handleChange}
                clearable={false}
                required={this.props.required}
            />
        );
    }
})

export class OnOffSwitch extends React.Component {
    render() {
        let { Active, Action, custom_class } = this.props
        return <div class="onoffswitch">
            <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" onChange={() => { }} checked={Active == 1} />
            <label class="onoffswitch-label" for="myonoffswitch">
                <span class={custom_class + " onoffswitch-inner"} onClick={Action} ></span>
                <span class="onoffswitch-switch"></span>
            </label>
        </div>
    }
}


export const HeaderButtonContainer = React.createClass({
    getInitialState: function () {
        return {};
    },
    render: function () {
        return (
            <div>
                <div class="FooterButtonContainer" style={{ marginTop: "100px" }}>
                    <ul class="bottom-icon-action-container">{this.props.children}</ul>
                </div>
            </div>
        );
    }
})

export const HeaderButton = React.createClass({
    getInitialState: function () {
        return {};
    },
    render: function () {
        return (
            <li class="side-icon-action"
                data-tip={this.props.title} onClick={this.props.action} >
                <span class={this.props.iconClass} />
                <Tooltip />
            </li>
        );
    }
})

export const FilterContainer = React.createClass({
    getInitialState: function () {
        return {
            hideContent: true
        };
    },
    componentDidUpdate: function () {
        if (typeof this.props.onLoadFunction !== 'undefined') {
            this.props.onLoadFunction();
        }
    },
    render: function () {
        return (
            <div class="FilterContainer ml10 mt10">
                {this.state.hideContent &&
                    <a onClick={e => this.setState({ hideContent: false })} class="btn btn-info btn-sm ml10"><span class="glyphicon glyphicon-search"></span> Advance Search </a>
                }
                {!this.state.hideContent &&
                    <div>
                        <a onClick={e => this.setState({ hideContent: true })} class="btn btn-info btn-sm ml10"><span class="glyphicon glyphicon-menu-left"></span> Hide Filter </a>
                        {this.props.children}
                    </div>
                }
            </div>
        );
    }
})

/**
 * Generic editable cell value.
 * State values : 
 *      1. currentValue - the value displayed upon load. 
 *      2. previousValue
 *      3. inputType - the type of input to be displayed. Values: "text" or "select". Ideally, select options would be loaded from db.
 *      4. isEditMode
 *      5. table - the table to be updated
 *      6. field - the field in the table to be updated
 *      7. tableId - the id of the row to be updated
 *                  
 */
export const EditableCellDisplay = React.createClass({
    getInitialState: function () {
        return {
            currentValue: this.props.initialValue,
            previousValue: this.props.initialValue,
            inputType: this.props.inputType,
            isEditMode: false,
            table: this.props.action,
            field: this.props.fieldName,
            tableId: this.props.id,
            options: (this.props.options) ? this.props.options : [],
            disabled: (this.props.disabled) ? true : false
        };
    },

    handleEditClick: function (e) {
        e.preventDefault();
        this.setState({
            isEditMode: true
        });
    },

    handleInputChange: function (e) {
        if (e.target) {
            this.setState({
                currentValue: e.target.value
            });
        } else {
            this.setState({
                currentValue: e.value
            });
        }
    },

    handleCancelClick: function (e) {
        e.preventDefault();
        this.setState({
            isEditMode: false,
            currentValue: this.state.previousValue
        });
    },

    handleSaveClick: function (e) {
        e.preventDefault();
        const params = {
            id: this.state.tableId,
            action: this.state.table
        }
        params[this.state.field] = this.state.currentValue;
        saveData.callback(
            { data: params },
            (res) => {
                if (res.status) {
                    var _response = res.response;
                    this.setState({
                        isEditMode: false,
                        previousValue: this.state.currentValue
                    });
                    showToast("success", _response.responseText);
                } else {
                    showToast("error", _response.responseText);
                }
            }
        );
    },
    render: function () {
        if (this.state.isEditMode) {
            if (this.state.inputType == "text") {
                return (
                    <div>
                        <input type="text" class="editable-cell-text" autoFocus="true"
                            value={this.state.currentValue}
                            onChange={this.handleInputChange} />
                        <a href="#"><span class="glyphicon glyphicon-ban-circle pull-right" data-tip="CANCEL" data-for={"CANCEL-" + this.state.tableId} onClick={this.handleCancelClick}><Tooltip id={"CANCEL-" + this.state.tableId} /></span></a>
                        <a href="#"><span class="glyphicon glyphicon-floppy-disk pull-right" data-tip="SAVE" data-for={"SAVE-" + this.state.tableId} onClick={this.handleSaveClick}><Tooltip id={"SAVE-" + this.state.tableId} /></span></a>
                    </div>
                );
            } else {
                return (
                    <div>
                        <DropDown
                            multiple={false}
                            options={this.state.options}
                            selected={this.state.currentValue}
                            onChange={this.handleInputChange}
                        />
                        <a href="#"><span style={{ padding: "2px" }} class="glyphicon glyphicon-ban-circle pull-right" data-tip="CANCEL" data-for={"CANCEL-" + this.state.tableId} onClick={this.handleCancelClick}><Tooltip id={"CANCEL-" + this.state.tableId} /></span></a>
                        <a href="#"><span style={{ padding: "2px" }} class="glyphicon glyphicon-floppy-disk pull-right" data-tip="SAVE" data-for={"SAVE-" + this.state.tableId} onClick={this.handleSaveClick}><Tooltip id={"SAVE-" + this.state.tableId} /></span></a>
                    </div>
                );
            }
        } else {
            return (
                <p>{this.state.currentValue}
                    {!this.state.disabled &&
                        <a href="#" onClick={this.handleEditClick}><span style={{ padding: "2px" }} data-tip="EDIT" data-for={"EDIT-" + this.state.tableId} class="glyphicon glyphicon-pencil pull-right" ><Tooltip id={"EDIT-" + this.state.tableId} /></span></a>
                    }
                </p>
            );
        }
    }
});