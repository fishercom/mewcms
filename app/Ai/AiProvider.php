<?php

namespace App\Ai;

/**
 * One AI service (Claude, OpenAI, DeepSeek, Gemini...). Drivers only translate the call;
 * prompts, budgets and usage logging live in AiManager and ContentAssistant.
 */
interface AiProvider
{
    /**
     * A plain text answer.
     *
     * @throws AiException
     */
    public function text(string $model, string $system, string $prompt, int $maxTokens = 1024): AiResponse;

    /**
     * A JSON answer that follows $schema (an object schema with every property required
     * and no additional properties).
     *
     * @param  array<string, mixed>  $schema
     *
     * @throws AiException
     */
    public function structured(string $model, string $system, string $prompt, array $schema, int $maxTokens = 2048): AiResponse;
}
