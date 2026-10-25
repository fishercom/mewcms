<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public Registration
    |--------------------------------------------------------------------------
    |
    | When disabled, the /register routes return 404. Users created through
    | public registration have no profile, so they cannot reach the admin
    | until an administrator assigns them one.
    |
    */

    'registration' => (bool) env('CMS_ALLOW_REGISTRATION', false),

    /*
    |--------------------------------------------------------------------------
    | Template File Editor
    |--------------------------------------------------------------------------
    |
    | The template editor writes .tsx source files that become executable
    | code on the next front-end build. It is only available to super
    | administrators, and only when this flag is enabled.
    |
    */

    'template_editor' => (bool) env('CMS_TEMPLATE_EDITOR', env('APP_ENV') === 'local'),

];
