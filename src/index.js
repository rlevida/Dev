import React from "react";
import ReactDOM from "react-dom";

switch (page) {
       
    /** ========================================================================================
     * 
     * Authentication Section
     * 
     =========================================================================================== */

    case "auth":
        require('./container/auth');
        break;


    /** ========================================================================================
     * 
     * Home Section
     * 
     =========================================================================================== */

    case "index":
        require('./container/home');
        break;
    case "users":
        require('./container/users');
        break;
    case "project":
        switch (subpage) {
            case "home":
                require('./container/projectDashboard');
                break;
            case "documents":
                require('./container/document');
                break;
            case "trash":
                require('./container/trash');
                break;
            case "workstream":
                require('./container/workstream');
                break;
            case "task":
                require('./container/task');
                break;
            case "conversations":
                require('./container/conversations');
                break;
            default:
                require('./container/project');
                break
        }
        break;
    case "mytask":
        require('./container/myTasks');
        break;
    case "wikis":
        require('./container/pageNotAvailable');
        break;
    case "reports":
        require('./container/pageNotAvailable');
        break;
    case "pageNotAvailable":
        require('./container/pageNotAvailable');
        break;
    case "noProjectAvailable":
        require('./container/noProjectAvailable')
        break
        
    /** ========================================================================================
     * 
     * Global Function Section
     * 
     =========================================================================================== */

    case "forgotPassword":
        require('./container/resetPassword');
        break;
    case "profile":
        require('./container/profile');
        break;
    case "reminder":
        require('./container/reminder');
        break;
}
