import React from "react";
import { showToast , postData , getData } from '../../../globalFunction';
import { DropDown } from '../../../globalComponents';

import { connect } from "react-redux"
@connect((store) => {
    return {
        socket: store.socket.container,
        document: store.document,
        loggedUser: store.loggedUser,
        workstream: store.workstream,
        settings: store.settings,
        starred : store.starred,
        global : store.global,
        task : store.task,
        projectData : store.project

    }
})
export default class PrintModal extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            selectedPrinter : { value : "" , label : ""}
        }
    }

    selectPrinter( data ){
        this.setState({ selectedPrinter: { value : data.value  , label : data.label }})
    }

    printDocument(){
        let { selectedPrinter } = this.state;
        let { document : { Selected } } = this.props;

            if(selectedPrinter != ""){
                let dataToSubmit = { fileName : Selected.name , fileOrigin : Selected.origin , printer : selectedPrinter.label };
                    postData(`/api/document/printDocument`, dataToSubmit, (c) => {
                        if(c.status == 200){
                            $(`#printerModal`).modal("hide");
                            this.setState({ selectedPrinter : "" })
                        }else{

                        }
                    })
            }else{
                showToast("error","Please select printer.")
            }
    }

    render() {
        let { document } = this.props , printerOptions = []
            document.PrinterList.map((data,index) => {
                printerOptions.push({ id:index , name: data})
            })
        return (
                <div class="modal fade" id="printerModal" tabIndex="-1" role="dialog" aria-labelledby="printerModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Select Printer</h3>
                            </div>
                        <div class="modal-body">
                            <table id="dataTable" class="table responsive-table table-bordered document-table" >
                                <tbody>
                                    <tr>
                                        <th>Printer</th>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div class="form-group">
                                                <DropDown 
                                                    name="printer"
                                                    required={false}
                                                    options={ printerOptions } 
                                                    selected={ this.state.selectedPrinter.value } 
                                                    onChange={(e)=>this.selectPrinter(e)} 
                                                    /> 
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" onClick={ () => this.printDocument() }>Save</button>
                        </div>
                        </div>
                    </div>
                </div>
          )
    }
}