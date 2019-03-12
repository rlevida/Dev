import React from "react";
import { showToast, putData, postData, getData } from '../../globalFunction';
import { DropDown, ColorPicker } from "../../globalComponents";
import { connect } from "react-redux";
import _ from "lodash";

let keyTimer = "";

@connect((store) => {
    return {
        project: store.project,
        loggedUser: store.loggedUser,
        status: store.status,
        type: store.type,
        users: store.users,
        teams: store.teams,
        members: store.members,
        workstream: store.workstream,
        global: store.global
    }
})

export default class WorkstreamForm extends React.Component {
    constructor(props) {
        super(props);

        _.map([
            'handleChange',
            'setDropDown',
            'setDropDownMultiple',
            'fetchMemberList',
            'setMemberList',
            'handleSubmit',
            'handleCheckbox',
            'handleColorSlider',
            'getWorkstreamTemplateList',
            'renderForm'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };

        getData(`/api/globalORM/selectList?selectName=type`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'typeList' });
        });

        this.fetchMemberList();
    }

    componentWillUnmount() {
        const { dispatch } = this.props;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
    }

    fetchMemberList(options) {
        const { dispatch, project } = this.props;
        let fetchUrl = `/api/member?linkType=project&linkId=${project.Selected.id}&page=1&userType=Internal`;

        if (typeof options != "undefined" && options != "") {
            fetchUrl += `&memberName=${options}`;
        }

        getData(fetchUrl, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
        });
    }

    setMemberList(options) {
        keyTimer && clearTimeout(keyTimer);
        keyTimer = setTimeout(() => {
            this.fetchMemberList(options);
        }, 1500);
    }

    handleChange(e) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[e.target.name] = e.target.value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    handleCheckbox(name, value) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    setDropDown(name, value) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;

        if (name == "workstreamTemplate") {
            const selectedWorkstreamTemplate = _.find(workstream.SelectList, (o) => { return o.id == value; });
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ..._.omit(selectedWorkstreamTemplate, ["id"]), [name]: value } });
        } else {
            dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
        }
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    getWorkstreamTemplateList(options) {
        const { dispatch } = this.props;
        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/workstream?page=1&isActive=1&isTemplate=1&workstream=${options}`, {}, (c) => {
                    const workstreamOptions = (c.status == 200) ? _.map(c.data.result, (workstreamObj) => { return { ..._.pick(workstreamObj, ["id", "workstream", "type", "description"]), name: workstreamObj.workstream, typeId: workstreamObj.type.id } }) : [];
                    dispatch({ type: "SET_WORKSTREAM_SELECT_LIST", List: workstreamOptions });
                });
            }, 1500)
        }
    }


    handleSubmit() {
        const { workstream, dispatch, loggedUser, project } = this.props;
        const dataToBeSubmitted = {
            ..._.pick(workstream.Selected, ["workstream", "description", "typeId"]),
            projectId: project.Selected.id,
            numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0,
            isActive: (typeof workstream.Selected.isActive == 'undefined') ? 1 : workstream.Selected.isActive,
            isTemplate: (typeof workstream.Selected.isTemplate == 'undefined') ? 0 : workstream.Selected.isTemplate,
            responsible: workstream.Selected.responsible,
            ...(typeof workstream.Selected.workstreamTemplate != "undefined") ? { workstreamTemplate: workstream.Selected.workstreamTemplate } : {},
            userId: loggedUser.data.id,
            color: workstream.Selected.color
        };
        let result = true;

        $('#workstream-form *').validator('validate');
        $('#workstream-form .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.");
        } else if (typeof workstream.Selected.id != "undefined" && workstream.Selected.id != "") {
            putData(`/api/workstream/${workstream.Selected.id}`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: { ...c.data, responsible: c.data.responsible[0].user.id }, });
                    showToast("success", "Workstream successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
                $('#workstream-form *').validator('destroy');
            });
        } else {
            postData(`/api/workstream`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
                $('#workstream-form *').validator('destroy');
            });
        }
    }

    handleColorSlider(e) {
        const { dispatch, workstream } = { ...this.props };
        const { Selected } = workstream
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ...Selected, color: e.hex } })
    }

    renderForm() {
        const { workstream, global, members } = { ...this.props };
        const typeList = (typeof global.SelectList.typeList != "undefined") ? _(global.SelectList.typeList)
            .filter((e, i) => {
                return e.linkType == "workstream";
            })
            .map((o, i) => { return { id: o.id, name: o.type } })
            .value()
            : [];
        return (
            <form id="workstream-form">
                <div class="mb20">
                    <p class="form-header mb0">Workstreams</p>
                    <p>All with <span class="text-red">*</span> are required.</p>
                </div>
                <div class="form-group">
                    <label class="custom-checkbox">
                        <input type="checkbox"
                            checked={(workstream.Selected.isActive == 1 || typeof workstream.Selected.isActive == 'undefined') ? true : false}
                            onChange={() => { }}
                            onClick={(f) => { this.handleCheckbox("isActive", (workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? 0 : 1) }}
                        />
                        <span class="checkmark"></span>
                        Active
            </label>
                </div>
                <div class="form-group">
                    <label class="custom-checkbox">
                        <input type="checkbox"
                            checked={(workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? false : true}
                            onClick={(f) => { this.handleCheckbox("isTemplate", (workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? 1 : 0) }}
                        />
                        <span class="checkmark"></span>
                        Set as Workstream Template
            </label>
                </div>
                {
                    (typeof workstream.Selected.id == 'undefined' || workstream.Selected.id == "") && <div class="form-group">
                        <label>Select existing workstream</label>
                        <DropDown
                            required={false}
                            options={workstream.SelectList}
                            onInputChange={this.getWorkstreamTemplateList}
                            selected={(typeof workstream.Selected.workstreamTemplate == "undefined") ? "" : workstream.Selected.workstreamTemplate}
                            placeholder={"Search workstream template to copy"}
                            onChange={(e) => {
                                this.setDropDown("workstreamTemplate", (e == null) ? "" : e.value);
                            }}
                            isClearable={true}
                        />
                    </div>
                }
                <div class="form-group">
                    <label for="workstream">Workstream: <span class="text-red">*</span></label>
                    <input
                        id="workstream"
                        type="text"
                        name="workstream"
                        required
                        value={(typeof workstream.Selected.workstream == "undefined" || (typeof workstream.Selected.action != "undefined")) ? "" : workstream.Selected.workstream}
                        class="form-control"
                        placeholder="Enter workstream"
                        onChange={this.handleChange}
                    />
                </div>
                <div class="form-group">
                    <label>Workstream Type</label>
                    <DropDown multiple={false}
                        required={false}
                        options={typeList}
                        selected={(typeof workstream.Selected.typeId == "undefined" || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.typeId}
                        onChange={(e) => {
                            this.setDropDown("typeId", e.value);
                        }}
                        placeholder={'Select workstream type'}
                    />
                </div>
                {
                    (typeof workstream.Selected.typeId != "undefined" && workstream.Selected.typeId == 5) && <div class="form-group">
                        <label for="number-hours">Number of Hours: <span class="text-red">*</span></label>
                        <input
                            id="number-hours"
                            type="number"
                            name="numberOfHours"
                            required
                            value={(typeof workstream.Selected.numberOfHours == "undefined" || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.numberOfHours}
                            class="form-control"
                            placeholder="Number of Hours"
                            onChange={this.handleChange}
                        />

                    </div>
                }
                <div class="form-group">
                    <label for="description">Workstream Description: <span class="text-red">*</span></label>
                    <textarea name="description" required value={(typeof workstream.Selected.description == "undefined" || workstream.Selected.description == null || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />

                </div>
                <div class="form-group">
                    <label>Responsible: <span class="text-red">*</span></label>
                    <DropDown
                        required={true}
                        options={members.SelectList}
                        onInputChange={this.setMemberList}
                        selected={(typeof workstream.Selected.responsible == "undefined" || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.responsible}
                        onChange={(e) => {
                            this.setDropDown("responsible", (e == null) ? "" : e.value);
                        }}
                        isClearable={true}
                        placeholder={'Search and select member responsible'}
                    />

                </div>
                <div class="form-group">
                    <label for="project-manager">Color Indicator: <span class="text-red">*</span></label>
                    <ColorPicker
                        onSelect={this.handleColorSlider}
                        color={(typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.color}
                        placeholder={"Select Workstream Color"}
                        required={true}
                    />
                </div>
                <a class="btn btn-violet" onClick={this.handleSubmit}>
                    <span>{`${(typeof workstream.Selected.id != "undefined" && workstream.Selected.id != "" && typeof workstream.Selected.action == "undefined") ? 'Edit' : 'Add'} workstream`}</span>
                </a>
            </form>
        )
    }

    render() {
        const { workstream, dispatch, is_card = true } = { ...this.props };
        return (
            <div>
                {
                    (is_card) ? <div class="card form-card">
                        <div class="card-header">
                            <h4>
                                <a
                                    class="text-white mr10"
                                    onClick={() => {
                                        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
                                    }}
                                >
                                    <i class="fa fa-chevron-left" aria-hidden="true"></i>
                                </a>
                                {`${(typeof workstream.Selected.id != "undefined" && workstream.Selected.id != "") ? 'Edit' : 'Add New'} Workstream`}
                            </h4>
                        </div>
                        <div class="card-body">
                            {
                                this.renderForm()
                            }
                        </div>
                    </div> : this.renderForm()
                }
            </div>

        )
    }
}