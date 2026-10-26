<?php

namespace App\Ai;

final readonly class AiResponse
{
    /**
     * @param  array<string, mixed>|null  $data  the decoded answer of a structured call
     */
    public function __construct(
        public string $text,
        public ?array $data,
        public int $inputTokens,
        public int $outputTokens,
    ) {}
}
