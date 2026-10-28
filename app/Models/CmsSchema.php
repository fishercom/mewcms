<?php

namespace App\Models;

use App\Blocks\BlockRegistry;
use App\Models\Concerns\LogsAdminActivity;
use App\Support\Themes;
use Illuminate\Database\Eloquent\Model;
use Rutorika\Sortable\SortableTrait;

class CmsSchema extends Model
{
    use LogsAdminActivity;

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    use SortableTrait;

    protected $table = 'cms_schemas';

    protected $fillable = ['group_id', 'name', 'fields', 'allowed_blocks', 'default_blocks', 'front_view', 'active'];

    protected static $sortableField = 'position';

    protected static $sortableGroupField = 'group_id';

    protected $casts = [
        'fields' => 'array',
        'allowed_blocks' => 'array',
        'default_blocks' => 'array',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $schema): void {
            // Known block keys only; none or every one of them means "no limit"
            if ($schema->isDirty('allowed_blocks')) {
                $keys = array_keys(BlockRegistry::types());
                $allowed = array_values(array_intersect($keys, is_array($schema->allowed_blocks) ? $schema->allowed_blocks : []));
                $schema->allowed_blocks = $allowed === [] || count($allowed) === count($keys) ? null : $allowed;
            }
            if ($schema->isDirty('default_blocks')) {
                $blocks = BlockRegistry::sanitize($schema->default_blocks ?? []);
                $schema->default_blocks = $blocks === [] ? null : $blocks;
            }
        });
    }

    public function parent()
    {
        return $this->hasOne(CmsSchema::class, 'id', 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(CmsSchema::class, 'parent_id');
    }

    public function articles()
    {
        return $this->hasMany(CmsArticle::class, 'schema_id');
    }

    public static function getAvailableTemplates(): array
    {
        // The default theme's templates, plus any the current site's theme adds
        $templates = [];
        foreach (Themes::templateFiles() as $file => $filePath) {
            $content = file_get_contents($filePath);

            $templateName = null;
            if (preg_match('/Template\s+Name:\s*([^\r\n\*]+)/i', $content, $matches)) {
                $templateName = trim($matches[1]);
            }

            if (! $templateName) {
                $templateName = ucfirst(basename($file, '.tsx'));
            }

            $unique = false;
            if (preg_match('/Unique:\s*([^\r\n\*]+)/i', $content, $matches)) {
                $unique = filter_var(trim($matches[1]), FILTER_VALIDATE_BOOLEAN);
            }

            $value = 'front/templates/'.basename($file, '.tsx');

            $templates[] = [
                'name' => $templateName,
                'value' => $value,
                'file' => $file,
                'unique' => $unique,
            ];
        }

        return $templates;
    }

    /**
     * Templates used only by posts, not offered in the page editor.
     */
    public const POST_TEMPLATES = ['front/templates/post'];

    /**
     * Names for the field groups created automatically for templates that have none.
     */
    protected const DEFAULT_NAMES = [
        'front/templates/page' => 'Página estándar',
        'front/templates/home' => 'Página de inicio',
    ];

    /**
     * Template files a page can use.
     *
     * @return list<array{name: string, value: string, file: string, unique: bool}>
     */
    public static function pageTemplates(): array
    {
        return array_values(array_filter(
            self::getAvailableTemplates(),
            fn (array $template): bool => ! in_array($template['value'], self::POST_TEMPLATES, true),
        ));
    }

    /**
     * Give every page template an active field group, so picking a template always
     * resolves to one. Existing groups are left untouched. Safe to run repeatedly.
     */
    public static function ensureTemplateDefaults(): void
    {
        $groupId = CmsSchemaGroup::where('default', true)->value('id') ?? CmsSchemaGroup::value('id');
        if (! $groupId) {
            return;
        }

        foreach (self::pageTemplates() as $template) {
            if (self::where('front_view', $template['value'])->where('active', true)->exists()) {
                continue;
            }

            $schema = new self([
                'group_id' => $groupId,
                'name' => self::DEFAULT_NAMES[$template['value']] ?? $template['name'],
                'fields' => [],
                'front_view' => $template['value'],
                'active' => true,
            ]);
            $schema->type = 'PAGE';
            $schema->save();
        }
    }

    public function isUnique(): bool
    {
        if (! $this->front_view) {
            return false;
        }

        $filePath = Themes::templateFiles()[basename($this->front_view).'.tsx'] ?? null;
        if ($filePath === null) {
            return false;
        }

        $content = file_get_contents($filePath);
        if (preg_match('/Unique:\s*([^\r\n\*]+)/i', $content, $matches)) {
            return filter_var(trim($matches[1]), FILTER_VALIDATE_BOOLEAN);
        }

        return false;
    }

    public function adminActivityModule(): string
    {
        return 'schemas';
    }
}
