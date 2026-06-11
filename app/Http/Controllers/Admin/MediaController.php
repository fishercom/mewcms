<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    /**
     * Display the media library dashboard index page.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('admin/media/index');
    }
}
