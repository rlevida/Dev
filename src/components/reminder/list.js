import React from "react"
import ReactDOM from "react-dom"
import Select from 'react-select'
import moment from 'moment'
import Tooltip from "react-tooltip";

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        loggedUser: store.loggedUser,
        users: store.users,
        reminder : store.reminder
    }
})

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props)
    }

    componentWillMount(){
        let { socket } = this.props;
            socket.emit("GET_USER_LIST",{});
    }
    viewTask(data){
        let { dispatch , socket } = this.props;
            dispatch({ type : "SET_REMINDER_FORM_ACTIVE" , FormActive : "Form"  })
            dispatch({ type : "SET_TASK_SELECTED" , Selected : data })
            socket.emit("SAVE_OR_UPDATE_REMINDER", { data : { id : data.reminderId , seen : 1 } , filter :{ projectId : data.projectId , usersId : data.usersId} } )
    }
    render() {
        let { reminder , loggedUser } = this.props;
        let reminderList = reminder.List.filter( e =>{ return e.usersId == loggedUser.data.id })
   
        return  <div>
                    <h1>Reminder</h1>
                    <table class="table responsive-table table-bordered">
                        <tbody>
                            <tr>
                                <th class="text-center">Task</th>
                                <th class="text-center">Reminder Detail</th>
                                <th class="text-center">Due Date</th>
                                <th></th>

                            </tr>
                            { reminderList.length > 0 && 
                                reminderList.map((data,index) =>{
                                    return (
                                        <tr key={index}>
                                            <td>{data.task}</td>
                                            <td>{data.reminderDetail}</td>
                                            <td>{(data.dueDate != '' && data.dueDate != null) ? moment(data.dueDate).format('YYYY MMM DD') : ''}</td>
                                            <td><a href="javascript:void(0)" class="btn btn-primary" data-tip="View" onClick={()=> this.viewTask(data)}><span class="fa fa-eye"></span></a></td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
    }
}