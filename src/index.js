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
    case "company":
        require('./container/company');
        break;
    case "project":
        switch (subpage) {
            case "home":
                require('./container/home');
                break;
            case "documents":
                require('./container/document');
                break;
            case "trash":
                require('./container/trash');
                break;
            case "processes":
                require('./container/workstream');
                break;
            case "task":
                require('./container/task');
                break;
            case "conversations":
                require('./container/home');
                break;
            default:
                require('./container/project');
                break
        }
        break;
    case "mytask":
        require('./container/home');
        break;
    case "wikis":
        require('./container/home');
        break;
    case "reports":
        require('./container/home');
        break;

    
    /** ========================================================================================
     * 
     * Global Function Section
     * 
     =========================================================================================== */

    case "forgotPassword":
        require('./container/resetPassword');
        break;
}
