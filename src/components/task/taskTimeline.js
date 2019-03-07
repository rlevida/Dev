import React from "react";
import _ from "lodash";
import moment from "moment";
import { connect } from "react-redux";

import { Loading } from "../../globalComponents";
import { getData, putData, deleteData, showToast } from "../../globalFunction";
import { Chart } from "react-google-charts";

@connect(store => {
	return {
		task: store.task,
		loggedUser: store.loggedUser,
		workstream: store.workstream
	};
})
export default class TaskTimeline extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			count: {},
			loading: ""
		};

		_.map([
			"deleteData",
			"updateStatus",
			"fetchData"
		], (fn) => { this[fn] = this[fn].bind(this) });
	}

	componentDidMount() {
		this.setState({ loading: "RETRIEVING" }, () => this.fetchData(1));
	}

	fetchData(page) {
		const { dispatch, project_id, workstream_id } = this.props;
		let requestUrl = `/api/task?projectId=${project_id}&workstreamId=${workstream_id}&page=${page}&listType=timeline`;
		// const { taskStatus, dueDate, taskAssigned } = task.Filter;

		// if (taskStatus != "") {
		// 	if (taskStatus === "Active") {
		// 		requestUrl += `&status=${JSON.stringify({
		// 			opt: "not",
		// 			value: "Completed"
		// 		})}`;
		// 	} else {
		// 		requestUrl += `&status=${JSON.stringify({
		// 			opt: "eq",
		// 			value: taskStatus
		// 		})}`;
		// 	}
		// }

		// if (dueDate != "") {
		// 	requestUrl += `&dueDate=${JSON.stringify({ opt: "eq", value: dueDate })}`;
		// }

		// if (taskAssigned != "" && taskAssigned.length > 0) {
		// 	taskAssigned.map(assignedObj => {
		// 		requestUrl += `&userId=${assignedObj.value}`;
		// 	});
		// } else if (loggedUser.data.user_role[0].roleId >= 3) {
		// 	requestUrl += `&userId=${loggedUser.data.id}`;
		// }

		// if (workstream.SelectedLink == "timeline") {
		// 	requestUrl += `&workstreamId=${workstream.Selected.id}`;
		// }

		getData(requestUrl, {}, (c) => {
			this.setState({ loading: false }, () => {
				dispatch({
					type: "SET_TASK_TIMELINE",
					list: c.data.result
				});
			});
		});
	}

	getNextResult() {
		const { task } = { ...this.props };
		const { Count } = task;
		this.fetchData(Count.current_page + 1, true);
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
		const { task } = { ...this.props };
		const { Timeline } = task;
		const { loading } = { ...this.state };
		const chartLabel = [
			{ type: 'string', id: 'Date' },
			{ type: 'string', id: 'Task Name' },
			{ type: 'date', id: 'Start Date' },
			{ type: 'date', id: 'Due Date' }
		]
		const taskData = _.map(Timeline, (o, index) => {
			const { startDate, dueDate } = o;
			const startDateString = (startDate != null) ? moment(startDate).toDate() : moment(dueDate).toDate();
			const endDateString = moment(dueDate).endOf("day");
			return [
				"Task" + " - " + (index + 1).toString(),
				o.task,
				startDateString,
				endDateString
			];
		});
		const chartData = [...[chartLabel], ...taskData]

		return (
			<div class="card">
				<div class="card-header">
					<h4>Timeline</h4>
				</div>
				<div class={(loading == "RETRIEVING" && (Timeline).length == 0) ? "linear-background" : ""}>
					<div class="card-body m0">
						<div class="mt20">
							<Chart
								width={'100%'}
								height={'auto'}
								chartType="Timeline"
								loader={<Loading />}
								data={chartData}
								options={
									{
										forceIFrame:false
									}
								}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
