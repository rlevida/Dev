import React from "react";
import moment from "moment";
import { connect } from "react-redux";
import _ from "lodash";
import { getData, putData, showToast } from "../../globalFunction";

import { Loading, HeaderButtonContainer } from "../../globalComponents";
import Modal from "./newForm";

@connect(store => {
  return {
    socket: store.socket.container,
    notes: store.notes,
    workstream: store.workstream,
    loggedUser: store.loggedUser,
    global: store.global,
    document: store.document
  };
})
export default class List extends React.Component {
  constructor(props) {
    super(props);
    this.fetchNotes = this.fetchNotes.bind(this);
    this.openDetail = this.openDetail.bind(this);
    this.updateStarred = this.updateStarred.bind(this);
  }

  componentDidMount() {
    this.fetchNotes();
  }

  fetchNotes() {
    const { dispatch } = this.props;
    dispatch({ type: "SET_NOTES_LOADING", Loading: "RETRIEVING" });
    getData(`/api/conversation`, {}, c => {
      dispatch({ type: "SET_NOTES_LIST", list: c.data });

      dispatch({ type: "SET_NOTES_LOADING", Loading: "" });
    });
  }

  openDetail(data) {
    const { dispatch } = this.props;
    dispatch({ type: "SET_NOTES_SELECTED", Selected: data });
    dispatch({ type: "SET_NOTES_FORM_ACTIVE", FormActive: "View" });
  }

  renderStatus(data) {
    const { isActive, dueDate } = { ...data };
    const dueDateMoment = moment(dueDate);
    const currentDateMoment = moment(new Date());
    let taskStatus = 0;
    let statusColor = "#000";

    if (
      dueDateMoment.isBefore(currentDateMoment, "day") &&
      data.status != "Completed"
    ) {
      taskStatus = 2;
    } else if (
      dueDateMoment.isSame(currentDateMoment, "day") &&
      data.status != "Completed"
    ) {
      taskStatus = 1;
    }

    if (isActive == 0) {
    } else if (taskStatus == 0) {
      statusColor = "#27ae60";
    } else if (taskStatus == 1) {
      statusColor = "#f39c12";
    } else if (taskStatus == 2) {
      statusColor = "#c0392b";
    }

    return statusColor;
  }

  renderPrivacy(privacy) {
    let icon = "fa-users"; // public by default
    if (privacy === "email") {
      icon = "fa-envelope";
    } else if (privacy === "linked") {
      icon = "fa-link";
    } else if (privacy === "private") {
      icon = "fa-lock";
    }
    return icon;
  }

  updateStarred(event, data) {
    const { notes, dispatch } = this.props;
    event.stopPropagation();
    let isStarred = data.isStarred ? 0 : 1;
    putData(`/api/conversation/${data.id}`, { isStarred }, c => {
      if (c.status == 200) {
        const dataIndex = notes.List.indexOf(data);
        const newData = data;
        newData.isStarred = c.data.isStarred;
        notes.List.splice(dataIndex, 1, newData);
        dispatch({ type: "SET_NOTES_LIST", list: notes.List });
      } else {
        showToast("error", "Something went wrong please try again later.");
      }
    });
  }

  render() {
    const { notes, loggedUser } = this.props;
    const currentPage =
      typeof notes.Count.current_page != "undefined"
        ? notes.Count.current_page
        : 1;
    const lastPage =
      typeof notes.Count.last_page != "undefined" ? notes.Count.last_page : 1;
    const notesList = notes.List;

    return (
      <div class="pd10">
        <HeaderButtonContainer withMargin={true}>
            <li class="btn btn-info" onClick={() => $("#NewNoteModal").modal("show")}>
              <span>New Notes</span>
            </li>
        </HeaderButtonContainer>
        <Modal />
        <table id="dataTable" class="table responsive-table mt30">
          <tbody>
            {notesList.map(e => {
              return (
                <tr
                  key={`${e.id}-${new Date().getTime()}`}
                  style={{
                    cursor: "pointer",
                    background:
                      notes.Selected.id === e.id ? "#f5f5f5" : "transparent"
                  }}
                  onClick={() => this.openDetail(e)}
                >
                  <td onClick={f => this.updateStarred(f, e)}>
                    <span
                      class={`fa ${e.isStarred ? "fa-star" : "fa-star-o"}`}
                    />
                  </td>
                  <td class="text-left">
                    <div>
                      <h5>{e.note}</h5>
                      <label style={{ fontWeight: "normal" }}>
                        {moment(e.dateAdded).format("MM/DD/YYYY hh:mm")}
                      </label>
                      <div style={{ float: "right", marginTop: "-30px" }}>
                        {e.tag.map(f => {
                          const color = this.renderStatus(f.tagTask);
                          return (
                            <span
                              class="label"
                              style={{ margin: "5px", background: color }}
                            >
                              {f.tagTask.task}
                            </span>
                          );
                        })}
                        <span className="fa fa-ellipsis-h" />
                      </div>
                      <div style={{ float: "right" }}>
                        <span
                          className={`fa ${this.renderPrivacy(e.privacyType)}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td class="text-center" />
                </tr>
              );
            })}
          </tbody>
        </table>
        <div class="text-center">
          {notes.Loading == "RETRIEVING" && <Loading />}
          {currentPage != lastPage && (
            <a onClick={() => this.getNextResult()}>Load More Task</a>
          )}
          {notesList.length == 0 && notes.Loading != "RETRIEVING" && (
            <p>No Records Found</p>
          )}
        </div>
      </div>
    );
  }
}
