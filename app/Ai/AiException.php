<?php

namespace App\Ai;

use RuntimeException;

/**
 * A failed AI call. The message is safe to show the editor; it never holds the API key.
 * A retryable failure (busy, rate-limited or unreachable service) lets the next fallback
 * model answer instead.
 */
class AiException extends RuntimeException
{
    public function __construct(string $message = '', public readonly bool $retryable = false, ?\Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}
