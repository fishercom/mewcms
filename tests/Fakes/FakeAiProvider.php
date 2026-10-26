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
     * @param  array<string, mixed>|string|AiException  $reply
     */
    public function __construct(protected array|string|AiException $reply = 'OK') {}

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

        return is_array($this->reply)
            ? new AiResponse(json_encode($this->reply), $this->reply, 1_000_000, 100_000)
            : new AiResponse($this->reply, null, 10, 1);
    }
}
