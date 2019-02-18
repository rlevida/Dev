import React from "react";
import { showToast, putData, postData, getData } from '../../globalFunction';
import { DropDown } from "../../globalComponents";
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
            'getMemberList',
            'handleSubmit',
            'handleCheckbox'
        ], (fn) => {
            this[fn] = this[fn].bind(this);
        });
    }

    componentDidMount() {
        const { dispatch } = { ...this.props };

        getData(`/api/globalORM/selectList?selectName=type`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'typeList' });
        });

        this.getMemberList();
    }

    getMemberList(options) {
        const { dispatch } = this.props;

        if (typeof options != "undefined" && options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member?linkType=project&linkId=${project}&page=1&memberName=${options}&userType=Internal`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
                });
            }, 500)
        } else {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member/selectList?linkType=project&linkId=${project}&page=1&userType=Internal`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.id, name: e.firstName + " " + e.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
                });
            }, 500)
        }
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


    handleSubmit() {
        const { workstream, dispatch, loggedUser, project_id } = this.props;
        const dataToBeSubmitted = {
            ..._.pick(workstream.Selected, ["workstream", "description", "typeId"]),
            projectId: (typeof project != "undefined" && project != "") ? project : project_id,
            numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0,
            isActive: (typeof workstream.Selected.isActive == 'undefined') ? 1 : workstream.Selected.isActive,
            isTemplate: (typeof workstream.Selected.isTemplate == 'undefined') ? 0 : workstream.Selected.isTemplate,
            responsible: workstream.Selected.responsible,
            ...(typeof workstream.Selected.workstreamTemplate != "undefined") ? { workstreamTemplate: workstream.Selected.workstreamTemplate } : {},
            userId: loggedUser.data.id
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

    render() {
        const { workstream, global, members } = { ...this.props };
        const typeList = (typeof global.SelectList.typeList != "undefined") ? _(global.SelectList.typeList)
            .filter((e, i) => {
                return e.linkType == "workstream";
            })
            .map((o, i) => { return { id: o.id, name: o.type } })
            .value()
            : [];
        return (
            <form id="#workstream-form">
                <div class="mb20">
                    <p class="form-header mb0">Workstreams</p>
                    <p>All with <span class="text-red">*</span> are required.</p>
                </div>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox"
                                checked={(workstream.Selected.isActive == 1 || typeof workstream.Selected.isActive == 'undefined') ? true : false}
                                onChange={() => { }}
                                onClick={(f) => { this.handleCheckbox("isActive", (workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? 0 : 1) }}
                            />
                            Active
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="checkbox">
                        <label>
                            <input type="checkbox"
                                checked={(workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? false : true}
                                onClick={(f) => { this.handleCheckbox("isTemplate", (workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? 1 : 0) }}
                            />
                            Set as Workstream Template
                        </label>
                    </div>
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
                        placeholder="Enter Workstream"
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
                        <div class="help-block with-errors"></div>
                    </div>
                }
                <div class="form-group">
                    <label for="description">Workstream Description: <span class="text-red">*</span></label>
                    <textarea name="description" required value={(typeof workstream.Selected.description == "undefined" || workstream.Selected.description == null || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />
                    <div class="help-block with-errors"></div>
                </div>
                <div class="form-group">
                    <label>Responsible: <span class="text-red">*</span></label>
                    <DropDown
                        required={true}
                        options={members.SelectList}
                        onInputChange={this.getMemberList}
                        selected={(typeof workstream.Selected.responsible == "undefined" || typeof workstream.Selected.action != "undefined") ? "" : workstream.Selected.responsible}
                        placeholder={"Type to Search Member"}
                        onChange={(e) => {
                            this.setDropDown("responsible", (e == null) ? "" : e.value);
                        }}
                        isClearable={true}
                        placeholder={'Select member responsible'}
                    />
                    <div class="help-block with-errors"></div>
                </div>
                <a class="btn btn-violet" onClick={this.handleSubmit}>
                    <span>Add workstream</span>
                </a>
            </form>
        )
    }
}