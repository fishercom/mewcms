<?php

namespace App\Ai;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

/**
 * Any service with an OpenAI-style chat completions API: OpenAI, DeepSeek and Gemini
 * today, and Mistral, Groq or a local Ollama later with only a base URL and a key.
 */
class OpenAiCompatibleProvider implements AiProvider
{
    /**
     * @param  bool  $jsonSchema  the service enforces a JSON schema; otherwise JSON mode is used
     *                            and the answer is retried once when it is not valid JSON
     */
    public function __construct(
        protected string $name,
        protected string $baseUrl,
        protected string $apiKey,
        protected bool $jsonSchema = true,
        protected string $maxTokensParam = 'max_tokens',
        protected int $timeout = 180,
    ) {}

    public function text(string $model, string $system, string $prompt, int $maxTokens = 1024): AiResponse
    {
        $answer = $this->send([
            'model' => $model,
            'messages' => $this->messages($system, $prompt),
            $this->maxTokensParam => $maxTokens,
        ]);

        return new AiResponse($answer['text'], null, $answer['input'], $answer['output']);
    }

    public function structured(string $model, string $system, string $prompt, array $schema, int $maxTokens = 2048): AiResponse
    {
        if ($this->jsonSchema) {
            $format = ['type' => 'json_schema', 'json_schema' => ['name' => 'answer', 'strict' => true, 'schema' => $schema]];
        } else {
            // JSON mode needs the word "JSON" and the expected shape in the prompt
            $format = ['type' => 'json_object'];
            $prompt .= "\n\nResponde solo con un objeto JSON que siga este JSON Schema:\n".json_encode($schema, JSON_UNESCAPED_UNICODE);
        }

        $request = [
            'model' => $model,
            'messages' => $this->messages($system, $prompt),
            'response_format' => $format,
            $this->maxTokensParam => $maxTokens,
        ];

        $input = $output = 0;
        for ($attempt = 1; $attempt <= ($this->jsonSchema ? 1 : 2); $attempt++) {
            $answer = $this->send($request);
            $input += $answer['input'];
            $output += $answer['output'];

            $data = json_decode($answer['text'], true);
            if (is_array($data)) {
                return new AiResponse($answer['text'], $data, $input, $output);
            }
        }

        throw new AiException(__('La respuesta del modelo no tiene el formato esperado.'));
    }

    /**
     * @return list<array{role: string, content: string}>
     */
    protected function messages(string $system, string $prompt): array
    {
        return [
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => $prompt],
        ];
    }

    /**
     * @param  array<string, mixed>  $request
     * @return array{text: string, input: int, output: int}
     */
    protected function send(array $request): array
    {
        try {
            // A busy or rate-limited service often answers on a second try
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->timeout($this->timeout)
                ->retry(2, 2000, fn (Throwable $e): bool => $e instanceof RequestException && in_array($e->response->status(), [429, 500, 502, 503, 504], true), throw: false)
                ->post(rtrim($this->baseUrl, '/').'/chat/completions', $request);
        } catch (ConnectionException $e) {
            throw new AiException(__('No se pudo conectar con :provider.', ['provider' => $this->name]), previous: $e);
        }

        if ($response->failed()) {
            // OpenAI-style {"error": {"message"}}; Gemini may wrap it in a list
            $message = $response->json('error.message') ?? $response->json('0.error.message');
            throw new AiException(__(':provider respondió con un error (:status).', ['provider' => $this->name, 'status' => $response->status()])
                .(is_string($message) && $message !== '' ? ' '.Str::limit(strip_tags($message), 200) : ''));
        }

        $choice = $response->json('choices.0');
        if (($choice['finish_reason'] ?? null) === 'content_filter' || ! empty($choice['message']['refusal'] ?? null)) {
            throw new AiException(__('El modelo no quiso responder a esta solicitud.'));
        }

        return [
            'text' => (string) ($choice['message']['content'] ?? ''),
            'input' => (int) $response->json('usage.prompt_tokens', 0),
            'output' => (int) $response->json('usage.completion_tokens', 0),
        ];
    }
}
