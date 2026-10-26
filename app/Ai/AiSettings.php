<?php

namespace App\Ai;

use App\Models\CmsConfig;

/**
 * Assistant settings editable in the admin (the model and key live in .env), stored in
 * cms_configs under "ai_*" aliases.
 * A missing row falls back to config/ai.php, so a fresh install works with no setup.
 */
class AiSettings
{
    /** Setting => [cms_configs alias, label] */
    public const FIELDS = [
        'monthly_budget' => ['ai_monthly_budget', 'Asistente IA: presupuesto mensual (USD)'],
        'tone' => ['ai_tone', 'Asistente IA: tono'],
        'audience' => ['ai_audience', 'Asistente IA: público'],
    ];

    /**
     * @return array{monthly_budget: float, tone: string, audience: string}
     */
    public static function all(): array
    {
        $stored = CmsConfig::whereIn('alias', array_column(self::FIELDS, 0))->pluck('value', 'alias');
        $settings = [];
        foreach (self::FIELDS as $key => [$alias]) {
            $value = $stored[$alias] ?? null;
            $settings[$key] = $value === null || $value === '' ? config("ai.defaults.$key") : $value;
        }
        $settings['monthly_budget'] = (float) $settings['monthly_budget'];
        $settings['audience'] = (string) $settings['audience'];

        return $settings;
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public static function save(array $settings): void
    {
        foreach (self::FIELDS as $key => [$alias, $label]) {
            if (array_key_exists($key, $settings)) {
                CmsConfig::updateOrCreate(['alias' => $alias], ['type' => 'string', 'name' => $label, 'value' => (string) $settings[$key]]);
            }
        }
    }
}
