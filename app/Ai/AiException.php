<?php

namespace App\Ai;

use RuntimeException;

/**
 * A failed AI call. The message is safe to show the editor; it never holds the API key.
 */
class AiException extends RuntimeException {}
