import React from "react"
import { displayDate } from "../../globalFunction";
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

    viewTask(data){
        let { dispatch , socket } = this.props;
            dispatch({ type : "SET_REMINDER_FORM_ACTIVE" , FormActive : "Form"  })
            dispatch({ type : "SET_TASK_SELECTED" , Selected : data })
            socket.emit("SAVE_OR_UPDATE_REMINDER", { data : { id : data.reminderId , seen : 1 } , filter :{ projectId : data.projectId , usersId : data.usersId} } )
    }
    render() {
        let { reminder , loggedUser } = this.props;
        let reminderUnseen = _.orderBy(reminder.List.filter( e => { return !e.seen}),['dateAdded'],['desc'])
        let reminderSeen = _.orderBy(reminder.List.filter( e => { return e.seen}),['dateAdded'],['desc'])// reminderSeen = _.orderBy()
        
        return  <div>
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">Reminder</h3>
                        </div>
                        <div class="panel-body">
                            <table class="table responsive-table table-bordered">
                                <tbody>
                                    <tr>
                                        <th class="text-center"></th>
                                        <th class="text-center">Reminder Detail</th>
                                        <th class="text-center">Date</th>
                                        <th></th>

                                    </tr>
                                    { reminderUnseen.length > 0 && 
                                        reminderUnseen.map((data,index) =>{
                                            return (
                                                <tr key={index} style={{fontWeight: data.seen == 0 ? "bold" : ""}}>
                                                    <td>{data.taskName}</td>
                                                    <td>{data.reminderDetail}</td>
                                                    <td>{displayDate(data.dateAdded)}</td>
                                                    <td><a href="javascript:void(0)" class="btn btn-primary" data-tip="View" onClick={()=> this.viewTask(data)}><span class="fa fa-eye"></span></a></td>
                                                </tr>
                                            )
                                        })
                                       
                                    }
                                    {  reminderSeen.length > 0 && 
                                         reminderSeen.map((data,index) => {
                                            return (
                                                <tr key={index} style={{fontWeight: data.seen == 0 ? "bold" : ""}}>
                                                    <td>{data.taskName}</td>
                                                    <td>{data.reminderDetail}</td>
                                                    <td>{displayDate(data.dateAdded)}</td>
                                                    <td><a href="javascript:void(0)" class="btn btn-primary" data-tip="View" onClick={()=> this.viewTask(data)}><span class="fa fa-eye"></span></a></td>
                                                </tr>
                                            )
                                        })
                                    }
                                    {
                                        (reminderUnseen.length == 0 && reminderSeen.length == 0) &&
                                        <tr>
                                            <td colSpan={8}>No Reminder Found!</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
    }
}