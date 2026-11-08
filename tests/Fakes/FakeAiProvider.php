<?php

namespace Tests\Fakes;

use App\Ai\AiException;
use App\Ai\AiProvider;
use App\Ai\AiResponse;

/**
 * Answers AI calls with a fixed reply and remembers the prompts it was sent.
 */
class FakeAiProvider implements AiProvider
{
    /** @var list<array{model: string, system: string, prompt: string, schema: ?array}> */
    public array $calls = [];

    /**
     * @param  array<string, mixed>|string|AiException|\Closure(string, ?array): array<string, mixed>  $reply  a closure answers from the prompt and schema
     */
    public function __construct(protected array|string|AiException|\Closure $reply = 'OK') {}

    public function text(string $model, string $system, string $prompt, int $maxTokens = 1024): AiResponse
    {
        return $this->answer($model, $system, $prompt, null);
    }

    public function structured(string $model, string $system, string $prompt, array $schema, int $maxTokens = 2048): AiResponse
    {
        return $this->answer($model, $system, $prompt, $schema);
    }

    protected function answer(string $model, string $system, string $prompt, ?array $schema): AiResponse
    {
        $this->calls[] = compact('model', 'system', 'prompt', 'schema');

        if ($this->reply instanceof AiException) {
            throw $this->reply;
        }

        $reply = $this->reply instanceof \Closure ? ($this->reply)($prompt, $schema) : $this->reply;

        return is_array($reply)
            ? new AiResponse(json_encode($reply), $reply, 1_000_000, 100_000)
            : new AiResponse($reply, null, 10, 1);
    }
}
