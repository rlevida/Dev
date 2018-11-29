import React from "react";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";

import TaskStatus from "./taskStatus";
import TaskFilter from "./taskFilter";
import { Loading } from "../../globalComponents";
import { getData, putData, deleteData, showToast } from "../../globalFunction";
import { Chart } from "react-google-charts";

@connect(store => {
  return {
    socket: store.socket.container,
    task: store.task,
    loggedUser: store.loggedUser
  };
})
export default class List extends React.Component {
  constructor(props) {
    super(props);

    this.deleteData = this.deleteData.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    const { dispatch } = this.props;

    dispatch({ type: "SET_TASK_LOADING", Loading: "RETRIEVING" });
    dispatch({ type: "SET_TASK_LIST", list: [] });
    this.fetchData(1);
  }

  fetchData(page) {
    const { dispatch, task, loggedUser } = this.props;

    let requestUrl = `/api/task?projectId=${project}&page=${page}&starredUser=${loggedUser.data.id}&listType=timeline`;
    const { taskStatus, dueDate, taskAssigned } = task.Filter;

    if (taskStatus != "") {
      requestUrl += `&status=${JSON.stringify({ opt: "eq", value: taskStatus })}`
    }

    if (dueDate != "") {
      requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`
    }

    if (taskAssigned != "" && taskAssigned.length > 0) {
      taskAssigned.map((assignedObj) => {
        requestUrl += `&userId=${assignedObj.value}`
      });
    } else if (loggedUser.data.user_role[0].roleId >= 3) {
      requestUrl += `&userId=${loggedUser.data.id}`
    }

    getData(requestUrl, {}, c => {
      dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.result, Count: c.data.count });
      dispatch({ type: "SET_TASK_LOADING", Loading: "" });
    });
  }

  getNextResult() {
    const { task } = { ...this.props };
    const { Count } = task;
    this.fetchData(Count.current_page + 1);
  }

  updateStatus({ id, periodTask, periodic }) {
    let { dispatch, loggedUser } = this.props;

    putData(
      `/api/task/status/${id}`,
      {
        userId: loggedUser.data.id,
        periodTask,
        periodic,
        id,
        status: "Completed"
      },
      c => {
        if (c.status == 200) {
          dispatch({ type: "UPDATE_DATA_TASK_LIST", List: c.data.task });
          showToast("success", "Task successfully updated.");
        } else {
          showToast("error", "Something went wrong please try again later.");
        }
        dispatch({ type: "SET_TASK_LOADING", Loading: "" });
      }
    );
  }

  deleteData(id) {
    let { dispatch } = this.props;

    if (confirm("Do you really want to delete this record?")) {
      deleteData(`/api/task/${id}`, {}, c => {
        if (c.status == 200) {
          dispatch({ type: "DELETE_TASK", id });
          showToast("success", "Task successfully deleted.");
        } else {
          showToast("error", "Something went wrong please try again later.");
        }
      });
    }
  }

  render() {
    const { task } = this.props;
    const currentPage =
      typeof task.Count.current_page != "undefined"
        ? task.Count.current_page
        : 1;
    const lastPage = typeof task.Count.last_page != "undefined" ? task.Count.last_page : 1;
    const taskList = task.List;
    const chartData = [
      [
        { type: "string", label: "Task ID" },
        { type: "string", label: "Task Name" },
        { type: "string", label: "Resource" },
        { type: "date", label: "Start Date" },
        { type: "date", label: "End Date" },
        { type: "number", label: "Duration" },
        { type: "number", label: "Percent Complete" },
        { type: "string", label: "Dependencies" }
      ],
      ..._.map(taskList, (data) => {
        return [
          data.id,
          data.task,
          null,
          new Date(data.startDate),
          moment(data.dueDate).endOf('day').toDate(),
          100,
          100,
          null
        ];
      })
    ];
    return (
      <div class="pd0">
        <div class="row mb10 mt10">
          <div class="col-lg-6 status-div">
            <TaskStatus />
          </div>
        </div>
        <div class="row mb10">
          <div class="col-lg-10 pd0">
            <TaskFilter />
          </div>
        </div>
        {
          (task.Loading == "RETRIEVING") && <Loading />
        }
        {
          (task.Loading != "RETRIEVING" && taskList.length > 0) && <div>
            <Chart
              width={"100%"}
              height={42 * chartData.length}
              chartType="Gantt"
              loader={<Loading />}
              data={chartData}
            />
          </div>
        }
        <div class="text-center">
          {
            (currentPage != lastPage && task.Loading != "RETRIEVING") && <a onClick={() => this.getNextResult()}>Load More Task</a>
          }
          {
            (taskList.length == 0 && task.Loading != "RETRIEVING") && <p>No Records Found</p>
          }
        </div>
      </div>
    );
  }
}
