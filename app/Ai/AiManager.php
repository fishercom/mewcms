<?php

namespace App\Ai;

use App\Models\CmsAiUsage;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Calls the model set in .env (AI_MODEL, or AI_FAST_MODEL for small tasks), enforces the
 * monthly budget and logs every call with its tokens and estimated cost.
 */
class AiManager
{
    protected ?AiProvider $fake = null;

    /**
     * Answer every call with $provider instead of a real service (tests).
     */
    public function fake(AiProvider $provider): void
    {
        $this->fake = $provider;
    }

    /**
     * Whether a model and its key are set.
     */
    public function enabled(): bool
    {
        return $this->fake !== null || (filled(config('ai.key')) && filled(config('ai.model')) && $this->providerKey((string) config('ai.model')) !== null);
    }

    /**
     * Whether the assistant can answer now: enabled and with budget left.
     */
    public function available(): bool
    {
        return $this->enabled() && ! $this->overBudget();
    }

    /**
     * The model for a task: "fast" (metadata, rewrites) falls back to the main model.
     */
    public function model(string $task = 'quality'): string
    {
        return (string) ($task === 'fast' ? (config('ai.fast_model') ?: config('ai.model')) : config('ai.model'));
    }

    /**
     * The provider a model belongs to, told from its name; any other model goes to the
     * OpenAI-compatible service at AI_BASE_URL when one is set.
     */
    public function providerKey(string $model): ?string
    {
        foreach (config('ai.providers') as $key => $provider) {
            if (isset($provider['models'][$model]) || Str::startsWith($model, $provider['prefixes'])) {
                return $key;
            }
        }

        return filled(config('ai.base_url')) ? 'custom' : null;
    }

    /**
     * Price of a model in USD per million tokens, or null when it is not in config/ai.php.
     *
     * @return array{name: string, input: float, output: float}|null
     */
    public function price(string $model): ?array
    {
        $key = $this->providerKey($model);

        return $key ? config("ai.providers.$key.models")[$model] ?? null : null;
    }

    public function monthSpent(): float
    {
        return (float) CmsAiUsage::where('created_at', '>=', now()->startOfMonth())->sum('cost');
    }

    public function overBudget(): bool
    {
        return $this->monthSpent() >= AiSettings::all()['monthly_budget'];
    }

    /**
     * Run a call for $task ("quality" or "fast") and log it.
     *
     * @param  array<string, mixed>|null  $schema  JSON schema for a structured answer; null for text
     * @param  array{module?: ?string, item_id?: ?int}  $context
     *
     * @throws AiException
     */
    public function run(string $task, string $action, string $system, string $prompt, ?array $schema, ?User $user, array $context = [], int $maxTokens = 2048): AiResponse
    {
        if (! $this->enabled()) {
            throw new AiException(__('El asistente IA no está configurado. Define AI_MODEL y AI_API_KEY en .env.'));
        }
        if ($this->overBudget()) {
            throw new AiException(__('Se alcanzó el presupuesto mensual del asistente IA.'));
        }

        $model = $this->model($task);
        $providerKey = $this->providerKey($model) ?? 'custom';

        $response = $schema === null
            ? $this->provider($providerKey)->text($model, $system, $prompt, $maxTokens)
            : $this->provider($providerKey)->structured($model, $system, $prompt, $schema, $maxTokens);

        $price = $this->price($model) ?? ['input' => 0, 'output' => 0];
        CmsAiUsage::create([
            'user_id' => $user?->id,
            'provider' => $providerKey,
            'model' => $model,
            'action' => $action,
            'module' => $context['module'] ?? null,
            'item_id' => $context['item_id'] ?? null,
            'input_tokens' => $response->inputTokens,
            'output_tokens' => $response->outputTokens,
            'cost' => ($response->inputTokens * $price['input'] + $response->outputTokens * $price['output']) / 1_000_000,
        ]);

        return $response;
    }

    /**
     * @throws AiException
     */
    public function provider(string $key): AiProvider
    {
        if ($this->fake !== null) {
            return $this->fake;
        }

        $config = config("ai.providers.$key");
        $apiKey = (string) config('ai.key');
        if (! is_array($config) || $apiKey === '') {
            throw new AiException(__('El asistente IA no está configurado. Define AI_MODEL y AI_API_KEY en .env.'));
        }

        return match ($config['driver']) {
            'claude' => new ClaudeProvider($apiKey),
            default => new OpenAiCompatibleProvider(
                name: $config['name'],
                baseUrl: (string) (config('ai.base_url') ?: $config['base_url'] ?? ''),
                apiKey: $apiKey,
                jsonSchema: (bool) ($config['json_schema'] ?? true),
                maxTokensParam: $config['max_tokens_param'] ?? 'max_tokens',
                timeout: (int) config('ai.timeout', 60),
            ),
        };
    }
}
