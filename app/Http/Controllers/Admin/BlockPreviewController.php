<?php

namespace App\Http\Controllers\Admin;

use App\Blocks\BlockRegistry;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * What a block gets on the public page (its slider with the slides, the posts of a list...),
 * so the editor can show the block as the site will. Nothing is saved.
 */
class BlockPreviewController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $input = $request->validate([
            'type' => ['required', 'string', 'max:64'],
            'data' => ['present', 'array'],
        ]);
        $type = BlockRegistry::get($input['type']);
        abort_if($type === null, 404);

        return response()->json(['data' => $type->resolve($type->sanitize($input['data']))]);
    }
}
