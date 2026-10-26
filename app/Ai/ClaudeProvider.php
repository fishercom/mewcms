<?php

namespace App\Ai;

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Messages\JSONOutputFormat;
use Throwable;

/**
 * Claude through the official Anthropic PHP SDK (composer require anthropic-ai/sdk).
 */
class ClaudeProvider implements AiProvider
{
    public function __construct(protected string $apiKey) {}

    public function text(string $model, string $system, string $prompt, int $maxTokens = 1024): AiResponse
    {
        return $this->send($model, $system, $prompt, null, $maxTokens);
    }

    public function structured(string $model, string $system, string $prompt, array $schema, int $maxTokens = 2048): AiResponse
    {
        return $this->send($model, $system, $prompt, $schema, $maxTokens);
    }

    /**
     * @param  array<string, mixed>|null  $schema
     */
    protected function send(string $model, string $system, string $prompt, ?array $schema, int $maxTokens): AiResponse
    {
        if (! class_exists(Client::class)) {
            throw new AiException(__('Falta el SDK de Anthropic. Ejecuta: composer require anthropic-ai/sdk'));
        }

        $request = [
            'model' => $model,
            'maxTokens' => $maxTokens,
            // The system prompt is the same for every call of a site, so it is cached
            'system' => [['type' => 'text', 'text' => $system, 'cacheControl' => ['type' => 'ephemeral']]],
            'messages' => [['role' => 'user', 'content' => $prompt]],
        ];
        if ($schema !== null) {
            $request['outputConfig'] = ['format' => JSONOutputFormat::with($schema)];
        }

        try {
            $message = (new Client(apiKey: $this->apiKey))->messages->create(...$request);
        } catch (APIStatusException $e) {
            $type = $e->type?->value;
            throw new AiException(
                __('Claude respondió con un error (:status).', ['status' => $type ?? $e->getCode()]),
                retryable: in_array($type, ['overloaded_error', 'rate_limit_error', 'api_error'], true),
                previous: $e,
            );
        } catch (Throwable $e) {
            throw new AiException(__('No se pudo conectar con :provider.', ['provider' => 'Claude']), retryable: true, previous: $e);
        }

        if ($message->stopReason === 'refusal') {
            throw new AiException(__('El modelo no quiso responder a esta solicitud.'));
        }

        $text = '';
        foreach ($message->content as $block) {
            if ($block->type === 'text') {
                $text .= $block->text;
            }
        }

        $data = null;
        if ($schema !== null) {
            $data = json_decode($text, true);
            if (! is_array($data)) {
                throw new AiException(__('La respuesta del modelo no tiene el formato esperado.'));
            }
        }

        $usage = $message->usage;

        return new AiResponse(
            text: $text,
            data: $data,
            inputTokens: $usage->inputTokens + ($usage->cacheCreationInputTokens ?? 0) + ($usage->cacheReadInputTokens ?? 0),
            outputTokens: $usage->outputTokens,
        );
    }
}
