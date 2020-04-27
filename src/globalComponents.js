import React from "react";
import { SketchPicker } from "react-color";
import Select from "react-select";
import parse from "html-react-parser";

export class DropDown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            records: [],
            selected: this.props.multiple ? [] : "",
            disabled: this.props.disabled ? true : false,
            noResultsText: "No Results Found"
        };
        ["onInputChange", "onFocus"].forEach(fn => {
            this[fn] = this[fn].bind(this);
        })
    }
    componentWillReceiveProps(props) {
        var records = props.options.map((d, index) => {
            return { value: d.id, label: d.name, image: typeof d.image != "undefined" ? d.image : "" };
        });
        var objToBeUpdated = {
            records: records,
            noResultsText: records.length > 0 ? "" : "No Results Found",
            disabled: props.disabled
        };
        this.setState(objToBeUpdated);
        if (typeof props.selected != "undefined") {
            if (props.multiple) {
                var selected = props.selected.map((d, index) => {
                    return d.value;
                });
                this.setState({ selected: selected });
            } else {
                this.setState({ selected: props.selected });
            }
        }
    }
    componentWillMount() {
        var records = this.props.options.map((d, index) => {
            return { value: d.id, label: d.name, image: typeof d.image != "undefined" ? d.image : "" };
        });

        this.setState({ records: records });

        if (typeof this.props.selected != "undefined") {
            if (this.props.multiple) {
                var selected = this.props.selected.map((d, index) => {
                    return d.value;
                });
                this.setState({ selected: selected });
            } else {
                this.setState({ selected: this.props.selected });
            }
        }
    }
    onInputChange(option) {
        if (typeof this.props.onInputChange != "undefined" && option != "") {
            this.props.onInputChange(option);
            this.setState({ noResultsText: "Loading ..." });
        }
    }
    onFocus() {
        if (typeof this.props.onFocus != "undefined") {
            this.props.onFocus();
            this.setState({ noResultsText: "Loading ..." });
        }
    }
    render() {
        var self = this;
        var handleChange = function (option) {
            self.props.onChange(option);
            self.setState({ selected: self.props.multiple ? option : option ? option.value : "" });
        };
        return (
            <div class="select-wrapper">
                <p class="note m0">{typeof this.props.label != "undefined" ? this.props.label : "Type to search item."}</p>
                <Select
                    multi={this.props.multiple}
                    disabled={this.state.disabled}
                    options={self.state.records}
                    optionRenderer={this.props.customLabel}
                    valueComponent={this.props.customSelected}
                    style={this.props.style}
                    value={this.state.selected}
                    onChange={handleChange}
                    clearable={typeof this.props.isClearable != "undefined" ? this.props.isClearable : false}
                    required={this.props.required}
                    onInputChange={this.onInputChange}
                    onFocus={this.onFocus}
                    noResultsText={self.state.noResultsText}
                    onSelectResetsInput={false}
                    onBlurResetsInput={true}
                    autoBlur
                    placeholder={typeof this.props.placeholder ? this.props.placeholder : "Search"}
                />
            </div>
        );
    }
};

export class OnOffSwitch extends React.Component {
    render() {
        let { Active, Action } = this.props;
        return (
            <label class="switch ">
                <input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox success" onClick={Action} defaultChecked={Active == 1} />
                <span class="slider" />
            </label>
        );
    }
}

export const Loading = () => {
    return (
        <p style={{ fontSize: 16, textAlign: "center", margin: 0 }}>
            <i class="fa fa-circle-o-notch fa-spin fa-fw" /> Loading...
        </p>
    );
};

export const DeleteModal = props => {
    const { type, type_value, delete_function, note = "", confirm_actions = [], cancel_function } = { ...props };

    return (
        <div class="modal fade delete-modal" id={props.id} data-backdrop="static" data-keyboard="false">
            <div class="modal-dialog modal-md" role="document">
                <div class="modal-content">
                    <div class="modal-body">
                        <i class="fa fa-exclamation-circle" aria-hidden="true" />
                        <p class="warning text-center">Delete this {type}?</p>
                        <p class="warning text-center">
                            <strong>{type_value}</strong>
                        </p>
                        {note != "" && <p class="text-center">{note}</p>}
                        <div class="flex-row mt20" id="delete-action">
                            <div class="flex-col">
                                <button type="button" class="btn btn-danger" onClick={delete_function}>{`Yes delete ${type}!`}</button>
                            </div>
                            <div class="flex-col">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal" onClick={cancel_function}>
                                    No don't!
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const MentionConvert = ({ string }) => {
    const split = string.split(/{([^}]+)}/g).filter(Boolean);

    return (
        <p class="mb0" style={{ wordBreak: 'break-all' }}>
            {split.map((o, index) => {
                const regEx = /\[([^\]]+)]/;
                if (regEx.test(o)) {
                    let mentionString = o.replace(/[\[\]']+/g, "");
                    return (
                        <strong key={index}>
                            <span style={{ color: "#789ce4" }}>{mentionString.replace(/[(^0-9)]/g, "")}</span>
                        </strong>
                    );
                } else if (o.match(/^http\:\//) || o.match(/^https\:\//)) {
                    return (
                        <a key={index} href={o}>
                            {o.replace(/\r?\n/g, "<br />")}
                        </a>
                    );
                } else {
                    return parse(o.replace(/\r?\n/g, "<br />"));
                }
            })}
        </p>
    );
};

export const ProgressBar = ({ data }) => {
    return (
        <div class="progress">
            {_.map(data, ({ label, value, color }, index) => {
                return <div class="progress-bar" key={index} role="progressbar" style={{ width: `${value}%`, backgroundColor: color }} />;
            })}
        </div>
    );
};

export class ColorPicker extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            show_color_picker: false
        };
    }

    render() {
        const { show_color_picker } = { ...this.state };
        const { color, onSelect, placeholder = "Select Color", required } = { ...this.props };

        return (
            <div style={{ position: "relative" }}>
                <input
                    type="text"
                    name="project_color"
                    placeholder={placeholder}
                    required={required}
                    value={typeof color == "undefined" || color == null ? "" : color}
                    class="form-control"
                    onFocus={() => this.setState({ show_color_picker: true })}
                    onChange={() => { }}
                />
                <div
                    class="color-tab"
                    style={{
                        backgroundColor: color
                    }}
                />
                {show_color_picker && (
                    <div style={{ position: "relative", width: 200 }}>
                        <SketchPicker color={typeof color == "undefined" || color == null ? "#2980b9" : color} onChange={onSelect} />
                        <a class="color-picker-close" onClick={() => this.setState({ show_color_picker: false })}>
                            <i class="fa fa-times-circle" aria-hidden="true" />
                        </a>
                    </div>
                )}
            </div>
        );
    }
}

export class Searchbar extends React.Component {
    constructor(props) {
        super(props);
        ["handleShowSearch", "handleChange"].forEach(fn => {
            this[fn] = this[fn].bind(this);
        });
    }

    handleShowSearch() {
        const { handleCancel } = { ...this.props };
        const { searchInput = "", searchIcon = "" } = { ...this.refs };
        const searchClassList = searchInput != "" ? searchInput.classList : "";
        const searchIconClassList = searchIcon != "" ? searchIcon.classList : "";

        if (searchClassList.contains("hide")) {
            searchClassList.remove("hide");
            searchIconClassList.remove("fa-search");
            searchIconClassList.add("fa-times-circle-o");
            searchIconClassList.add("ml5");
        } else {
            searchClassList.add("hide");
            searchIconClassList.remove("fa-times-circle-o");
            searchIconClassList.remove("ml5");
            searchIconClassList.add("fa-search");
            searchInput.value = "";

            handleCancel();
        }
    }

    handleChange(e) {
        const { handleChange } = { ...this.props };
        const filterState = { [e.target.name]: e.target.value };

        if (typeof e.key != "undefined" && e.key === "Enter" && e.target.value != "") {
            handleChange(filterState);
        }
    }

    render() {
        const { handleChange, name } = { ...this.props };

        return (
            <div style={{ display: "flex", marginRight: 10 }}>
                <div>
                    <input type="text" name={name} class="form-control hide" ref="searchInput" placeholder="Type and press enter to search" onKeyPress={this.handleChange} />
                </div>
                <a class="logo-action text-grey" onClick={this.handleShowSearch}>
                    <i ref="searchIcon" class="fa fa-search" aria-hidden="true" />
                </a>
            </div>
        );
    }
}
