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

    
    /** ========================================================================================
     * 
     * Global Function Section
     * 
     =========================================================================================== */

    case "forgotPassword":
        require('./container/resetPassword');
        break;
}
