import React from "react";
import { Loading } from "../../globalComponents";
import { getData, postData, putData, showToast, displayDateMD } from '../../globalFunction';

import { connect } from "react-redux"
import { withRouter } from "react-router";

import moment from "moment";

@connect((store) => {
    return {
        loggedUser: store.loggedUser,
        notification: store.notification
    }
})

class DocumentList extends React.Component {
    constructor(props) {
        super(props)
    }

    componentDidMount() {
        const { match } = { ...this.props }
        
    }

    render() {
        // const { notifcation } = { ...this.props };
        // const { Count } = { ...notifcation };
        // const currentPage = (typeof Count.current_page != "undefined") ? Count.current_page : 1;
        // const lastPage = (typeof Count.last_page != "undefined") ? Count.last_page : 1;

        return (
            <div>
                <div>
                    <div class="card-header">
                    </div>
                    <div>
                        {/* <div class={(document.Loading == "RETRIEVING" && (document.List).length == 0) ? "linear-background" : ""}> */}
                        <div class="card-body m0">
                            <div>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope="col" class="td-left" >Notification</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default withRouter(DocumentList);