<?php

/*
|--------------------------------------------------------------------------
| AI assistant
|--------------------------------------------------------------------------
|
| Set AI_MODEL and AI_API_KEY in .env; the provider is told from the model name
| (claude-..., gpt-..., deepseek-..., gemini-...). AI_FAST_MODEL, from the same provider,
| optionally answers the small frequent tasks (metadata, rewrites) for less, and
| AI_FALLBACK_MODEL (comma-separated, same provider) answers when a model is busy.
|
| AI_BASE_URL points any other OpenAI-compatible service (Mistral, Groq, a local
| Ollama...) at the chat completions API; its models have no price, so add them below
| to count them against the monthly budget.
|
*/

return [

    'model' => env('AI_MODEL', 'claude-opus-5-5'),

    'fast_model' => env('AI_FAST_MODEL'),

    // Comma-separated models of the same provider that answer when the chosen one is busy
    'fallback_models' => env('AI_FALLBACK_MODEL'),

    'key' => env('AI_API_KEY'),

    'base_url' => env('AI_BASE_URL'),

    // Known providers: how to call them and what each model costs (USD per million tokens)
    'providers' => [
        'claude' => [
            'name' => 'Claude',
            'driver' => 'claude',
            'prefixes' => ['claude-'],
            'models' => [
                'claude-opus-5-5' => ['name' => 'Claude Opus 5.5', 'input' => 4.0, 'output' => 20.0],
                'claude-sonnet-5-5' => ['name' => 'Claude Sonnet 5.5', 'input' => 2.0, 'output' => 10.0],
                'claude-haiku-5-5' => ['name' => 'Claude Haiku 5.5', 'input' => 0.10, 'output' => 0.50],
            ],
        ],

        'openai' => [
            'name' => 'OpenAI',
            'driver' => 'openai-compatible',
            'prefixes' => ['gpt-', 'o1', 'o3', 'o4', 'chatgpt-'],
            'base_url' => 'https://api.openai.com/v1',
            'json_schema' => true,
            'max_tokens_param' => 'max_completion_tokens',
            'models' => [
                'gpt-6-astra' => ['name' => 'GPT-6 Astra', 'input' => 10.0, 'output' => 50.0],
                'gpt-6.1-sol' => ['name' => 'GPT-6.1 Sol', 'input' => 2.0, 'output' => 10.0],
                'gpt-6-luna' => ['name' => 'GPT-6 Luna', 'input' => 0.10, 'output' => 0.50],
            ],
        ],

        'deepseek' => [
            'name' => 'DeepSeek',
            'driver' => 'openai-compatible',
            'prefixes' => ['deepseek-'],
            'base_url' => 'https://api.deepseek.com',
            // JSON mode only: the answer is checked and retried once when it is not valid JSON
            'json_schema' => false,
            'max_tokens_param' => 'max_tokens',
            'models' => [
                'deepseek-v4-pro' => ['name' => 'DeepSeek V4 Pro', 'input' => 1.32, 'output' => 3.96],
                'deepseek-flash' => ['name' => 'DeepSeek V4.1 Flash', 'input' => 0.30, 'output' => 1.20],
            ],
        ],

        'gemini' => [
            'name' => 'Gemini',
            'driver' => 'openai-compatible',
            'prefixes' => ['gemini-'],
            'base_url' => 'https://generativelanguage.googleapis.com/v1beta/openai',
            'json_schema' => true,
            'max_tokens_param' => 'max_tokens',
            'models' => [
                // Rises to $4 / $20 on 2026-12-01
                'gemini-4-argon' => ['name' => 'Gemini 4 Argon', 'input' => 2.0, 'output' => 10.0],
                'gemini-3.8-flash' => ['name' => 'Gemini 3.8 Flash', 'input' => 0.75, 'output' => 3.75],
                'gemini-3.1-flash-lite' => ['name' => 'Gemini 3.1 Flash-Lite', 'input' => 0.25, 'output' => 1.50],
            ],
        ],

        // Any other OpenAI-compatible service, used when AI_BASE_URL is set
        'custom' => [
            'name' => 'OpenAI-compatible',
            'driver' => 'openai-compatible',
            'prefixes' => [],
            'json_schema' => false,
            'max_tokens_param' => 'max_tokens',
            'models' => [],
        ],
    ],

    // Defaults of the settings editable in Asistente IA
    'defaults' => [
        'monthly_budget' => (float) env('AI_MONTHLY_BUDGET', 20),
        'tone' => 'neutral y profesional',
        'audience' => '',
    ],

    // Calls per user per hour
    'rate_limit' => (int) env('AI_RATE_LIMIT', 30),

    'timeout' => (int) env('AI_TIMEOUT', 180),

];
