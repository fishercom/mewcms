<?php

namespace App\Rules;

use App\Support\ContentSanitizer;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Rejects link targets that could run script, such as "javascript:" URLs.
 */
class SafeUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! ContentSanitizer::isSafeUrl($value)) {
            $fail('La URL debe ser relativa o usar http, https, mailto o tel.');
        }
    }
}
