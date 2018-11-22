import React from "react"
import { showToast, putData, postData, getData } from '../../../globalFunction'
import { DropDown, HeaderButtonContainer, Loading } from "../../../globalComponents";
import { connect } from "react-redux";
import _ from "lodash";

let keyTimer = "";

@connect((store) => {
    return {
        socket: store.socket.container,
        workstream: store.workstream,
        loggedUser: store.loggedUser,
        users: store.users,
        status: store.status,
        members: store.members,
        teams: store.teams,
        type: store.type,
        global: store.global,
        document: store.document
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.setDropDown = this.setDropDown.bind(this);
        this.deleteData = this.deleteData.bind(this);
        this.handleCheckbox = this.handleCheckbox.bind(this);
        this.resetData = this.resetData.bind(this);
        this.getMemberList = this.getMemberList.bind(this);
    }

    componentDidMount() {
        const { dispatch, workstream } = this.props;
        $(".form-container").validator();

        if ((workstream.SelectedId).length > 0) {
            getData(`/api/workstream/detail/${workstream.SelectedId[0]}`, {}, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: _.map([...c.data.responsible], (responsibleObj) => { return { ...responsibleObj.user, name: responsibleObj.user.firstName + " " + responsibleObj.user.lastName } }) });
                    dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: { ...c.data, responsible: ((c.data.responsible).length > 0) ? c.data.responsible[0].user.id : "" } });
                } else {
                    showToast("error", "Error retrieving workstream. Please try again later.");
                }
            });
        }

        getData(`/api/globalORM/selectList?selectName=type`, {}, (c) => {
            dispatch({ type: "SET_APPLICATION_SELECT_LIST", List: c.data, name: 'typeList' });
        });

        getData(`/api/member?linkType=project&linkId=${project}&page=1`, {}, (c) => {
            const taskMemberOptions = _(c.data.result)
                .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                .value();
            dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
        });
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

    handleSubmit() {
        const { workstream, dispatch } = this.props;
        const dataToBeSubmitted = {
            ..._.pick(workstream.Selected, ["workstream", "description", "typeId"]),
            numberOfHours: (workstream.Selected.typeId == 5) ? workstream.Selected.numberOfHours : 0,
            isActive: (typeof workstream.Selected.isActive == 'undefined') ? 1 : workstream.Selected.isActive,
            isTemplate: (typeof workstream.Selected.isTemplate == 'undefined') ? 0 : workstream.Selected.isTemplate,
            responsible: workstream.Selected.responsible
        }

        let result = true;

        $('.form-container *').validator('validate');
        $('.form-container .form-group').each(function () {
            if ($(this).hasClass('has-error')) {
                result = false;
            }
        });

        if (!result) {
            showToast("error", "Form did not fullfill the required value.")
            return;
        }


        if (typeof workstream.Selected.id != "undefined" && workstream.Selected.id != "") {
            putData(`/api/workstream/${workstream.Selected.id}`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
                    this.resetData();
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        } else {
            postData(`/api/workstream`, dataToBeSubmitted, (c) => {
                if (c.status == 200) {
                    dispatch({ type: "UPDATE_DATA_WORKSTREAM_LIST", data: c.data });
                    showToast("success", "Workstream successfully updated.");
                    this.resetData();
                } else {
                    showToast("error", "Something went wrong please try again later.");
                }
            });
        }

    }

    deleteData(params) {
        let { socket } = this.props;
        if (confirm("Do you really want to delete this record?")) {
            socket.emit("DELETE_MEMBERS", params)
        }
    }

    setDropDown(name, value) {
        const { dispatch, workstream } = this.props
        let Selected = Object.assign({}, workstream.Selected)
        Selected[name] = value;
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: Selected })
    }

    setDropDownMultiple(name, values) {
        this.setState({
            [name]: JSON.stringify(values ? values : [])
        });
    }

    resetData() {
        const { dispatch } = { ...this.props };
        dispatch({ type: "SET_WORKSTREAM_FORM_ACTIVE", FormActive: "List" });
        dispatch({ type: "SET_WORKSTREAM_SELECTED", Selected: {} });
        dispatch({ type: "EMPTY_WORKSTREAM_LIST" });
        dispatch({ type: "SET_WORKSTREAM_ID", SelectedId: [] });
    }

    getMemberList(options) {
        const { dispatch } = this.props;

        if (options != "") {
            keyTimer && clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                getData(`/api/member?linkType=project&linkId=${project}&page=1&memberName=${options}`, {}, (c) => {
                    const taskMemberOptions = _(c.data.result)
                        .map((e) => { return { id: e.userTypeLinkId, name: e.user.firstName + " " + e.user.lastName } })
                        .value();
                    dispatch({ type: "SET_MEMBER_SELECT_LIST", List: taskMemberOptions });
                });
            }, 1500)
        }
    }

    render() {
        const { workstream, global, members } = this.props;
        const typeList = (typeof global.SelectList.typeList != "undefined") ? _(global.SelectList.typeList)
            .filter((e, i) => {
                return e.linkType == "workstream";
            })
            .map((o, i) => { return { id: o.id, name: o.type } })
            .value()
            : [];
        return <div>
            <HeaderButtonContainer withMargin={true}>
                {
                    (typeof workstream.SelectedLink == "undefined" || workstream.SelectedLink == "") && <li class="btn btn-info" style={{ marginRight: "2px" }}
                        onClick={(e) => this.resetData()} >
                        <span>Back</span>
                    </li>
                }
                {
                    (typeof workstream.SelectedLink == "undefined" || workstream.SelectedLink == "") &&
                    <li class="btn btn-info" onClick={() => this.handleSubmit()} >
                        <span>Save</span>
                    </li>
                }
            </HeaderButtonContainer>
            <div class="row mt10">
                <div class="col-lg-12 col-md-12 col-xs-12">
                    <div class="panel panel-default">
                        <div class="panel-body">
                            {(workstream.SelectedLink == "") && <div>
                                {
                                    (workstream.Loading == "RETRIEVING") && <Loading />
                                }
                                {
                                    (workstream.Loading != "RETRIEVING") && <form class="form-horizontal form-container">
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Active</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="checkbox"
                                                    style={{ width: "15px", marginTop: "10px" }}
                                                    checked={(workstream.Selected.isActive == 1 || typeof workstream.Selected.isActive == 'undefined') ? true : false}
                                                    onChange={() => { }}
                                                    onClick={(f) => { this.handleCheckbox("isActive", (workstream.Selected.isActive || typeof workstream.Selected.isActive == 'undefined') ? 0 : 1) }}
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Template Workstream</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="checkbox"
                                                    style={{ width: "15px", marginTop: "10px" }}
                                                    checked={(workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? false : true}
                                                    onChange={() => { }}
                                                    onClick={(f) => { this.handleCheckbox("isTemplate", (workstream.Selected.isTemplate == 0 || typeof workstream.Selected.isTemplate == 'undefined') ? 1 : 0) }}
                                                />
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Workstream *</label>
                                            <div class="col-md-7 col-xs-12">
                                                <input type="text" name="workstream" required value={(typeof workstream.Selected.workstream == "undefined") ? "" : workstream.Selected.workstream} class="form-control" placeholder="Workstream" onChange={this.handleChange} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Type</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown multiple={false}
                                                    required={false}
                                                    options={typeList}
                                                    selected={(typeof workstream.Selected.typeId == "undefined") ? "" : workstream.Selected.typeId}
                                                    onChange={(e) => {
                                                        this.setDropDown("typeId", e.value);
                                                    }} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        {
                                            (typeof workstream.Selected.typeId != "undefined" && workstream.Selected.typeId == 5) && <div class="form-group">
                                                <label class="col-md-3 col-xs-12 control-label">Number of Hours</label>
                                                <div class="col-md-7 col-xs-12">
                                                    <input type="number" name="numberOfHours" required value={(typeof workstream.Selected.numberOfHours == "undefined") ? "" : workstream.Selected.numberOfHours} class="form-control" placeholder="Number of Hours" onChange={this.handleChange} />
                                                    <div class="help-block with-errors"></div>
                                                </div>
                                            </div>
                                        }
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label">Description</label>
                                            <div class="col-md-7 col-xs-12">
                                                <textarea name="description" value={(typeof workstream.Selected.description == "undefined" || workstream.Selected.description == null) ? "" : workstream.Selected.description} class="form-control" placeholder="Description" onChange={this.handleChange} />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                        <div class="form-group">
                                            <label class="col-md-3 col-xs-12 control-label pt0">Responsible *</label>
                                            <div class="col-md-7 col-xs-12">
                                                <DropDown
                                                    required={true}
                                                    options={members.SelectList}
                                                    onInputChange={this.getMemberList}
                                                    selected={(typeof workstream.Selected.responsible == "undefined") ? "" : workstream.Selected.responsible}
                                                    placeholder={"Type to Search Member"}
                                                    onChange={(e) => {
                                                        this.setDropDown("responsible", (e == null) ? "" : e.value);
                                                    }}
                                                    isClearable={true}
                                                />
                                                <div class="help-block with-errors"></div>
                                            </div>
                                        </div>
                                    </form>
                                }
                            </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    }
}